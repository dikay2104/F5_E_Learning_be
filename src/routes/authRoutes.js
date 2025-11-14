const express = require('express');
const router = express.Router();
const { register, login, sendCode } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/send-code', sendCode);

module.exports = router;