require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
    const DB_NAME = process.env.DB_NAME || 'college_club_compass';
    
    // Create the full URI if not provided as a complete connection string for Atlas
    const fullURI = MONGO_URL.includes(DB_NAME) 
      ? MONGO_URL 
      : (MONGO_URL.endsWith('/') ? `${MONGO_URL}${DB_NAME}` : `${MONGO_URL}/${DB_NAME}`);
      
    await mongoose.connect(fullURI);
    console.log(`MongoDB Connected: ${fullURI}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
