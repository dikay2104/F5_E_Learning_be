const Collection = require('../models/Collection');
const Course = require('../models/Course');

// Tạo collection mới
exports.createCollection = async (req, res) => {
  try {
    const { title, description, order, course, lessons } = req.body;

    // Kiểm tra course tồn tại
    const existingCourse = await Course.findById(course);
    if (!existingCourse) {
      return res.status(404).json({ status: 'error', message: 'Course không tồn tại' });
    }

    const collection = new Collection({
      title,
      description,
      order,
      course,
      lessons,
    });

    await collection.save();

    // Gắn collection vào Course
    await Course.findByIdAndUpdate(course, {
      $push: { collections: collection._id }
    });

    res.status(201).json({ status: 'success', data: collection });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Lấy danh sách collection theo courseId
exports.getCollectionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const collections = await Collection.find({ course: courseId })
      .populate('lessons', 'title order videoDuration')
      .sort({ order: 1 });

    res.status(200).json({ status: 'success', data: collections });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Lấy chi tiết collection theo ID
exports.getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.collectionId)
      .populate('lessons', 'title order videoDuration');

    if (!collection) {
      return res.status(404).json({ status: 'error', message: 'Collection không tồn tại' });
    }

    res.status(200).json({ status: 'success', data: collection });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Cập nhật collection
exports.updateCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const updates = req.body;

    const updated = await Collection.findByIdAndUpdate(collectionId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Collection không tồn tại' });
    }

    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Xoá collection
exports.deleteCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;

    const deleted = await Collection.findByIdAndDelete(collectionId);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Collection không tồn tại' });
    }

    res.status(200).json({ status: 'success', message: 'Collection đã xoá', data: deleted });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Cập nhật thứ tự bài học trong collection
// Cập nhật thứ tự collection trong khoá học
exports.reorderCollection = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { collections } = req.body; // mảng collectionId theo thứ tự mới

    const updateOps = collections.map((collectionId, index) => ({
      updateOne: {
        filter: { _id: collectionId, course: courseId },
        update: { $set: { order: index } }
      }
    }));

    await Collection.bulkWrite(updateOps);

    res.status(200).json({
      status: 'success',
      message: 'Đã cập nhật thứ tự collections'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

