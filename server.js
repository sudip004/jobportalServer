require('dotenv').config();
const connectDB = require('./DB/db');
const cloudinary = require('./utils/Cloudinary');
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const userRoutes = require('./routes/userRoutes');
const pdfParse = require('pdf-parse');

// Compression middleware - reduces payload size
app.use(compression());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS with updated origin for deployment
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL // Add your Netlify URL here
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint - prevents Render cold start
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Server is healthy', timestamp: new Date() });
});

app.use('/api', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ 
        message: err.message || 'Server error',
        error: process.env.NODE_ENV === 'production' ? {} : err 
    });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});