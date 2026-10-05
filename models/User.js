const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
  email: {
    type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please enter a valid email'],
  },
  password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
  role: { type: String, enum: ['customer', 'worker', 'admin'], default: 'customer' },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'],
  },
  workImages: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now },
});

// Hash password whenever it's set/changed
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toString = function() {
  return this._id ? this._id.toString() : '';
};

module.exports = mongoose.model('User', userSchema);
