const router = require('express').Router();
const auth = require('../controllers/authController');
const { redirectIfAuth, uploadPhoto } = require('../middleware/authMiddleware');

router.get('/register', redirectIfAuth, auth.getRegister);
router.post('/register', redirectIfAuth, uploadPhoto, auth.postRegister);
router.get('/login', redirectIfAuth, auth.getLogin);
router.post('/login', redirectIfAuth, auth.postLogin);
router.post('/logout', auth.logout);

module.exports = router;
