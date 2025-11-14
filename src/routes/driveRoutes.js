const express = require('express');
const multer = require('multer');
const { uploadFileToDrive } = require('../controllers/driveController');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;

    const result = await uploadFileToDrive(filePath, fileName, mimeType);

    // Xoá file local sau khi upload
    fs.unlinkSync(filePath);

    res.json({ link: result.previewLink });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

module.exports = router;
