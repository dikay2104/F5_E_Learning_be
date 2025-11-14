const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Tên của nhóm bài học (VD: "Hooks")
  description: { type: String, default: "" }, // Mô tả ngắn nếu cần
  order: { type: Number, default: 0 }, // Thứ tự hiển thị trong khóa học
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  duration: Number, // Thời lượng collection (phút)
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }]
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
