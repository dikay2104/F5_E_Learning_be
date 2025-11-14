const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comment: String,
    rating: Number,
    reply: {
      content: String,
      admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
