// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: [
      'course_created',
      'course_approved',
      'course_rejected',
      'course_submitted',
      'admin_notice',
      'feedback_created',
      'feedback_replied',
    ],
    required: true
  },
  message: { type: String, required: true },
  targetRef: { type: mongoose.Schema.Types.ObjectId, refPath: 'targetModel' },
  targetModel: { type: String, enum: ['Course'], default: 'Course' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
