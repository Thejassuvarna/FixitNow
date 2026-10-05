const path = require('path');
const multer = require('multer');
const { safeRedirect } = require('../utils/helpers');

/** Attaches the logged-in user + flash helpers + view locals */
function attachLocals(req, res, next) {
  const s = req.session;
  res.locals.currentUser = s && s.userId ? { id: s.userId, name: s.name, role: s.role } : null;

  // Minimal session-based flash messages
  req.flash = (type, message) => {
    s.flash = s.flash || [];
    s.flash.push({ type, message });
  };
  res.locals.flash = s.flash || [];
  delete s.flash;
  res.locals.currentPath = req.path;
  next();
}

function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  req.session.returnTo = req.originalUrl;
  req.flash('info', 'Please log in to continue.');
  return res.redirect('/auth/login');
}

const requireRole = (...roles) => (req, res, next) => {
  if (!req.session.userId) return requireAuth(req, res, next);
  if (roles.includes(req.session.role)) return next();
  const err = new Error('You do not have permission to access this page.');
  err.status = 403;
  return next(err);
};

function redirectIfAuth(req, res, next) {
  if (!req.session.userId) return next();
  const dest = { worker: '/dashboard/worker', admin: '/admin' }[req.session.role] || '/services';
  return res.redirect(dest);
}

/* ---------- Photo upload (multer) ---------- */
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'public', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `worker-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp)$/.test(file.mimetype) && /\.(jpe?g|png|webp)$/i.test(file.originalname);
    cb(ok ? null : new Error('Profile photo must be a JPG, PNG or WEBP image.'), ok);
  },
}).single('photo');

/** Wraps multer so upload problems become req.uploadError instead of crashing the request */
function uploadPhoto(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      req.uploadError = err.code === 'LIMIT_FILE_SIZE' ? 'Profile photo must be smaller than 2 MB.' : err.message;
    }
    next();
  });
}

module.exports = { attachLocals, requireAuth, requireRole, redirectIfAuth, uploadPhoto, safeRedirect };
