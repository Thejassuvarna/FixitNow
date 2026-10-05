const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const WorkerProfile = require('../models/WorkerProfile');
const Review = require('../models/Review');
const User = require('../models/User');
const { CATEGORIES, CATEGORY_NAMES, INDIAN_STATES, PRICE_RANGES } = require('../utils/constants');
const { escapeRegex } = require('../utils/helpers');
const { validateWorkerInput } = require('../utils/validators');
const { removeUpload } = require('../middleware/errorHandler');

const PAGE_SIZE = 9;

const SORTS = {
  rating: { averageRating: -1, reviewsCount: -1, createdAt: -1 },
  reviews: { reviewsCount: -1, averageRating: -1 },
  priceLow: { hourlyRate: 1 },
  priceHigh: { hourlyRate: -1 },
  experience: { experienceYears: -1 },
};

/** Turns the query string into a Mongo filter */
function buildFilter(q) {
  const filter = { isActive: true };

  if (CATEGORY_NAMES.includes(q.category)) filter.category = q.category;

  const loc = (q.location || '').trim();
  if (loc) {
    if (/^\d{6}$/.test(loc)) {
      filter.$or = [{ 'location.pincode': loc }, { servicePincodes: loc }];
    } else if (/^\d{3,5}$/.test(loc)) {
      filter['location.pincode'] = new RegExp(`^${loc}`); // partial pincode prefix
    } else {
      const rx = new RegExp(escapeRegex(loc), 'i');
      filter.$or = [{ 'location.city': rx }, { 'location.address': rx }];
    }
  }

  if (q.price === 'under300') filter.hourlyRate = { $lt: 300 };
  else if (q.price === '300-600') filter.hourlyRate = { $gte: 300, $lte: 600 };
  else if (q.price === '600plus') filter.hourlyRate = { $gt: 600 };

  const minRating = Number(q.rating);
  if ([3, 4].includes(minRating)) filter.averageRating = { $gte: minRating };

  if (q.available === '1') filter.isAvailable = true;
  return filter;
}

/* ------------------------------ GET / ------------------------------ */
exports.home = async (req, res, next) => {
  try {
    const [featured, counts, workerTotal, reviewTotal, cities] = await Promise.all([
      WorkerProfile.find({ isActive: true, reviewsCount: { $gt: 0 } })
        .sort({ averageRating: -1, reviewsCount: -1 }).limit(6).populate('userId', 'name phone'),
      WorkerProfile.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
      WorkerProfile.countDocuments({ isActive: true }),
      Review.countDocuments(),
      WorkerProfile.distinct('location.city', { isActive: true }),
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.n]));

    res.render('index', {
      title: 'FixitNow – Trusted electricians, plumbers & more near you',
      description: 'Book verified local electricians, plumbers, mechanics, carpenters, painters and AC technicians in your city. Transparent ₹ pricing.',
      categories: CATEGORIES.map((c) => ({ ...c, count: countMap[c.name] || 0 })),
      featured: featured.filter((w) => w.userId),
      stats: { workerTotal, reviewTotal, cityTotal: cities.length },
      query: {},
    });
  } catch (err) { next(err); }
};

/* --------------------------- GET /services --------------------------- */
exports.list = async (req, res, next) => {
  try {
    const query = {
      category: CATEGORY_NAMES.includes(req.query.category) ? req.query.category : '',
      location: (req.query.location || '').trim().slice(0, 60),
      price: PRICE_RANGES.some((p) => p.value === req.query.price) ? req.query.price : '',
      rating: ['3', '4'].includes(req.query.rating) ? req.query.rating : '',
      available: req.query.available === '1' ? '1' : '',
      sort: SORTS[req.query.sort] ? req.query.sort : 'rating',
    };
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const filter = buildFilter(query);

    const [total, workers] = await Promise.all([
      WorkerProfile.countDocuments(filter),
      WorkerProfile.find(filter).sort(SORTS[query.sort]).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE)
        .populate('userId', 'name phone'),
    ]);

    // Query string without "page" for pagination links
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => v && params.set(k, v));

    const active = CATEGORIES.find((c) => c.name === query.category);
    res.render('workers/index', {
      title: `${active ? active.name + 's' : 'Local service professionals'}${query.location ? ' in ' + query.location : ''} – FixitNow`,
      description: 'Browse verified local service professionals. Filter by category, pincode, city, price in ₹ and rating.',
      workers: workers.filter((w) => w.userId),
      query, total, page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      baseQuery: params.toString(),
      categories: CATEGORIES,
      priceRanges: PRICE_RANGES,
    });
  } catch (err) { next(err); }
};

/* ------------------------- GET /workers/:id -------------------------- */
exports.show = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return next(Object.assign(new Error('Worker not found.'), { status: 404 }));

    const worker = await WorkerProfile.findById(id).populate('userId', 'name phone createdAt');
    const viewer = res.locals.currentUser;
    const isOwner = viewer && worker && worker.userId && worker.userId._id.toString() === viewer.id;
    if (!worker || !worker.userId || (!worker.isActive && !isOwner && !(viewer && viewer.role === 'admin'))) {
      return next(Object.assign(new Error('This worker profile could not be found.'), { status: 404 }));
    }

    if (worker && worker.userId && worker.userId._id) {
      worker.userId.toString = function() { return this._id.toString(); };
    }

    const [reviews, similar] = await Promise.all([
      Review.find({ workerId: worker._id }).sort({ createdAt: -1 }).populate('customerId', 'name'),
      WorkerProfile.find({ _id: { $ne: worker._id }, isActive: true, category: worker.category })
        .sort({ averageRating: -1 }).limit(3).populate('userId', 'name phone'),
    ]);

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star, count: reviews.filter((r) => r.rating === star).length,
    }));
    const myReview = viewer && viewer.role === 'customer'
      ? reviews.find((r) => r.customerId && r.customerId._id.toString() === viewer.id) : null;

    res.render('workers/show', {
      title: `${worker.userId.name} – ${worker.category} in ${worker.location.city} | FixitNow`,
      description: `${worker.userId.name}, ${worker.category} in ${worker.location.city} (${worker.location.pincode}). ₹${worker.hourlyRate}/hr. Rated ${worker.averageRating}/5.`,
      worker, reviews, distribution, myReview, similar: similar.filter((w) => w.userId), isOwner,
      errors: [], form: {},
    });
  } catch (err) { next(err); }
};

/* ---------------------- GET /dashboard/worker ------------------------ */
async function renderDashboard(req, res, next, extra = {}) {
  try {
    const worker = await WorkerProfile.findOne({ userId: req.session.userId }).populate('userId', 'name email phone');
    if (!worker) return next(Object.assign(new Error('Worker profile not found.'), { status: 404 }));
    const recent = await Review.find({ workerId: worker._id }).sort({ createdAt: -1 }).limit(5).populate('customerId', 'name');
    return res.render('dashboard/worker', {
      title: 'Worker dashboard – FixitNow',
      description: 'Manage your FixitNow listing.',
      worker, recent, states: INDIAN_STATES, categories: CATEGORIES, errors: [], form: null, ...extra,
    });
  } catch (err) { return next(err); }
}

exports.dashboard = (req, res, next) => renderDashboard(req, res, next);

/* ---------------------- POST /dashboard/worker ----------------------- */
exports.updateProfile = async (req, res, next) => {
  try {
    const worker = await WorkerProfile.findOne({ userId: req.session.userId });
    if (!worker) return next(Object.assign(new Error('Worker profile not found.'), { status: 404 }));

    const rawPhone = req.body.phone ? String(req.body.phone).trim() : '';
    if (!rawPhone || !/^[0-9]{10}$/.test(rawPhone)) {
      removeUpload(req.file);
      const msg = 'Phone number must be exactly 10 digits.';
      if (req.flash) req.flash('error', msg);
      res.status(400);
      return renderDashboard(req, res, next, { errors: [msg], form: req.body });
    }

    const { errors, data, phone } = validateWorkerInput(req.body);
    if (req.uploadError) errors.push(req.uploadError);
    if (errors.length) {
      removeUpload(req.file);
      if (req.flash) errors.forEach((e) => req.flash('error', e));
      res.status(400);
      return renderDashboard(req, res, next, { errors, form: req.body });
    }

    Object.assign(worker, data);
    worker.phone = phone;
    if (req.file) {
      const old = worker.photo;
      worker.photo = `/uploads/${req.file.filename}`;
      if (old && old.startsWith('/uploads/')) {
        require('fs').unlink(require('path').join(__dirname, '..', 'public', old), () => {});
      }
    }

    // Handle work photos uploaded with profile update
    const uploadedWorkPhotos = req.workPhotos || (req.files && (req.files.workPhotos || req.files.images)) || [];
    if (uploadedWorkPhotos && uploadedWorkPhotos.length > 0) {
      const newUrls = uploadedWorkPhotos.map((file) => {
        if (file.path && /^https?:\/\//.test(file.path)) return file.path;
        if (file.secure_url) return file.secure_url;
        if (file.url) return file.url;
        if (file.filename) return `/uploads/${file.filename}`;
        if (file.path) {
          const base = path.basename(file.path);
          return `/uploads/${base}`;
        }
        return `/uploads/${file.originalname}`;
      });
      if (!worker.workImages) worker.workImages = [];
      worker.workImages.push(...newUrls);
    }

    await worker.save();
    await User.findByIdAndUpdate(req.session.userId, { phone }, { runValidators: true });

    req.flash('success', 'Profile updated successfully.');
    return res.redirect('/dashboard/worker');
  } catch (err) {
    removeUpload(req.file);
    return next(err);
  }
};

/* ------------------ POST /dashboard/worker/availability --------------- */
exports.toggleAvailability = async (req, res, next) => {
  try {
    const worker = await WorkerProfile.findOne({ userId: req.session.userId });
    if (!worker) return next(Object.assign(new Error('Worker profile not found.'), { status: 404 }));

    worker.isAvailable = typeof req.body.available !== 'undefined'
      ? req.body.available === 'true' : !worker.isAvailable;
    await worker.save();

    if (req.xhr || (req.headers.accept || '').includes('application/json')) {
      return res.json({ ok: true, isAvailable: worker.isAvailable });
    }
    req.flash('success', `You are now marked as ${worker.isAvailable ? 'Available' : 'Busy'}.`);
    return res.redirect('/dashboard/worker');
  } catch (err) { return next(err); }
};

/* ---------------- POST /workers/:id/photos ---------------- */
exports.uploadWorkPhotos = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      if (req.files) {
        if (Array.isArray(req.files)) req.files.forEach(removeUpload);
        else Object.values(req.files).flat().forEach(removeUpload);
      }
      return next(Object.assign(new Error('Worker not found.'), { status: 404 }));
    }

    const worker = await WorkerProfile.findById(id);
    if (!worker) {
      if (req.files) {
        if (Array.isArray(req.files)) req.files.forEach(removeUpload);
        else Object.values(req.files).flat().forEach(removeUpload);
      }
      return next(Object.assign(new Error('Worker profile not found.'), { status: 404 }));
    }

    // Validate that the logged-in user is authenticated and matches the worker profile owner
    const currentUserId = (req.session && req.session.userId)
      ? req.session.userId.toString()
      : (req.user && (req.user._id || req.user.id)?.toString());
    const currentUserRole = (req.session && req.session.role) || (req.user && req.user.role);
    const workerUserId = worker.userId && (worker.userId._id || worker.userId).toString();

    if (!currentUserId) {
      if (req.files) {
        if (Array.isArray(req.files)) req.files.forEach(removeUpload);
        else Object.values(req.files).flat().forEach(removeUpload);
      }
      if (req.flash) req.flash('error', 'Please log in to continue.');
      const err = new Error('Authentication required.');
      err.status = 401;
      return next(err);
    }

    const isOwner = Boolean(currentUserId === workerUserId);
    const isAdmin = currentUserRole === 'admin';

    if (!isOwner && !isAdmin) {
      if (req.files) {
        if (Array.isArray(req.files)) req.files.forEach(removeUpload);
        else Object.values(req.files).flat().forEach(removeUpload);
      }
      if (req.flash) req.flash('error', 'You do not have permission to upload photos to this profile.');
      const err = new Error('You do not have permission to upload photos to this profile.');
      err.status = 403;
      return next(err);
    }

    // Collect files from various multer structures
    let files = [];
    if (Array.isArray(req.files)) {
      files = req.files;
    } else if (req.files && typeof req.files === 'object') {
      files = [...(req.files.workPhotos || []), ...(req.files.images || []), ...Object.values(req.files).flat()]
        .filter((v, i, a) => a.indexOf(v) === i);
    } else if (req.file) {
      files = [req.file];
    }

    // Check if files were uploaded
    if (!files || files.length === 0) {
      if (req.flash) req.flash('error', 'Please select at least one photo to upload.');
      const returnUrl = req.body.returnTo || req.query.returnTo || (req.get('Referrer') && req.get('Referrer').includes('/dashboard') ? '/dashboard/worker' : `/workers/${worker._id}`);
      return res.redirect(returnUrl);
    }

    // Map uploaded files to URLs
    const uploadedUrls = files.map((file) => {
      if (file.path && /^https?:\/\//.test(file.path)) return file.path;
      if (file.secure_url) return file.secure_url;
      if (file.url) return file.url;
      if (file.filename) return `/uploads/${file.filename}`;
      if (file.path) {
        const base = path.basename(file.path);
        return `/uploads/${base}`;
      }
      return `/uploads/${file.originalname}`;
    });

    if (!worker.workImages) {
      worker.workImages = [];
    }
    worker.workImages.push(...uploadedUrls);
    await worker.save();

    if (req.flash) req.flash('success', `${uploadedUrls.length} work photo${uploadedUrls.length > 1 ? 's' : ''} uploaded successfully.`);
    const returnUrl = req.body.returnTo || req.query.returnTo || (req.get('Referrer') && req.get('Referrer').includes('/dashboard') ? '/dashboard/worker' : `/workers/${worker._id}`);
    return res.redirect(returnUrl);
  } catch (err) {
    if (req.files) {
      if (Array.isArray(req.files)) req.files.forEach(removeUpload);
      else Object.values(req.files).flat().forEach(removeUpload);
    }
    return next(err);
  }
};
exports.uploadPhotos = exports.uploadWorkPhotos;

/* ---------------- DELETE /workers/:id/photos/:photoIndex ---------------- */
exports.deleteWorkPhoto = async (req, res, next) => {
  try {
    const { id, photoIndex } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next(Object.assign(new Error('Worker not found.'), { status: 404 }));
    }

    const worker = await WorkerProfile.findById(id);
    if (!worker) {
      return next(Object.assign(new Error('Worker profile not found.'), { status: 404 }));
    }

    const currentUserId = (req.session && req.session.userId)
      ? req.session.userId.toString()
      : (req.user && (req.user._id || req.user.id)?.toString());
    const currentUserRole = (req.session && req.session.role) || (req.user && req.user.role);
    const workerUserId = worker.userId && (worker.userId._id || worker.userId).toString();

    const isOwner = Boolean(currentUserId && currentUserId === workerUserId);
    const isAdmin = currentUserRole === 'admin';

    if (!isOwner && !isAdmin) {
      const err = new Error('You do not have permission to delete photos from this profile.');
      err.status = 403;
      return next(err);
    }

    const index = parseInt(photoIndex, 10);
    if (isNaN(index) || !worker.workImages || index < 0 || index >= worker.workImages.length) {
      req.flash('error', 'Photo not found.');
      const returnUrl = req.body.returnTo || req.query.returnTo || (req.get('Referrer') && req.get('Referrer').includes('/dashboard') ? '/dashboard/worker' : `/workers/${worker._id}`);
      return res.redirect(returnUrl);
    }

    // Clean up local disk file if exists
    const removedItem = worker.workImages[index];
    const removedImgPath = typeof removedItem === 'string' ? removedItem : (removedItem.url || '');
    if (removedImgPath && removedImgPath.startsWith('/uploads/')) {
      const p = path.join(__dirname, '..', 'public', removedImgPath);
      fs.unlink(p, () => {});
    }

    worker.workImages.splice(index, 1);
    await worker.save();

    if (req.xhr || (req.headers && (req.headers.accept || '').includes('application/json'))) {
      return res.json({ ok: true, workImages: worker.workImages });
    }

    req.flash('success', 'Work photo removed successfully.');
    const returnUrl = req.body.returnTo || req.query.returnTo || (req.get('Referrer') && req.get('Referrer').includes('/dashboard') ? '/dashboard/worker' : `/workers/${worker._id}`);
    return res.redirect(returnUrl);
  } catch (err) {
    return next(err);
  }
};
exports.deletePhoto = exports.deleteWorkPhoto;


