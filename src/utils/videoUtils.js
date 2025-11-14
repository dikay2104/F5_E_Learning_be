const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');

// Đọc cấu hình Cloudinary từ apikeys.json (hoặc từ env)
// const KEY_FILE_PATH = path.join(__dirname, '../config/apikeys.json');
// const credentials = JSON.parse(fs.readFileSync(KEY_FILE_PATH, 'utf8'));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API,
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET
});

// Extract YouTube videoId
const getVideoId = (url) => {
  const regex = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Kiểm tra link Cloudinary video
const isCloudinaryVideo = (url) => /res\.cloudinary\.com.*\/video\/upload\//.test(url);

// Extract Cloudinary public_id từ URL
const getCloudinaryPublicId = (url) => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(mp4|mov|webm)/);
  if (matches) {
    console.log('[Cloudinary] Extracted public_id:', matches[1]);
  } else {
    console.warn('[Cloudinary] Không tách được public_id từ URL:', url);
  }
  return matches ? matches[1] : null;
};

// Lấy duration từ Cloudinary
async function getCloudinaryVideoDuration(url) {
  const publicId = getCloudinaryPublicId(url);
  if (!publicId) {
    console.warn('[Cloudinary] Không tìm thấy publicId từ URL');
    return null;
  }

  try {
    console.log(`[Cloudinary] Gọi API lấy metadata cho public_id: ${publicId}`);
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
      image_metadata: true,
      colors: false,
      faces: false,
      pages: false,
      quality_analysis: false,
      cinemagraph_analysis: false,
      video_metadata: true // 👈 thử ép lấy metadata
    });

    // console.log('[Cloudinary] Metadata nhận được:', result);

    return result.duration ? Math.floor(result.duration) : null;
  } catch (err) {
    console.warn('❌ Lỗi lấy duration từ Cloudinary:', err.message);
    return null;
  }
}

// Chuyển ISO 8601 duration (VD: PT4M13S) sang giây
function convertISODurationToSeconds(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match?.[1] || 0);
  const minutes = parseInt(match?.[2] || 0);
  const seconds = parseInt(match?.[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

async function getYoutubeVideoDuration(videoId) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        id: videoId,
        part: 'contentDetails',
        key: apiKey
      }
    });

    const items = response.data.items;
    if (!items || items.length === 0) {
      console.warn('⚠️ Không tìm thấy video trên YouTube API');
      return null;
    }

    const duration = items[0].contentDetails.duration; // ISO 8601
    const seconds = convertISODurationToSeconds(duration);
    console.log(`[YouTube] Thời lượng: ${seconds}s`);
    return seconds;
  } catch (err) {
    console.warn('❌ Lỗi YouTube Data API:', err.message);
    return null;
  }
}

// Lấy duration từ video URL (Cloudinary hoặc YouTube)
async function getVideoDurationFromUrl(url) {
  console.log('[Duration] Đang xử lý URL:', url);

  if (isCloudinaryVideo(url)) {
    console.log('[Duration] Phát hiện là video Cloudinary');
    return await getCloudinaryVideoDuration(url);
  }

  const videoId = getVideoId(url);
  if (videoId) {
    console.log('[Duration] Phát hiện là video YouTube với ID:', videoId);
    return await getYoutubeVideoDuration(videoId);
  }

  console.warn('[Duration] Không xác định được loại video URL');
  return null;
}

module.exports = {
  getVideoId,
  isCloudinaryVideo,
  getCloudinaryPublicId,
  getVideoDurationFromUrl,
};
