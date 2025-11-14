const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  issuedAt: { type: Date, default: Date.now },
  certificateId: { type: String, required: true, unique: true }, // Mã chứng chỉ duy nhất
  score: { type: Number }, // Điểm số cuối cùng (nếu có)
  fileUrl: { type: String }, // Link file PDF/ảnh chứng chỉ (nếu có)
  status: { type: String, enum: ['issued', 'pending', 'revoked'], default: 'issued' },
  fullName: { type: String }, // Tên học viên (dùng để render chứng chỉ)
  courseTitle: { type: String }, // Tên khóa học (dùng để render chứng chỉ)
  extra: { type: Object }, // Thông tin bổ sung (nếu cần)
  allowEditName: { type: Boolean, default: true }, // Chỉ cho phép đổi tên 1 lần
});

module.exports = mongoose.model('Certificate', certificateSchema); 