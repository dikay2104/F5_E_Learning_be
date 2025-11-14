const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

// Lưu tiến độ xem video
exports.saveProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;
    const { watchedSeconds, videoDuration, courseId } = req.body;
    
    if (!lessonId || watchedSeconds == null || !courseId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Thiếu dữ liệu: lessonId, watchedSeconds, courseId' 
      });
    }

    // Validate watchedSeconds không được âm
    if (watchedSeconds < 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'watchedSeconds không được âm' 
      });
    }

    // Validate videoDuration nếu có
    if (videoDuration && watchedSeconds > videoDuration) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'watchedSeconds không được lớn hơn videoDuration' 
      });
    }

    const progress = await Progress.findOneAndUpdate(
      { user: userId, lesson: lessonId },
      { 
        watchedSeconds, 
        videoDuration, 
        course: courseId, 
        updatedAt: new Date() 
      },
      { upsert: true, new: true }
    );

    res.json({ 
      status: 'success', 
      data: progress,
      message: 'Đã lưu tiến độ xem video'
    });
  } catch (err) {
    console.error('Error saving progress:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Lỗi khi lưu tiến độ: ' + err.message 
    });
  }
};

// Lấy tiến độ các bài học trong khóa học
exports.getProgressByCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    
    if (!courseId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Thiếu courseId' 
      });
    }

    const progresses = await Progress.find({ 
      user: userId, 
      course: courseId 
    }).populate('lesson', 'title videoDuration');

    res.json({ 
      status: 'success', 
      data: progresses,
      message: 'Lấy tiến độ thành công'
    });
  } catch (err) {
    console.error('Error getting progress by course:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Lỗi khi lấy tiến độ: ' + err.message 
    });
  }
};

// Lấy tiến độ tổng quan của user
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Lấy tất cả progress của user
    const progresses = await Progress.find({ user: userId })
      .populate('course', 'title thumbnail')
      .populate('lesson', 'title videoDuration');

    // Tính toán thống kê
    const totalCourses = new Set(progresses.map(p => p.course._id.toString())).size;
    const totalLessons = progresses.length;
    const completedLessons = progresses.filter(p => 
      p.videoDuration && p.watchedSeconds / p.videoDuration >= 0.8
    ).length;
    
    // Tính % hoàn thành trung bình
    const averageProgress = progresses.length > 0 
      ? progresses.reduce((sum, p) => {
          if (p.videoDuration > 0) {
            return sum + Math.min(p.watchedSeconds / p.videoDuration, 1);
          }
          return sum;
        }, 0) / progresses.length * 100
      : 0;

    res.json({
      status: 'success',
      data: {
        progresses,
        statistics: {
          totalCourses,
          totalLessons,
          completedLessons,
          averageProgress: Math.round(averageProgress)
        }
      },
      message: 'Lấy thống kê tiến độ thành công'
    });
  } catch (err) {
    console.error('Error getting user progress:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Lỗi khi lấy thống kê tiến độ: ' + err.message 
    });
  }
};

// Lấy tiến độ chi tiết của một bài học
exports.getLessonProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;
    
    if (!lessonId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Thiếu lessonId' 
      });
    }

    const progress = await Progress.findOne({ 
      user: userId, 
      lesson: lessonId 
    }).populate('lesson', 'title videoDuration');

    if (!progress) {
      return res.json({
        status: 'success',
        data: {
          watchedSeconds: 0,
          videoDuration: 0,
          progressPercent: 0,
          isCompleted: false
        },
        message: 'Chưa có tiến độ cho bài học này'
      });
    }

    const progressPercent = progress.videoDuration > 0 
      ? Math.min((progress.watchedSeconds / progress.videoDuration) * 100, 100)
      : 0;
    
    const isCompleted = progressPercent >= 80;

    res.json({
      status: 'success',
      data: {
        watchedSeconds: progress.watchedSeconds,
        videoDuration: progress.videoDuration,
        progressPercent: Math.round(progressPercent),
        isCompleted,
        lastWatched: progress.updatedAt
      },
      message: 'Lấy tiến độ bài học thành công'
    });
  } catch (err) {
    console.error('Error getting lesson progress:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Lỗi khi lấy tiến độ bài học: ' + err.message 
    });
  }
};

// Xóa tiến độ của một bài học (reset progress)
exports.deleteLessonProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;
    
    if (!lessonId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Thiếu lessonId' 
      });
    }

    const result = await Progress.findOneAndDelete({ 
      user: userId, 
      lesson: lessonId 
    });

    if (!result) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy tiến độ để xóa'
      });
    }

    res.json({
      status: 'success',
      message: 'Đã xóa tiến độ bài học'
    });
  } catch (err) {
    console.error('Error deleting lesson progress:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Lỗi khi xóa tiến độ: ' + err.message 
    });
  }
};

// Lấy thống kê tiến độ cho teacher (xem tiến độ học viên)
exports.getCourseProgressStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    if (!courseId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Thiếu courseId' 
      });
    }

    // Kiểm tra user có phải là teacher của course này không
    const course = await Course.findOne({ 
      _id: courseId, 
      teacher: userId 
    });

    if (!course) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền xem thống kê khóa học này'
      });
    }

    // Lấy tất cả progress của khóa học
    const progresses = await Progress.find({ course: courseId })
      .populate('user', 'fullName email')
      .populate('lesson', 'title videoDuration');

    // Tính toán thống kê
    const totalStudents = new Set(progresses.map(p => p.user._id.toString())).size;
    const totalLessons = await Lesson.countDocuments({ course: courseId });
    
    // Thống kê theo từng bài học
    const lessonStats = [];
    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });
    
    for (const lesson of lessons) {
      const lessonProgresses = progresses.filter(p => p.lesson._id.toString() === lesson._id.toString());
      const completedStudents = lessonProgresses.filter(p => 
        p.videoDuration && p.watchedSeconds / p.videoDuration >= 0.8
      ).length;
      
      lessonStats.push({
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        totalStudents: lessonProgresses.length,
        completedStudents,
        completionRate: lessonProgresses.length > 0 
          ? Math.round((completedStudents / lessonProgresses.length) * 100)
          : 0
      });
    }

    res.json({
      status: 'success',
      data: {
        courseId,
        courseTitle: course.title,
        totalStudents,
        totalLessons,
        lessonStats
      },
      message: 'Lấy thống kê khóa học thành công'
    });
  } catch (err) {
    console.error('Error getting course progress stats:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Lỗi khi lấy thống kê khóa học: ' + err.message 
    });
  }
}; 