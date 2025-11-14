const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileUrl: String,
  submittedAt: Date
});

module.exports = mongoose.model('Assignment', assignmentSchema);
