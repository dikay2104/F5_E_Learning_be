const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API,
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET
});

// Cấu hình storage cho video
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'videos',
    resource_type: 'video', // QUAN TRỌNG: để Cloudinary xử lý như file video
    allowed_formats: ['mp4', 'mov', 'webm'],
  }
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'thumbnails',
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }
});

const uploadImage = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage });

module.exports = { uploadImage, uploadVideo, cloudinary };
