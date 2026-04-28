const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['Login', 'Create User', 'Edit User', 'Delete User', 'Delete Multiple Users', 'Create Role', 'Edit Role', 'Delete Role', 'Reset Password']
  },
  target: {
    type: String,
    default: 'N/A'
  },
  details: {
    type: String
  },
  ip: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
