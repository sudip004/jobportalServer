const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyName: {
        type: String,
    },
    jobTitle: {
        type: String,
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
    },
    experienceLevel: {
        type: String,
        enum: ['Entry Level', 'Mid Level', 'Senior Level'],
        default: 'Entry Level'
    },
    applicationFillUp: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      pdf: 
        {
          type: String,
          required: true
        }
      
    }
  ],
    createdAt: {
        type: Date,
        default: Date.now
    }

});
const Job = mongoose.model('Job', userSchema);
module.exports = Job;