const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

// Lấy danh sách tất cả feedback (phân trang, tìm kiếm, lọc)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', course, student, rating } = req.query;
    const query = {};

    // Tìm kiếm theo comment
    if (search) {
      query.comment = { $regex: search, $options: 'i' };
    }
    // Lọc theo course
    if (course) {
      query.course = course;
    }
    // Lọc theo student
    if (student) {
      query.student = student;
    }
    // Lọc theo rating
    if (rating) {
      query.rating = Number(rating);
    }

    const feedbacks = await Feedback.find(query)
      .populate('course', 'title')
      .populate('student', 'fullName email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Feedback.countDocuments(query);

    res.json({
      feedbacks,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching feedbacks', error: err.message });
  }
};

// Xóa feedback - chỉ admin
exports.deleteFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const feedback = await Feedback.findByIdAndDelete(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback đã được xóa thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Delete feedback failed', error: err.message });
  }
};

// Admin reply feedback
exports.replyFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Nội dung phản hồi không được để trống' });
    }
    let feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      {
        reply: {
          content,
          admin: req.user.id,
          createdAt: new Date()
        }
      },
      { new: true }
    );
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    feedback = await feedback.populate('reply.admin', 'fullName email');

    // Gửi thông báo cho học viên
    await Notification.create({
      recipient: feedback.student,
      actor: req.user.id,
      type: 'feedback_replied',
      message: `Phản hồi từ giáo viên cho feedback của bạn trong khoá học "${feedback.course}".`,
      targetRef: feedback.course,
      targetModel: 'Course'
    });

    req.io?.to(feedback.student.toString()).emit('new_notification', {
      type: 'feedback_replied',
      message: `Phản hồi từ giáo viên cho feedback của bạn trong khoá học "${feedback.course}".`,
    });
    
    res.json({ message: 'Reply feedback thành công', feedback });
  } catch (err) {
    res.status(500).json({ message: 'Reply feedback failed', error: err.message });
  }
};

// Student gửi feedback
exports.createFeedback = async (req, res) => {
  try {
    const { course, comment, rating } = req.body;
    if (!course || !comment || !rating) {
      return res.status(400).json({ message: 'Thiếu thông tin feedback' });
    }
    // Kiểm tra đã từng gửi feedback chưa (1 user chỉ gửi 1 feedback/khóa học)
    const existed = await Feedback.findOne({ course, student: req.user.id });
    if (existed) {
      return res.status(400).json({ message: 'Bạn đã gửi feedback cho khóa học này rồi' });
    }
    const feedback = new Feedback({
      course,
      student: req.user.id,
      comment,
      rating
    });
    await feedback.save();

    // Gửi thông báo cho giáo viên
    const courseInfo = await Course.findById(course).populate('teacher');
    const actor = await User.findById(req.user.id);
    await Notification.create({
      recipient: courseInfo.teacher._id,
      actor: req.user.id,
      type: 'feedback_created',
      message: `${actor.fullName} đã gửi feedback cho khoá học "${courseInfo.title}".`,
      targetRef: courseInfo._id,
      targetModel: 'Course'
    });

    // Gửi realtime nếu cần
    req.io?.to(courseInfo.teacher._id.toString()).emit('new_notification', {
      type: 'feedback_created',
      message: `${req.user.fullName} đã gửi feedback cho khoá học "${courseInfo.title}".`,
    });

    res.status(201).json({ message: 'Gửi feedback thành công', feedback });
  } catch (err) {
    res.status(500).json({ message: 'Gửi feedback thất bại', error: err.message });
  }
};  