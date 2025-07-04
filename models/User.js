const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String,
    },
    email: { 
        type: String,
        lowercase: true
    },
    password: { 
        type: String,
    },
    profilePic: { 
        type: String,
        default: 'https://res.cloudinary.com/dz1qj3v4f/image/upload/v1709300000/default-profile-picture.png'
    },
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job' // Assuming you have a Post model
    }],
    AppliedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job' // Assuming you have a Job model
    }],
    Createdjobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job' // Assuming you have a Job model
    }],
    createdAt: { 
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});


const User = mongoose.model('User', userSchema);
module.exports = User;
// This code defines a Mongoose schema for a User model in a Node.js application.