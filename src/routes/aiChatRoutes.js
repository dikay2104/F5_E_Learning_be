const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');

router.post('/', aiChatController.aiChat);

module.exports = router;