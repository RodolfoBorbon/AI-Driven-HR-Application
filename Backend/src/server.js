import express from 'express';
import mongoose from 'mongoose';
import cors from './middleware/corsMiddleware.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});