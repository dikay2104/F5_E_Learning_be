const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  watchedSeconds: { type: Number, default: 0 }, // số giây đã xem
  videoDuration: { type: Number, default: 0 }, // tổng thời lượng video (giây)
  updatedAt: { type: Date, default: Date.now }
});

progressSchema.index({ user: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema); 