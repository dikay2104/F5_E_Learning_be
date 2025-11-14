const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Collection = require('../models/Collection');
const Progress = require('../models/Progress');
const { getVideoDurationFromUrl } = require('../utils/videoUtils');

// Lấy videoId từ YouTube URL
const getVideoId = (url) => {
  const regex = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Tính lại tổng thời lượng của Course
const updateCourseDuration = async (courseId) => {
  const lessons = await Lesson.find({ course: courseId });
  const totalDuration = lessons.reduce((sum, l) => sum + (l.videoDuration || 0), 0);
  await Course.findByIdAndUpdate(courseId, { duration: Math.floor(totalDuration / 60) }); // phút
};

const updateCollectionDuration = async (collectionId) => {
  if (!collectionId) return;

  const lessons= await Lesson.find({ collection: collectionId });
  const totalDuration = lessons.reduce((sum, l) => sum + (l.videoDuration || 0), 0);
  await Collection.findByIdAndUpdate(collectionId, { duration: Math.floor(totalDuration / 60) });
}

exports.createLesson = async (req, res) => {
  try {
    const {
      title,
      description,
      videoUrl,
      order,
      isPreviewable,
      resources,
      course,
      collection
    } = req.body;

    let videoDuration = await getVideoDurationFromUrl(videoUrl);

    // Kiểm tra nếu là YouTube link thì mới lấy duration
    // const videoId = getVideoId(videoUrl);
    // if (videoId) {
    //   try {
    //     const youtube = await Innertube.create();
    //     const info = await youtube.getInfo(videoId);
    //     videoDuration = info.basic_info.duration;
    //   } catch (err) {
    //     console.warn('Không lấy được duration từ YouTube:', err.message);
    //     // Không throw lỗi, tiếp tục tạo lesson mà không có duration
    //   }
    // }

    const lesson = new Lesson({
      title,
      description,
      videoUrl,
      videoDuration,
      order,
      isPreviewable,
      resources,
      course,
      collection,
    });

    await lesson.save();

    await Course.findByIdAndUpdate(course, { $push: { lessons: lesson._id } });
    await updateCourseDuration(course);

    if (collection) {
      await Collection.findByIdAndUpdate(collection, { $push: { lessons: lesson._id } });
      await updateCollectionDuration(collection);
    }

    res.status(201).json({ status: 'success', data: lesson });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};



exports.getLessonsByCourse = async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId }).sort({ order: 1 });
    res.status(200).json({ status: 'success', data: lessons });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ status: 'error', message: 'Lesson not found' });
    res.status(200).json({ status: 'success', data: lesson });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const updates = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ status: 'error', message: 'Lesson không tồn tại' });

    // Nếu videoUrl thay đổi thì lấy lại thời lượng mới
    if (updates.videoUrl && updates.videoUrl !== lesson.videoUrl) {
      const newDuration = await getVideoDurationFromUrl(updates.videoUrl);
      updates.videoDuration = newDuration;
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(lessonId, updates, { new: true });
    await updateCourseDuration(updatedLesson.course);

    // Cập nhật thời lượng cho collection cũ và mới nếu có thay đổi
    const oldCollection = lesson.collection?.toString();
    const newCollection = updates.collection?.toString();
    
    if (oldCollection !== newCollection) {
      if (oldCollection) await updateCollectionDuration(oldCollection);
      if (newCollection) await updateCollectionDuration(newCollection);
    } else if (newCollection) {
      await updateCollectionDuration(newCollection);
    }

    // Nếu collection thay đổi thì di chuyển lesson
    if (oldCollection && oldCollection !== newCollection) {
      await Collection.findByIdAndUpdate(oldCollection, {
        $pull: { lessons: lesson._id }
      });
    }
    if (updates.hasOwnProperty('collection') && updates.collection === null && lesson.collection) {
      await Collection.findByIdAndUpdate(lesson.collection, {
        $pull: { lessons: lesson._id }
      });
    }

    res.status(200).json({ status: 'success', data: updatedLesson });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.lessonId);
    if (!lesson) return res.status(404).json({ status: 'error', message: 'Lesson không tồn tại' });

    await updateCourseDuration(lesson.course);

    // Gỡ khỏi Course
    await Course.findByIdAndUpdate(lesson.course, {
      $pull: { lessons: lesson._id }
    });

    // Cập nhật collection nếu có
    if (lesson.collection) {
      await updateCollectionDuration(lesson.collection);
      await Collection.findByIdAndUpdate(lesson.collection, {
        $pull: { lessons: lesson._id }
      });
    }
    res.status(200).json({ status: 'success', message: 'Lesson đã xoá', data: lesson });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getLessonPagination = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const courses = await Course.find({ teacher: teacherId });
    const courseIds = courses.map(c => c._id);

    const filter = {
      course: { $in: courseIds },
      title: { $regex: new RegExp(search, 'i') }
    };

    const total = await Lesson.countDocuments(filter);
    const lessons = await Lesson.find(filter)
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: lessons
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.reorderLessons = async (req, res) => {
  try {
    const updates = req.body; // [{ lessonId, order }]
    const bulkOps = updates.map(({ lessonId, order }) => ({
      updateOne: {
        filter: { _id: lessonId },
        update: { $set: { order } }
      }
    }));
    await Lesson.bulkWrite(bulkOps);
    res.status(200).json({ status: 'success', message: 'Thứ tự bài học đã được cập nhật' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Lưu tiến độ xem video
exports.saveProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;
    const { watchedSeconds, videoDuration, courseId } = req.body;
    if (!lessonId || watchedSeconds == null || !courseId) {
      return res.status(400).json({ message: 'Thiếu dữ liệu' });
    }
    const progress = await Progress.findOneAndUpdate(
      { user: userId, lesson: lessonId },
      { watchedSeconds, videoDuration, course: courseId, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ status: 'success', data: progress });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Lấy tiến độ các bài học trong khoá học
exports.getProgressByCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const progresses = await Progress.find({ user: userId, course: courseId });
    res.json({ status: 'success', data: progresses });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};