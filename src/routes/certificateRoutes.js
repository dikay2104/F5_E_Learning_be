const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/issue', authMiddleware.verifyToken, certificateController.issueCertificate);
router.get('/my', authMiddleware.verifyToken, certificateController.getMyCertificates);
router.get('/:certificateId', authMiddleware.verifyToken, certificateController.getCertificateById);
router.post('/:certificateId/edit-name', authMiddleware.verifyToken, certificateController.editCertificateName);

module.exports = router; 