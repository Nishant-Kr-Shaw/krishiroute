const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * Handles connection with retry logic and proper error handling
 */
const connectDB = async () => {
    try {
        const dbUrl = process.env.MONGODB_URI || process.env.MONGODB_URL;
        if (!dbUrl) {
            throw new Error('MongoDB connection string not found (MONGODB_URI or MONGODB_URL)');
        }
        const conn = await mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        console.log('Running without database. Mock data will be used.');
        // Don't exit process - allow app to run with mock data
    }
};

module.exports = connectDB;
