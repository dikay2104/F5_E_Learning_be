const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  avatar: String,
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);