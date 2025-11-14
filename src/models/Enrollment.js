const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  progress: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'pending_payment', 'cancelled'],
    default: 'active'
  },
  enrolledAt: { type: Date, default: Date.now },
  payment: {
    orderId: String,
    amount: Number,
    paymentUrl: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transactionNo: String,
    completedAt: Date,
    failedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
