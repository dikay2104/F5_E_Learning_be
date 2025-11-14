const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  videoDuration: Number, // Tổng thời lượng video (giây hoặc phút)
  order: Number, // Thứ tự của bài học trong khoá
  isPreviewable: { type: Boolean, default: false }, // Cho phép học thử?
  resources: [String], // Tài liệu kèm theo (PDF, link, v.v.)
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  collection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
