const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  permissions: {
    dashboard: { type: Boolean, default: false },
    viewUsers: { type: Boolean, default: false },
    editUsers: { type: Boolean, default: false },
    deleteUsers: { type: Boolean, default: false },
    roles: { type: Boolean, default: false },
    addUser: { type: Boolean, default: false },
    viewActivityLog: { type: Boolean, default: false },
    teams: { type: Boolean, default: false },
    projects: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
