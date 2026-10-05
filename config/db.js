const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/localfix';

/**
 * Connects Mongoose to MongoDB and returns the connection URI in use
 * (the session store re-uses the same URI).
 */
async function connectDB() {
  const uri = process.env.MONGO_URI || DEFAULT_URI;
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return uri;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Make sure MongoDB is running and MONGO_URI is correct in your .env file.');
    process.exit(1);
  }
}

module.exports = connectDB;
module.exports.DEFAULT_URI = DEFAULT_URI;
