const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadImage, uploadVideo } = require('../services/cloudinaryService');

router.post(
  '/thumbnail',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('teacher', 'admin'),
  uploadImage.single('thumbnail'),
  uploadController.uploadThumbnail
);

router.post(
  '/avatar',
  authMiddleware.verifyToken,
  uploadImage.single('file'),
  uploadController.uploadAvatar
);

router.post(
  '/video',
  authMiddleware.verifyToken,
  authMiddleware.requireRole('teacher', 'admin'),
  uploadVideo.single('video'),
  uploadController.uploadVideo
);

module.exports = router;
