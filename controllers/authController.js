const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const { validateWorkerInput, EMAIL_RE } = require('../utils/validators');
const { normalizePhone, safeRedirect } = require('../utils/helpers');
const { removeUpload } = require('../middleware/errorHandler');
const { CATEGORIES, INDIAN_STATES } = require('../utils/constants');

const homeFor = (role) => ({ worker: '/dashboard/worker', admin: '/admin' }[role] || '/services');

/** Regenerates the session (prevents fixation) and stores the user */
function startSession(req, user) {
  const returnTo = req.session.returnTo;
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user._id.toString();
      req.session.name = user.name;
      req.session.role = user.role;
      req.session.returnTo = returnTo;
      resolve();
    });
  });
}

const registerView = (res, extra = {}) =>
  res.render('auth/register', {
    title: 'Create your account – LocalFix',
    description: 'Join LocalFix as a customer to book trusted local pros, or as a worker to grow your business.',
    categories: CATEGORIES,
    states: INDIAN_STATES,
    form: {},
    role: 'customer',
    errors: [],
    ...extra,
  });

exports.getRegister = (req, res) => {
  registerView(res, { role: req.query.role === 'worker' ? 'worker' : 'customer' });
};

exports.postRegister = async (req, res, next) => {
  const body = req.body;
  const role = body.role === 'worker' ? 'worker' : 'customer'; // admins can't self-register
  const errors = [];
  const fail = (code = 400) => {
    removeUpload(req.file);
    // never echo passwords back
    const { password, confirmPassword, ...form } = body;
    return res.status(code).render('auth/register', {
      title: 'Create your account – LocalFix', description: '', categories: CATEGORIES,
      states: INDIAN_STATES, form, role, errors,
    });
  };

  try {
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (name.length < 2 || name.length > 60) errors.push('Please enter your full name (2–60 characters).');
    if (!EMAIL_RE.test(email)) errors.push('Please enter a valid email address.');
    if (password.length < 8) errors.push('Password must be at least 8 characters long.');
    if (password !== body.confirmPassword) errors.push('Passwords do not match.');
    if (req.uploadError) errors.push(req.uploadError);

    let phone = null;
    let workerData = null;
    if (role === 'worker') {
      const result = validateWorkerInput(body);
      errors.push(...result.errors);
      phone = result.phone;
      workerData = result.data;
    } else if (body.phone && body.phone.trim()) {
      phone = normalizePhone(body.phone);
      if (!phone) errors.push('Enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210).');
    }

    if (!errors.length && (await User.exists({ email }))) errors.push('An account with this email already exists. Try logging in.');
    if (errors.length) return fail();

    const user = await User.create({ name, email, password, role, phone: phone || undefined });

    if (role === 'worker') {
      try {
        await WorkerProfile.create({
          userId: user._id,
          ...workerData,
          photo: req.file ? `/uploads/${req.file.filename}` : undefined,
        });
      } catch (err) {
        await User.deleteOne({ _id: user._id }); // keep data consistent
        throw err;
      }
    }

    await startSession(req, user);
    req.flash('success', `Welcome to LocalFix, ${user.name.split(' ')[0]}! 🎉`);
    if (role === 'worker') req.flash('info', 'Your profile is live. Keep your availability up to date to get more bookings.');
    return res.redirect(homeFor(role));
  } catch (err) {
    removeUpload(req.file);
    if (err.code === 11000) {
      errors.push('An account with this email already exists. Try logging in.');
      return fail();
    }
    return next(err);
  }
};

exports.getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Log in – LocalFix',
    description: 'Log in to your LocalFix account.',
    role: req.query.role === 'worker' ? 'worker' : 'customer',
    form: {},
    errors: [],
  });
};

exports.postLogin = async (req, res, next) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const role = req.body.role === 'worker' ? 'worker' : 'customer';
  const fail = (msg) =>
    res.status(401).render('auth/login', {
      title: 'Log in – LocalFix', description: '', role, form: { email }, errors: [msg],
    });

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password || ''))) {
      return fail('Invalid email or password.');
    }
    // The role toggle is a safety check – admins may use either tab
    if (user.role !== 'admin' && user.role !== role) {
      return fail(`This account is registered as a ${user.role}. Switch the toggle to "${user.role === 'worker' ? 'Worker' : 'Customer'}" and try again.`);
    }

    await startSession(req, user);
    const dest = req.session.returnTo;
    delete req.session.returnTo;
    req.flash('success', `Welcome back, ${user.name.split(' ')[0]}!`);
    return res.redirect(safeRedirect(dest, homeFor(user.role)));
  } catch (err) {
    return next(err);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('localfix.sid');
    res.redirect('/');
  });
};
