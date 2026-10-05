const { CATEGORY_NAMES, INDIAN_STATES } = require('./constants');
const { normalizePhone } = require('./helpers');

const PINCODE_RE = /^[1-9]\d{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const splitList = (str) =>
  String(str || '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Validates + sanitises the worker profile fields shared by
 * registration and the worker dashboard.
 * @returns {{errors: string[], data: object, phone: string|null}}
 */
function validateWorkerInput(body) {
  const errors = [];

  const category = str(body.category);
  if (!CATEGORY_NAMES.includes(category)) errors.push('Please choose a valid service category.');

  const hourlyRate = Number(body.hourlyRate);
  if (!Number.isInteger(hourlyRate) || hourlyRate < 50 || hourlyRate > 10000)
    errors.push('Hourly rate must be a whole number between ₹50 and ₹10,000.');

  const visitingCharges = body.visitingCharges === '' || body.visitingCharges === undefined ? 0 : Number(body.visitingCharges);
  if (!Number.isInteger(visitingCharges) || visitingCharges < 0 || visitingCharges > 5000)
    errors.push('Visiting charges must be between ₹0 and ₹5,000.');

  const experienceYears = body.experienceYears === '' || body.experienceYears === undefined ? 0 : Number(body.experienceYears);
  if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 60)
    errors.push('Experience must be between 0 and 60 years.');

  const address = str(body.address);
  const city = str(body.city);
  const state = str(body.state);
  const pincode = str(body.pincode);
  if (city.length < 2 || city.length > 60) errors.push('Please enter your city or town.');
  if (!INDIAN_STATES.includes(state)) errors.push('Please select your state.');
  if (!PINCODE_RE.test(pincode)) errors.push('Pincode must be a valid 6-digit Indian pincode (e.g. 574201).');
  if (address.length > 200) errors.push('Address is too long (max 200 characters).');

  // Additional pincodes the worker serves – the home pincode is always included
  const extra = splitList(body.servicePincodes);
  const badPin = extra.find((p) => !PINCODE_RE.test(p));
  if (badPin) errors.push(`"${badPin}" is not a valid 6-digit pincode in your service area list.`);
  const servicePincodes = [...new Set([pincode, ...extra.filter((p) => PINCODE_RE.test(p))].filter((p) => PINCODE_RE.test(p)))].slice(0, 25);

  const serviceRadiusKm = body.serviceRadiusKm === '' || body.serviceRadiusKm === undefined ? 10 : Number(body.serviceRadiusKm);
  if (!Number.isInteger(serviceRadiusKm) || serviceRadiusKm < 1 || serviceRadiusKm > 100)
    errors.push('Service radius must be between 1 and 100 km.');

  const skills = [...new Set(splitList(body.skills).map((s) => s.slice(0, 40)))].slice(0, 12);
  const bio = str(body.bio);
  if (bio.length > 600) errors.push('Bio must be 600 characters or fewer.');

  const rawPhone = body.phone ? String(body.phone).trim() : '';
  const phone = /^[0-9]{10}$/.test(rawPhone) ? rawPhone : null;
  if (!phone) errors.push('Phone number must be exactly 10 digits.');

  return {
    errors,
    phone,
    data: {
      category, hourlyRate, visitingCharges, experienceYears, skills, bio,
      serviceRadiusKm, servicePincodes,
      location: { address, city, state, pincode },
    },
  };
}

module.exports = { validateWorkerInput, PINCODE_RE, EMAIL_RE };
