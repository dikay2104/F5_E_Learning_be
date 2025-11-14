const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const auth = require('../middlewares/authMiddleware');

router.post('/', auth.verifyToken, auth.requireRole('teacher'), collectionController.createCollection);
router.get('/course/:courseId', collectionController.getCollectionsByCourse);
router.get('/:collectionId', collectionController.getCollectionById);
router.put('/:collectionId', auth.verifyToken, auth.requireRole('teacher'), collectionController.updateCollection);
router.delete('/:collectionId', auth.verifyToken, auth.requireRole('teacher'), collectionController.deleteCollection);
router.put('/:collectionId/reorder-collection', auth.verifyToken, auth.requireRole('teacher'), collectionController.reorderCollection);

module.exports = router;