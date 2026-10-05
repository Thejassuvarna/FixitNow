const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, required: true, minlength: 3, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
});

// One review per customer per worker (re-submitting updates the existing one)
reviewSchema.index({ workerId: 1, customerId: 1 }, { unique: true });

/**
 * Recomputes averageRating + reviewsCount on the worker profile.
 */
reviewSchema.statics.recalculate = async function recalculate(workerId) {
  const [agg] = await this.aggregate([
    { $match: { workerId: new mongoose.Types.ObjectId(workerId) } },
    { $group: { _id: '$workerId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await mongoose.model('WorkerProfile').findByIdAndUpdate(workerId, {
    averageRating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    reviewsCount: agg ? agg.count : 0,
  });
};

module.exports = mongoose.model('Review', reviewSchema);
