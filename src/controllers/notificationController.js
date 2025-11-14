// controllers/notificationController.js
const Notification = require('../models/Notification');

// Lấy danh sách thông báo
exports.getNotifications = async (req, res) => {
  try { 
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: notifications });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Đánh dấu 1 thông báo là đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const noti = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    res.json({ status: 'success', data: noti });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Đánh dấu tất cả thông báo là đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ status: 'success', message: 'Marked all as read' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Xoá 1 thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }
    res.json({ status: 'success', message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
