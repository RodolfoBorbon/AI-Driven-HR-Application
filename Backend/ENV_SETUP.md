# Environment Variables Setup Guide

This document explains how to configure environment variables for the Centennial job posting backend application.

## Setup Instructions

1. Create a file named `.env` in the root directory of the project
2. Copy the template below and replace placeholder values with your actual credentials
3. Never commit the `.env` file with real credentials to version control

## Environment Variables Template

```properties
# Server Configuration
PORT=3000                                  # Port the server will run on Localy

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/     # MongoDB connection string
DB_NAME=YourDatabaseName                   # Database name

# Authentication
JWT_SECRET=use_a_long_random_string_here   # Secret for JWT token generation
JWT_EXPIRY=24h                             # JWT token expiry time

# API Keys
GEMINI_API_KEY=your_gemini_api_key         # Google Gemini API key for bias analysis

# LinkedIn Integration
LINKEDIN_CLIENT_ID=your_linkedin_client_id           # From LinkedIn Developer Portal
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret   # From LinkedIn Developer Portal
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback  # OAuth callback URL
LINKEDIN_ORGANIZATION_ID=your_organization_id        # LinkedIn Organization/Company ID

# Logging
LOG_LEVEL=info                             # Logging level (error, warn, info, http, verbose, debug, silly)
```
