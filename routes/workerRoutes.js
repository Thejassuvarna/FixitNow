const router = require('express').Router();
const worker = require('../controllers/workerController');
const review = require('../controllers/reviewController');
const { requireRole, requireAuth } = require('../middleware/authMiddleware');

router.get('/:id',requireAuth, worker.show);
router.post('/:id/reviews', requireRole('customer'), review.create);

module.exports = router;
