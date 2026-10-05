const mongoose = require('mongoose');
const WorkerProfile = require('../models/WorkerProfile');
const Review = require('../models/Review');

/* ------------------- POST /workers/:id/reviews ----------------------- */
exports.create = async (req, res, next) => {
  const { id } = req.params;
  const back = `/workers/${id}#reviews`;
  try {
    if (!mongoose.isValidObjectId(id)) return next(Object.assign(new Error('Worker not found.'), { status: 404 }));

    const worker = await WorkerProfile.findById(id);
    if (!worker || !worker.isActive) return next(Object.assign(new Error('Worker not found.'), { status: 404 }));

    const rating = Number(req.body.rating);
    const comment = (req.body.comment || '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      req.flash('error', 'Please choose a star rating between 1 and 5.');
      return res.redirect(back);
    }
    if (comment.length < 3 || comment.length > 1000) {
      req.flash('error', 'Please write a short comment (3–1000 characters).');
      return res.redirect(back);
    }

    // One review per customer: update if it already exists
    const existing = await Review.findOne({ workerId: id, customerId: req.session.userId });
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      existing.createdAt = new Date();
      await existing.save();
    } else {
      await Review.create({ workerId: id, customerId: req.session.userId, rating, comment });
    }
    await Review.recalculate(id);

    req.flash('success', existing ? 'Your review has been updated.' : 'Thanks! Your review has been posted.');
    return res.redirect(back);
  } catch (err) { return next(err); }
};
