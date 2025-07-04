require('dotenv').config();
const connectDB = require('./DB/db');
const cloudinary = require('./utils/Cloudinary');
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const pdfParse = require('pdf-parse');


app.use(express.json());
app.use(cors({
    origin: 'https://jobplanate.netlify.app', // Adjust this to your frontend's URL
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api',userRoutes);


app.listen(8000, () => {
    connectDB();
    console.log('Server is running on http://localhost:8000');
});
