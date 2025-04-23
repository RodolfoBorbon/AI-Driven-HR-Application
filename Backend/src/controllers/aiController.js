import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../config/logger.js";

// Auto-complete job description controller
export const autoCompleteJobDescription = async (req, res) => {
  try {
    const { jobTitle } = req.body;
    const userId = req.user?.id || "unknown";

    if (!jobTitle || jobTitle.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Job title is required",
      });
    }

    logger.info("Auto-complete job description requested", {
      jobTitle,
      userId,
    });

    // Initialize Gemini API
    if (!process.env.GEMINI_API_KEY) {
      logger.error("Missing Gemini API key");
      return res.status(500).json({
        success: false,
        error: "API configuration error",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Create a prompt for Gemini
    const prompt = `
    Generate professional content for a job description based on the job title: "${jobTitle}".
    
    Return the response as a JSON object with these fields:
    1. positionSummary: A detailed overview of the role (2-3 paragraphs)
    2. keyResponsibilities: 6-8 key responsibilities for this role as an array of bullet points
    3. requiredSkills: 5-7 must-have skills and qualifications as an array of bullet points
    4. preferredSkills: 3-5 nice-to-have skills as an array of bullet points
    
    Make sure to:
    - Be specific and detailed
    - Use industry-standard terminology
    - Format the content professionally

    IMPORTANT - Carefully avoid ALL forms of bias in the content:
    - Use "relevant experience" instead of "demonstrated experience" or specifying years
    - Gender bias: Avoid gendered terms (he/she, him/her, guys, manpower, etc.)
    - Age bias: 
      * AVOID ALL references to years or length of experience (e.g., "3+ years", "extensive experience")
      * Use phrases like "relevant experience in" or "proficiency with" instead
      * Avoid terms like "young", "fresh", "seasoned veteran", "digital native"
    - Race/cultural bias: Avoid terms with racial implications or cultural assumptions
    - Ability bias: Avoid requirements that unnecessarily exclude people with disabilities
      * Focus on outcomes rather than methods (what needs to be accomplished vs. how)
      * Avoid terms like "able-bodied", requirements to "stand", "lift", etc. unless essential
    
    For educational requirements: Use "degree or equivalent practical experience"
    
    FOCUS ON SKILLS AND COMPETENCIES RATHER THAN LENGTH OF EXPERIENCE OR CREDENTIALS.
    
    Return ONLY valid JSON without explanations, comments or code blocks.`;

    // Generation config
    const generationConfig = {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const rawText = response.text();
    console.log("Gemini API raw response:", rawText);

    // Clean up the response to ensure valid JSON
    const cleanedText = rawText
      .replace(/^```json\s*|\s*```$/g, "")
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      .trim();

    // Extract JSON if wrapped in other text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : cleanedText;

    try {
      const jobData = JSON.parse(jsonText);
      console.log("Gemini API raw response:", rawText);

      res.json({
        success: true,
        data: jobData,
      });
    } catch (parseError) {
      logger.error("Error parsing AI response", { error: parseError.message });
      res.status(500).json({
        success: false,
        error: "Failed to parse job description data",
      });
    }
  } catch (error) {
    logger.error("Auto-complete error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to generate job description",
      message: error.message,
    });
  }
};
