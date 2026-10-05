const router = require('express').Router();
const worker = require('../controllers/workerController');
const admin = require('../controllers/adminController');
const { requireRole, uploadPhoto } = require('../middleware/authMiddleware');

// Public pages
router.get('/', worker.home);
router.get('/services', worker.list);

// Worker dashboard
router.get('/dashboard/worker', requireRole('worker'), worker.dashboard);
router.post('/dashboard/worker', requireRole('worker'), uploadPhoto, worker.updateProfile);
router.post('/dashboard/worker/availability', requireRole('worker'), worker.toggleAvailability);

// Admin moderation
router.get('/admin', requireRole('admin'), admin.dashboard);
router.post('/admin/workers/:id/verify', requireRole('admin'), admin.toggleVerified);
router.post('/admin/workers/:id/active', requireRole('admin'), admin.toggleActive);
router.post('/admin/reviews/:id/delete', requireRole('admin'), admin.deleteReview);

module.exports = router;
