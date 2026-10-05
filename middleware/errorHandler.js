/* eslint-disable no-unused-vars */
const fs = require('fs');
const path = require('path');

/** Delete an uploaded file (used when validation fails after multer saved it) */
function removeUpload(file) {
  if (file && file.path) fs.unlink(file.path, () => {});
}

function notFound(req, res, next) {
  const err = new Error('The page you are looking for could not be found.');
  err.status = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  if (req.file) removeUpload(req.file);

  let status = err.status || 500;
  if (err.name === 'CastError') status = 404;
  if (err.name === 'ValidationError') status = 400;

  if (status >= 500) console.error(err);

  const messages = {
    403: 'Access denied',
    404: 'Page not found',
    400: 'Something was wrong with that request',
  };

  if (res.headersSent) return next(err);

  const wantsJson = req.xhr || (req.headers.accept || '').includes('application/json');
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Something went wrong on our side. Please try again.'
    : (err.name === 'CastError' ? 'The page you are looking for could not be found.' : err.message);

  if (wantsJson) return res.status(status).json({ ok: false, message });

  return res.status(status).render('error', {
    title: `${status} – LocalFix`,
    status,
    heading: messages[status] || 'Oops, something went wrong',
    message,
  });
}

module.exports = { notFound, errorHandler, removeUpload };
