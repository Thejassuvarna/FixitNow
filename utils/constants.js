// NOTE: Tailwind scans this file (see tailwind.config.js) so the class strings below are kept in the CSS build.
const CATEGORIES = [
  { name: 'Electrician', slug: 'electrician', icon: '⚡', tagline: 'Wiring, fans & switchboards', gradient: 'from-amber-400 to-orange-500', tint: 'bg-amber-50 text-amber-700' },
  { name: 'Plumber', slug: 'plumber', icon: '🚰', tagline: 'Leaks, taps & pipelines', gradient: 'from-sky-400 to-blue-500', tint: 'bg-sky-50 text-sky-700' },
  { name: 'Mechanic', slug: 'mechanic', icon: '🔧', tagline: 'Bike & car repairs', gradient: 'from-slate-500 to-slate-700', tint: 'bg-slate-100 text-slate-700' },
  { name: 'Carpenter', slug: 'carpenter', icon: '🪚', tagline: 'Furniture, doors & fittings', gradient: 'from-yellow-600 to-amber-700', tint: 'bg-yellow-50 text-yellow-800' },
  { name: 'Painter', slug: 'painter', icon: '🎨', tagline: 'Interior & exterior walls', gradient: 'from-pink-400 to-rose-500', tint: 'bg-rose-50 text-rose-700' },
  { name: 'AC Technician', slug: 'ac-technician', icon: '❄️', tagline: 'AC & appliance service', gradient: 'from-cyan-400 to-teal-500', tint: 'bg-teal-50 text-teal-700' },
];

const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

const categoryMeta = (name) => CATEGORIES.find((c) => c.name === name) || CATEGORIES[0];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// Avatar gradients (used when a worker has no uploaded photo)
const AVATAR_GRADIENTS = [
  'from-orange-400 to-rose-500',
  'from-indigo-400 to-violet-600',
  'from-emerald-400 to-teal-600',
  'from-sky-400 to-indigo-500',
  'from-fuchsia-400 to-pink-600',
  'from-amber-400 to-orange-600',
];

const PRICE_RANGES = [
  { value: '', label: 'Any price' },
  { value: 'under300', label: 'Under ₹300' },
  { value: '300-600', label: '₹300 – ₹600' },
  { value: '600plus', label: '₹600+' },
];

module.exports = { CATEGORIES, CATEGORY_NAMES, categoryMeta, INDIAN_STATES, AVATAR_GRADIENTS, PRICE_RANGES };
