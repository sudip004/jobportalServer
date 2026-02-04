const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(mongoURI, {
            // Connection pooling
            maxPoolSize: 10,
            minPoolSize: 5,
            // Timeout settings
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            // Retry settings
            retryWrites: true,
            retryReads: true,
            // Performance
            maxIdleTimeMS: 60000,
        });

        console.log('MongoDB connected successfully');
        
        // Log pool status
        const db = mongoose.connection;
        db.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
        db.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

module.exports = connectDB;