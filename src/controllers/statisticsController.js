const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Feedback = require('../models/Feedback');
const mongoose = require('mongoose');

exports.getTeacherStatistics = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // 1. Lấy danh sách khóa học của giáo viên
    const courses = await Course.find({ teacher: teacherId }).select('_id status studentsCount duration title');
    const courseIds = courses.map(c => c._id);

    // 2. Tổng quan
    const totalCourses = courses.length;

    const statusCount = courses.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const totalStudents = courses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
    const totalDuration = courses.reduce((sum, c) => sum + (c.duration || 0), 0);

    const totalLessons = await Lesson.countDocuments({ course: { $in: courseIds } });
    const totalFeedbacks = await Feedback.countDocuments({ course: { $in: courseIds } });

    const ratingStats = await Feedback.aggregate([
      { $match: { course: { $in: courseIds }, rating: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
    const averageRating = ratingStats[0]?.averageRating || 0;

    // 3. Tăng trưởng học viên theo tháng
    const enrollmentStats = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 4. Tăng trưởng số khóa học theo tháng
    const courseGrowthStats = await Course.aggregate([
      { $match: { teacher: new mongoose.Types.ObjectId(teacherId) } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalCourses: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 5. Top khóa học nhiều học viên
    const topCourses = courses
      .sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0))
      .slice(0, 5)
      .map(c => ({
        _id: c._id,
        title: c.title,
        studentsCount: c.studentsCount,
        duration: c.duration
      }));

    // 6. Trả kết quả
    const response = {
      overview: {
        totalCourses,
        statusCount,
        totalStudents,
        totalLessons,
        totalDuration,
        totalFeedbacks,
        averageRating: Number(averageRating.toFixed(2))
      },
      growth: {
        enrollmentsByMonth: enrollmentStats,
        coursesByMonth: courseGrowthStats
      },
      topCourses
    };

    // console.log("Statistic data:", response);

    res.json(response);
  } catch (err) {
    console.error('Error in getTeacherStatistics:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
