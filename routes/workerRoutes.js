const router = require('express').Router();
const worker = require('../controllers/workerController');
const review = require('../controllers/reviewController');
const { requireRole, requireAuth, upload, uploadWorkPhotos } = require('../middleware/authMiddleware');

router.get('/:id', requireAuth, worker.show);
router.post('/:id/photos', requireAuth, uploadWorkPhotos, worker.uploadWorkPhotos);
router.post('/workers/:id/photos', requireAuth, uploadWorkPhotos, worker.uploadWorkPhotos);
router.delete('/:id/photos/:photoIndex', requireAuth, worker.deleteWorkPhoto);
router.post('/:id/photos/:photoIndex/delete', requireAuth, worker.deleteWorkPhoto);
router.post('/:id/reviews', requireRole('customer'), review.create);

module.exports = router;
