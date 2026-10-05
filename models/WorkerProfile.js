const mongoose = require('mongoose');
const { CATEGORY_NAMES } = require('../utils/constants');

const workerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  category: { type: String, enum: CATEGORY_NAMES, required: true, index: true },
  skills: [{ type: String, trim: true }],
  experienceYears: { type: Number, min: 0, max: 60, default: 0 },
  hourlyRate: { type: Number, required: true, min: 50 },       // ₹ per hour
  visitingCharges: { type: Number, min: 0, default: 0 },       // ₹ inspection / visit fee
  bio: { type: String, trim: true, maxlength: 600 },
  photo: { type: String },                                      // e.g. /uploads/worker-123.jpg
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'],
  },
  workImages: [{ type: String }],                               // portfolio / work photos
  location: {
    address: { type: String, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, match: [/^[1-9]\d{5}$/, 'Pincode must be 6 digits'], index: true },
  },
  servicePincodes: [{ type: String, match: /^[1-9]\d{5}$/ }],   // other pincodes served
  serviceRadiusKm: { type: Number, min: 1, max: 100, default: 10 },
  isAvailable: { type: Boolean, default: true },                // Available / Busy
  isVerified: { type: Boolean, default: false },                // set by admin
  isActive: { type: Boolean, default: true },                   // admin can hide a listing
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
});

workerProfileSchema.index({ servicePincodes: 1 });
workerProfileSchema.index({ averageRating: -1, reviewsCount: -1 });

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
