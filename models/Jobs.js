const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    companyName: {
        type: String,
        index: true
    },
    jobTitle: {
        type: String,
        index: true
    },
    jobDescription: {
        type: String,
    },
    money: {
        type: String,
    },
    companyPic: {
        type: String,
    },
    location: {
        type: String,
        index: true
    },
    experienceLevel: {
        type: String,
        enum: ['Entry Level', 'Mid Level', 'Senior Level'],
        default: 'Entry Level',
        index: true
    },
    applicationFillUp: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            pdf: {
                type: String,
                required: true
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Create compound indexes for common queries
jobSchema.index({ creatorId: 1, createdAt: -1 });
jobSchema.index({ location: 1, experienceLevel: 1 });
jobSchema.index({ createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;