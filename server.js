require('dotenv').config();
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const connectDB = require('./config/db');
const { attachLocals } = require('./middleware/authMiddleware');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const helpers = require('./utils/helpers');
const constants = require('./utils/constants');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ----- View engine -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
if (isProd) app.set('trust proxy', 1);

// ----- Core middleware -----
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Template helpers available in every view
Object.assign(app.locals, helpers, {
  CATEGORIES: constants.CATEGORIES,
  categoryMeta: constants.categoryMeta,
  siteName: 'LocalFix',
  title: 'LocalFix – Trusted local service professionals',
  description: 'Find trusted electricians, plumbers, mechanics, carpenters, painters and AC technicians near you.',
});

(async () => {
  const mongoUri = await connectDB();

  app.use(session({
    name: 'localfix.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-change-me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoUri, ttl: 60 * 60 * 24 * 7 }),
    cookie: { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 1000 * 60 * 60 * 24 * 7 },
  }));
  app.use(attachLocals);

  // ----- Routes -----
  app.use('/auth', require('./routes/authRoutes'));
  app.use('/workers', require('./routes/workerRoutes'));
  app.use('/', require('./routes/indexRoutes'));

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => console.log(`🚀 LocalFix running at http://localhost:${PORT}`));
})();
