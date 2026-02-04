const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String,
    },
    email: { 
        type: String,
        lowercase: true,
        unique: true,
        sparse: true
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
        ref: 'Job'
    }],
    AppliedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],
    Createdjobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],
    createdAt: { 
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
// Note: email index is automatically created by unique: true
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);
module.exports = User;