const Course = require('../models/Course');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.getAllCourse = async (req, res) => {
    try {
        const search = req.query.search || '';
        const category = req.query.category || '';
        const level = req.query.level || '';
        const price = req.query.price || '';

        const regex = new RegExp(search, 'i')
        const filter = {
            title: { $regex: regex }
        };
        if (category) {
            filter.category = category;
        }
        if (level) {
            filter.level = level;
        }
        if (price === 'free'){
            filter.price = 0;
        }
        else if (price === 'paid') {
            filter.price = { $gt: 0};
        }

        const courses = await Course.find(filter)
            .populate('teacher', 'fullName avatar')
            .select('title description price thumbnail level category duration studentsCount createdAt status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: courses,
            total: courses.length
        });
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const filter = { _id: courseId };

    // Nếu chưa đăng nhập hoặc là student thì chỉ xem được course đã approved
    if (!req.user || req.user.role === 'student') {
      filter.status = 'approved';
    }

    const course = await Course.findOne(filter)
      .populate('teacher', 'fullName avatar')
      .populate('lessons', 'title videoDuration');

    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Khoá học không tồn tại hoặc chưa được duyệt',
      });
    }

    res.status(200).json({
      status: 'success',
      data: course,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};


exports.createCourse = async (req, res) => {
    try {
      const teacherId = req.user.id; // lấy userId từ middleware gán
      const course = new Course({
        ...req.body,
        teacher: teacherId
      });
  
      await course.save();

      res.status(201).json({ status: 'success', data: course });
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
  
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {
            new: true,
            runValidators: true
        });
        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }
        res.status(200).json({ status: 'success', data: course });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
  
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.courseId);
        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }
        res.status(200).json({ status: 'success', data: course });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
  
exports.getCoursePagination = async (req, res) => {
    try {
        const teacherId = req.user.id; // lấy id giáo viên từ middleware
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search || '';

        const filter = {
            teacher: teacherId, // chỉ lấy course của giáo viên hiện tại
            title: { $regex: new RegExp(search, 'i') }
        };

        if (status) filter.status = status;

        const total = await Course.countDocuments(filter);
        const courses = await Course.find(filter)
            .populate('teacher')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: courses
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.submitCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }

    // Kiểm tra quyền: chỉ teacher tạo ra course đó mới được submit
    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Không có quyền gửi khoá học này' });
    }

    course.status = 'pending';
    await course.save();

    // Gửi thông báo cho admin
    const admins = await User.find({ role: 'admin' });
    const actor = await User.findById(req.user.id);

    const notifications = admins.map(admin => ({
      recipient: admin._id,
      actor: req.user.id,
      type: 'course_submitted',
      message: `${actor.fullName} đã gửi khoá học "${course.title}" để duyệt.`,
      targetRef: course._id,
    }));

    await Notification.insertMany(notifications);

    admins.forEach(admin => {
      req.io.to(admin._id.toString()).emit('new_notification', {
        type: 'course_submitted',
        message: `${actor.fullName} đã gửi khoá học "${course.title}" để duyệt.`,
      });
    });

    res.status(200).json({ status: 'success', message: 'Khoá học đã gửi duyệt', data: course });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Lấy danh sách khóa học chờ phê duyệt (chỉ admin)
exports.getPendingCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', teacher } = req.query;
    const query = { status: 'pending' };
    // Tìm kiếm theo tiêu đề
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    // Lọc theo teacher
    if (teacher) {
      query.teacher = teacher;
    }
    const courses = await Course.find(query)
      .populate('teacher', 'fullName email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await Course.countDocuments(query);
    res.json({
      courses,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending courses', error: err.message });
  }
};

// Phê duyệt khóa học - chỉ admin
exports.approveCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (course.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể phê duyệt khóa học ở trạng thái pending' });
    }
    course.status = 'approved';
    await course.save();

    await Notification.create({
      recipient: course.teacher,
      actor: req.user.id,
      type: 'course_approved',
      message: `Khoá học "${course.title}" của bạn đã được phê duyệt.`,
      targetRef: course._id
    });

    req.io.to(course.teacher.toString()).emit('new_notification', {
      type: 'course_approved',
      message: `Khoá học "${course.title}" của bạn đã được phê duyệt.`,
    });

    res.json({ message: 'Khóa học đã được phê duyệt thành công', course });
  } catch (err) {
    res.status(500).json({ message: 'Approve course failed', error: err.message });
  }
};

// Từ chối khóa học - chỉ admin
exports.rejectCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { reason } = req.body;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (course.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể từ chối khóa học ở trạng thái pending' });
    }
    course.status = 'rejected';
    course.rejectReason = reason || '';
    await course.save();

    await Notification.create({
      recipient: course.teacher,
      actor: req.user.id,
      type: 'course_rejected',
      message: `Khoá học "${course.title}" đã bị từ chối. Lý do: ${reason}`,
      targetRef: course._id
    });

    req.io.to(course.teacher.toString()).emit('new_notification', {
      type: 'course_rejected',
      message: `Khoá học "${course.title}" đã bị từ chối. Lý do: ${reason}`,
    });

    res.json({ message: 'Khóa học đã bị từ chối', course });
  } catch (err) {
    res.status(500).json({ message: 'Reject course failed', error: err.message });
  }
};
