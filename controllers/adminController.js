const mongoose = require('mongoose');
const WorkerProfile = require('../models/WorkerProfile');
const Review = require('../models/Review');
const User = require('../models/User');

const notFound = () => Object.assign(new Error('Not found.'), { status: 404 });

/* ----------------------------- GET /admin ----------------------------- */
exports.dashboard = async (req, res, next) => {
  try {
    const [workers, reviews, userTotal, workerTotal, reviewTotal, pendingVerify] = await Promise.all([
      WorkerProfile.find().sort({ createdAt: -1 }).limit(60).populate('userId', 'name email phone'),
      Review.find().sort({ createdAt: -1 }).limit(30).populate('customerId', 'name').populate({ path: 'workerId', populate: { path: 'userId', select: 'name' } }),
      User.countDocuments(),
      WorkerProfile.countDocuments(),
      Review.countDocuments(),
      WorkerProfile.countDocuments({ isVerified: false }),
    ]);
    res.render('admin/index', {
      title: 'Admin – FixitNow',
      description: 'Moderate listings and reviews.',
      workers: workers.filter((w) => w.userId),
      reviews: reviews.filter((r) => r.workerId && r.workerId.userId && r.customerId),
      stats: { userTotal, workerTotal, reviewTotal, pendingVerify },
    });
  } catch (err) { next(err); }
};

const toggle = (field, label) => async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return next(notFound());
    const worker = await WorkerProfile.findById(req.params.id);
    if (!worker) return next(notFound());
    worker[field] = !worker[field];
    await worker.save();
    req.flash('success', `Listing ${worker[field] ? '' : 'un'}${label}.`);
    res.redirect('/admin#workers');
  } catch (err) { next(err); }
};

exports.toggleVerified = toggle('isVerified', 'verified');
exports.toggleActive = toggle('isActive', 'activated');

exports.deleteReview = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return next(notFound());
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return next(notFound());
    await Review.recalculate(review.workerId);
    req.flash('success', 'Review removed and rating recalculated.');
    res.redirect('/admin#reviews');
  } catch (err) { next(err); }
};
