const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Cấp chứng chỉ cho user (nếu đủ điều kiện)
exports.issueCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;
    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId, status: 'active' });
    if (!enrollment) {
      return res.status(400).json({ status: 'error', message: 'Bạn chưa tham gia hoặc chưa hoàn thành khóa học này.' });
    }
    // Lấy danh sách bài học
    const course = await Course.findById(courseId).populate('lessons');
    if (!course) return res.status(404).json({ status: 'error', message: 'Không tìm thấy khóa học' });
    const totalLessons = course.lessons.length;
    if (totalLessons === 0) return res.status(400).json({ status: 'error', message: 'Khóa học chưa có bài học.' });
    // Đếm số bài học đã hoàn thành (>= 80%)
    const Progress = require('../models/Progress');
    const progresses = await Progress.find({ user: userId, course: courseId });
    const completedLessons = progresses.filter(p => p.videoDuration > 0 && p.watchedSeconds / p.videoDuration >= 0.8).length;
    const progressPercent = Math.round((completedLessons / totalLessons) * 100);
    if (progressPercent < 90) {
      return res.status(400).json({ status: 'error', message: 'Bạn cần hoàn thành ít nhất 90% khóa học để nhận chứng chỉ.' });
    }
    // Kiểm tra đã có certificate chưa
    const existed = await Certificate.findOne({ user: userId, course: courseId });
    if (existed) {
      return res.json({ status: 'success', data: existed, message: 'Bạn đã nhận chứng chỉ cho khóa học này.' });
    }
    // Lấy thông tin user
    const user = await User.findById(userId);
    // Tạo certificate mới
    const certificate = new Certificate({
      user: userId,
      course: courseId,
      issuedAt: new Date(),
      certificateId: uuidv4(),
      score: null,
      fileUrl: '', // Chưa sinh file
      status: 'issued',
      fullName: user.fullName,
      courseTitle: course.title
    });
    await certificate.save();
    res.json({ status: 'success', data: certificate, message: 'Đã cấp chứng chỉ thành công.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Lấy danh sách chứng chỉ của user
exports.getMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id;
    const certificates = await Certificate.find({ user: userId }).populate('course', 'title thumbnail');
    res.json({ status: 'success', data: certificates });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getCertificateById = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findOne({ certificateId }).populate('course', 'title thumbnail');
    if (!cert) return res.status(404).json({ status: 'error', message: 'Không tìm thấy chứng chỉ' });
    res.json({ status: 'success', data: cert });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Cho phép user đổi tên trên chứng chỉ (chỉ 1 lần)
exports.editCertificateName = async (req, res) => {
  try {
    const userId = req.user.id;
    const { certificateId } = req.params;
    const { newName } = req.body;
    if (!newName || newName.trim().length < 2) {
      return res.status(400).json({ status: 'error', message: 'Tên không hợp lệ.' });
    }
    const cert = await Certificate.findOne({ certificateId, user: userId });
    if (!cert) return res.status(404).json({ status: 'error', message: 'Không tìm thấy chứng chỉ' });
    if (!cert.allowEditName) {
      return res.status(400).json({ status: 'error', message: 'Bạn chỉ được đổi tên 1 lần.' });
    }
    cert.fullName = newName.trim();
    cert.allowEditName = false;
    await cert.save();
    res.json({ status: 'success', data: cert, message: 'Đã đổi tên trên chứng chỉ thành công.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}; 