const path = require('path');
const multer = require('multer');
const { safeRedirect } = require('../utils/helpers');

/** Attaches the logged-in user + flash helpers + view locals */
function attachLocals(req, res, next) {
  const s = req.session;
  res.locals.currentUser = s && s.userId ? { id: s.userId, _id: s.userId, name: s.name, role: s.role } : null;

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
  if (req.session && req.session.userId) return next();
  if (req.user && (req.user._id || req.user.id)) return next();
  if (req.session) req.session.returnTo = req.originalUrl;
  if (req.flash) req.flash('info', 'Please log in to continue.');
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype) && /\.(jpe?g|png|webp|gif)$/i.test(file.originalname);
    cb(ok ? null : new Error('Photos must be JPG, PNG, or WEBP images.'), ok);
  },
});

const uploadWorkerProfileFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'workPhotos', maxCount: 20 },
  { name: 'images', maxCount: 20 },
]);

/** Wraps multer so upload problems become req.uploadError instead of crashing the request */
function uploadPhoto(req, res, next) {
  uploadWorkerProfileFields(req, res, (err) => {
    if (err) {
      req.uploadError = err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded files must be smaller than 5 MB.' : err.message;
    }
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        req.file = req.files.photo[0];
      }
      if (req.files.workPhotos) {
        req.workPhotos = req.files.workPhotos;
      }
    }
    next();
  });
}

/** Handles multiple work photo uploads (supports 'workPhotos' or 'images') */
const uploadWorkPhotos = (req, res, next) => {
  upload.fields([
    { name: 'workPhotos', maxCount: 20 },
    { name: 'images', maxCount: 20 },
  ])(req, res, (err) => {
    if (err) return next(err);
    if (req.files && !Array.isArray(req.files)) {
      req.files = [...(req.files.workPhotos || []), ...(req.files.images || [])];
    }
    next();
  });
};
uploadWorkPhotos.array = (field = 'workPhotos', max = 20) => upload.array(field, max);

module.exports = { attachLocals, requireAuth, requireRole, redirectIfAuth, uploadPhoto, upload, uploadWorkPhotos, safeRedirect };
