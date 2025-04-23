import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import Job from "../models/jobModel.js";
import { logger } from "../config/logger.js";

export const analyzeBias = async (req, res) => {
  try {
    logger.info("Starting bias analysis");

    const { contextFields, fieldsToAnalyze } = req.body;
    // Get the user ID from auth middleware
    const userId = req.user?.id || "unknown";

    logger.info("Bias analysis requested", {
      userId,
      fieldsCount: Object.keys(fieldsToAnalyze || {}).length,
    });

    // Better input data validation and formatting
    const hasContent = (content) => {
      if (Array.isArray(content)) {
        return content.some((item) => item && item.trim().length > 0);
      }
      return content && content.trim().length > 0;
    };

    // Clean up array inputs - split by commas if they contain commas
    logger.info("Processing input fields");
    const fieldsWithContent = {};

    try {
      for (const [field, content] of Object.entries(fieldsToAnalyze)) {
        if (!hasContent(content)) continue;

        if (Array.isArray(content)) {
          // Process each array item separately to avoid errors
          const cleanedArray = [];
          for (const item of content) {
            if (item && typeof item === "string") {
              const parts = item.split(/,\s*/).filter((p) => p && p.trim());
              cleanedArray.push(...parts);
            }
          }
          fieldsWithContent[field] = cleanedArray.join("\n");
        } else if (content && typeof content === "string") {
          fieldsWithContent[field] = content;
        }
      }
    } catch (processingError) {
      logger.error("Error processing input data", {
        error: processingError.message,
      });
      return res.status(400).json({
        success: false,
        error: "Error processing input data",
      });
    }

    // Create local bias analysis function for fallback
    const localBiasDetection = (field, text) => {
      const biasIndicators = {
        gender: [
          "he",
          "him",
          "his",
          "she",
          "her",
          "hers",
          "man",
          "woman",
          "men",
          "women",
          "guys",
          "gals",
          "male",
          "female",
          "gentleman",
          "lady",
          "ladies",
          "gentlemen",
          "manpower",
          "mankind",
          "chairman",
          "foreman",
          "policeman",
          "stewardess",
        ],
        age: [
          "young",
          "old",
          "fresh",
          "energetic",
          "recent graduate",
          "digital native",
          "seasoned",
          "veteran",
          "experienced",
          "mature",
        ],
        race: [
          "articulate",
          "intelligent",
          "well-spoken",
          "culture fit",
          "cultural fit",
        ],
        ability: [
          "able-bodied",
          "physically fit",
          "stand for long periods",
          "lift",
          "carry",
        ],
      };

      let foundBias = false;
      let biasType = null;
      let suggestions = [];
      let explanation = "No obvious bias detected";

      if (!text)
        return {
          hasBias: false,
          biasType: null,
          suggestions: [],
          explanation: "No content to analyze",
        };

      const lowercaseText = text.toLowerCase();

      // Very basic bias detection
      for (const [type, indicators] of Object.entries(biasIndicators)) {
        for (const indicator of indicators) {
          if (lowercaseText.includes(indicator.toLowerCase())) {
            foundBias = true;
            biasType = type;

            // Simple suggestions
            if (type === "gender") {
              suggestions.push("Use gender-neutral language");
              explanation =
                "The text contains gender-specific terms that could be more inclusive";
            } else if (type === "age") {
              suggestions.push("Use age-inclusive language");
              explanation =
                "The text contains age-related terms that might exclude some candidates";
            } else if (type === "race") {
              suggestions.push("Use culturally inclusive language");
              explanation =
                "The text contains terms that could have racial implications";
            } else if (type === "ability") {
              suggestions.push("Consider accessibility in requirements");
              explanation =
                "The text contains terms that might exclude people with different abilities";
            }

            break;
          }
        }
        if (foundBias) break;
      }

      return {
        hasBias: foundBias,
        biasType: biasType,
        suggestions: suggestions,
        explanation: explanation,
      };
    };

    // Generate fallback analysis for each field
    const fallbackAnalysis = {};
    for (const [field, content] of Object.entries(fieldsWithContent)) {
      fallbackAnalysis[field] = localBiasDetection(field, content);
    }

    // Check if API key exists without exposing it
    if (!process.env.GEMINI_API_KEY) {
      logger.error("Missing Gemini API key");
      return res.json({
        success: true,
        recommendations: fallbackAnalysis,
        note: "Analysis performed locally due to missing API key",
      });
    }

    logger.info("Creating Gemini client with schema");

    try {
      // Define the schema for our bias analysis response
      const fieldNames = Object.keys(fieldsWithContent);
      const properties = {};

      // Dynamically build properties for each field
      fieldNames.forEach((fieldName) => {
        properties[fieldName] = {
          type: SchemaType.OBJECT,
          properties: {
            hasBias: {
              type: SchemaType.BOOLEAN,
              description: "Whether bias was detected in this field",
            },
            biasType: {
              type: SchemaType.STRING,
              description:
                "The type of bias detected (gender, age, race, ability, etc.) or null if none",
              nullable: true,
            },
            suggestions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.STRING,
                description: "Suggestion to fix the bias",
              },
              description: "List of suggestions to fix the bias",
            },
            explanation: {
              type: SchemaType.STRING,
              description: "Explanation of the bias detected",
            },
          },
          required: ["hasBias", "biasType", "suggestions", "explanation"],
        };
      });

      // Create the schema
      const schema = {
        type: SchemaType.OBJECT,
        properties: properties,
        required: fieldNames,
      };

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.2,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const prompt = `
      Analyze the following job description fields for bias.
      
      Context Information:
      ${JSON.stringify(contextFields || {}, null, 2)}
      
      Fields to Analyze:
      ${JSON.stringify(fieldsWithContent, null, 2)}
      
      Check for gender, age, race, ability, and other forms of bias. 
      Some examples of bias to look for:
      - Gender bias: gendered terms, stereotypes about men/women
      - Age bias: terms that favor younger or older workers
      - Race/cultural bias: terms with racial implications or cultural assumptions
      - Ability bias: requirements that unnecessarily exclude people with disabilities
      
      Return a single JSON object with this structure:
      {
        "fieldName": {
          "hasBias": boolean,
          "biasType": string or null,
          "suggestions": array of strings,
          "explanation": string
        }
      }
      
      IMPORTANT: In the suggestions array, include the replacement words or phrases in the biased phrases. 
      For the other phrases not containing bias, include them the same. Keep the bullet points.
      Example: If "smart men" is biased, suggestions should be ["talented individuals", "skilled professionals"] 
      NOT ["Replace 'smart men' with 'talented individuals'"]
      
      Ensure you ONLY return valid JSON with no additional text or formatting.`;
      logger.info("Sending request to Gemini API with schema");
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const response = result.response;
      let analysisText = response.text();
      // Add debug logging to print the full response
      console.log("=== FULL GEMINI API RESPONSE ===");
      console.log(analysisText);
      console.log("=== END RESPONSE ===");

      logger.debug("Full Gemini API response", {
        raw: analysisText,
        length: analysisText.length,
      });
      // Clean up potential formatting issues in the response
      analysisText = analysisText
        .replace(/```json\s*|\s*```$/g, "") // Remove any markdown code blocks
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // Replace curly quotes with straight quotes
        .trim();

      // Extract JSON if it's wrapped in other text
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisText = jsonMatch[0];
      }

      try {
        const analysis = JSON.parse(analysisText);

        // Verify all fields are present in the response
        let allFieldsPresent = true;
        for (const field of Object.keys(fieldsWithContent)) {
          if (!analysis[field]) {
            allFieldsPresent = false;
            analysis[field] = {
              hasBias: false,
              biasType: null,
              suggestions: [],
              explanation: "No analysis available for this field",
            };
          }
        }

        res.json({
          success: true,
          recommendations: analysis,
          note: allFieldsPresent
            ? undefined
            : "Some fields had to be supplemented with default analysis",
        });
      } catch (parseError) {
        logger.error("Failed to parse AI response", {
          error: parseError.message,
          rawResponse: analysisText.substring(0, 500) + "...", // Log partial response
        });

        // Fall back to local analysis
        return res.json({
          success: true,
          recommendations: fallbackAnalysis,
          note: "Fell back to local analysis due to API response parsing error",
        });
      }
    } catch (error) {
      logger.error("Gemini API error", {
        error: error.message,
        stack: error.stack,
      });

      // Fall back to local analysis
      return res.json({
        success: true,
        recommendations: fallbackAnalysis,
        note: "Analysis performed locally due to AI service connectivity issues",
      });
    }
  } catch (error) {
    logger.error("Bias analysis failed", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: "Failed to analyze bias",
    });
  }
};
