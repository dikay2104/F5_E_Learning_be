const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: { type: Number, default: 0 }, // 0 = free course
  thumbnail: String, // Ảnh đại diện khóa học
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  category: { type: String, default: "programming" },
  duration: Number, // Thời lượng khóa học (phút)
  studentsCount: { type: Number, default: 0 }, // Số học viên đã đăng ký
  status: {
    type: String,
    enum: ["draft", "pending", "approved", "rejected"],
    default: "draft",
  },
  rejectReason: { type: String, default: "" },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
  collections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Collection" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Course", courseSchema);
