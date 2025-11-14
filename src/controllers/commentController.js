const Comment = require('../models/Comment');
const User = require('../models/User');

// Lấy danh sách comment theo lesson
exports.getCommentsByLesson = async (req, res) => {
  try {
    const { lesson } = req.query;
    if (!lesson) return res.status(400).json({ message: 'Thiếu lesson id' });
    const comments = await Comment.find({ lesson })
      .populate('user', 'fullName email')
      .sort({ createdAt: 1 });
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy comment', error: err.message });
  }
};

// Tạo comment mới
exports.createComment = async (req, res) => {
  try {
    const { lesson, content } = req.body;
    if (!lesson || !content) return res.status(400).json({ message: 'Thiếu dữ liệu' });
    const comment = new Comment({
      lesson,
      user: req.user.id,
      content
    });
    await comment.save();
    await comment.populate('user', 'fullName email');
    res.status(201).json({ message: 'Đã gửi bình luận', comment });
  } catch (err) {
    res.status(500).json({ message: 'Gửi bình luận thất bại', error: err.message });
  }
};

// Sửa comment
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy comment' });
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn chỉ có thể sửa comment của mình' });
    }
    comment.content = content;
    await comment.save();
    res.json({ message: 'Đã cập nhật comment', comment });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật comment', error: err.message });
  }
};

// Xóa comment
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy comment' });
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bạn chỉ có thể xóa comment của mình' });
    }
    await Comment.deleteOne({ _id: id });
    // Xóa luôn các reply nếu có
    await Comment.deleteMany({ parentId: id });
    res.json({ message: 'Đã xóa comment' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa comment', error: err.message });
  }
};

// Like/Dislike comment (toggle)
exports.likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'like' hoặc 'dislike'
    const userId = req.user.id;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy comment' });
    if (type === 'like') {
      if (comment.likes.includes(userId)) {
        comment.likes.pull(userId);
      } else {
        comment.likes.push(userId);
        comment.dislikes.pull(userId);
      }
    } else if (type === 'dislike') {
      if (comment.dislikes.includes(userId)) {
        comment.dislikes.pull(userId);
      } else {
        comment.dislikes.push(userId);
        comment.likes.pull(userId);
      }
    } else {
      return res.status(400).json({ message: 'type phải là like hoặc dislike' });
    }
    await comment.save();
    res.json({ message: 'Đã cập nhật like/dislike', likes: comment.likes.length, dislikes: comment.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi like/dislike', error: err.message });
  }
};

// Trả lời comment
exports.replyComment = async (req, res) => {
  try {
    const { id } = req.params; // id comment cha
    const { content } = req.body;
    const parentComment = await Comment.findById(id);
    if (!parentComment) return res.status(404).json({ message: 'Không tìm thấy comment cha' });
    const reply = new Comment({
      lesson: parentComment.lesson,
      user: req.user.id,
      content,
      parentId: id
    });
    await reply.save();
    await reply.populate('user', 'fullName email');
    res.status(201).json({ message: 'Đã trả lời bình luận', comment: reply });
  } catch (err) {
    res.status(500).json({ message: 'Trả lời bình luận thất bại', error: err.message });
  }
}; 