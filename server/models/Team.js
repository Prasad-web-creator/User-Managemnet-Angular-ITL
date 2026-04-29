const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  projectName: {
    type: String,
    trim: true
  },
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  tasks: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    taskName: { type: String, trim: true }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
