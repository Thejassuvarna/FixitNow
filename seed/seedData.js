/**
 * Seeds FixitNow with demo data: 1 admin, 5 customers, 16 workers and ~60 reviews.
 * Usage: npm run seed   (WARNING: wipes users, workerprofiles and reviews)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Review = require('../models/Review');
const { normalizePhone } = require('../utils/helpers');

const PASSWORD = 'Password@123';
const ADMIN_PASSWORD = 'Admin@12345';

const mkPhone = (i) => String(9810000000 + i * 12345);

const customers = [
  { name: 'Priya Nair', email: 'priya@example.com' },
  { name: 'Arjun Mehta', email: 'arjun@example.com' },
  { name: 'Neha Kulkarni', email: 'neha@example.com' },
  { name: 'Rohit Verma', email: 'rohit@example.com' },
  { name: 'Divya Hegde', email: 'divya@example.com' },
];

// ratings = one per customer (in order, 0 = no review)
const workers = [
  { name: 'Ramesh Shetty', email: 'ramesh@example.com', phone: '9876543210', category: 'Electrician', exp: 8, rate: 299, visit: 150, city: 'Puttur', state: 'Karnataka', pin: '574201', area: 'Main Road, Darbe', extra: ['574202', '574203', '574241'], radius: 15, verified: true, skills: ['House wiring', 'Inverter installation', 'MCB & switchboard repair', 'Fan & light fitting'], bio: 'Licensed electrician with 8 years of experience in homes and small shops across Puttur taluk. Punctual, neat work and honest quotes.', ratings: [5, 5, 4, 5, 5] },
  { name: 'Abdul Rahim', email: 'rahim@example.com', category: 'Plumber', exp: 11, rate: 350, visit: 100, city: 'Puttur', state: 'Karnataka', pin: '574201', area: 'Bolwar', extra: ['574202', '574210'], radius: 12, verified: true, skills: ['Leak repair', 'Bathroom fittings', 'Water tank & pipeline', 'Motor pump service'], bio: 'Plumbing specialist for leaks, bathroom fittings and overhead tank pipelines. Same-day service in Puttur.', ratings: [5, 4, 5, 4, 0] },
  { name: 'Suresh Naik', email: 'suresh@example.com', category: 'Carpenter', exp: 14, rate: 450, visit: 200, city: 'Mangaluru', state: 'Karnataka', pin: '575001', area: 'Hampankatta', extra: ['575002', '575003', '575006'], radius: 20, verified: true, skills: ['Modular kitchens', 'Wardrobes', 'Door & window repair', 'Teak furniture'], bio: 'Custom furniture and modular kitchen work with 14 years of craftsmanship. Free measurement visit above ₹5,000 jobs.', ratings: [5, 5, 5, 4, 5] },
  { name: 'Harish Poojary', email: 'harish@example.com', category: 'Painter', exp: 9, rate: 400, visit: 0, city: 'Mangaluru', state: 'Karnataka', pin: '575003', area: 'Kadri', extra: ['575001', '575004'], radius: 15, verified: true, skills: ['Interior painting', 'Exterior weatherproofing', 'Texture & stencil', 'Waterproofing'], bio: 'Clean, on-time wall painting with premium finishes. Free inspection and colour consultation.', ratings: [4, 4, 5, 0, 4] },
  { name: 'Anita Fernandes', email: 'anita@example.com', category: 'Painter', exp: 6, rate: 350, visit: 0, city: 'Mangaluru', state: 'Karnataka', pin: '575002', area: 'Bendoor', extra: ['575001', '575003'], radius: 10, verified: false, skills: ['Interior painting', 'Wall putty', 'Furniture polish'], bio: 'Detail-oriented painter for apartments and independent homes.', ratings: [5, 0, 0, 0, 0] },
  { name: 'Fareed Khan', email: 'fareed@example.com', category: 'AC Technician', exp: 10, rate: 650, visit: 300, city: 'Bengaluru', state: 'Karnataka', pin: '560034', area: 'Koramangala', extra: ['560095', '560068', '560102'], radius: 18, verified: true, skills: ['Split AC service', 'Gas refilling', 'Installation & uninstall', 'Washing machine & fridge repair'], bio: 'Authorised multi-brand AC and appliance technician. Genuine spares, 30-day service warranty.', ratings: [5, 5, 4, 5, 4] },
  { name: 'Manjunath Gowda', email: 'manju@example.com', category: 'Electrician', exp: 12, rate: 550, visit: 250, city: 'Bengaluru', state: 'Karnataka', pin: '560001', area: 'Shivajinagar', extra: ['560002', '560025', '560042'], radius: 15, verified: true, skills: ['Apartment wiring', 'Smart home setup', 'Short-circuit diagnosis', 'Generator changeover'], bio: 'Handles apartments and commercial wiring across central Bengaluru. Emergency visits within 90 minutes.', ratings: [4, 5, 4, 4, 0] },
  { name: 'Savitha Kumari', email: 'savitha@example.com', category: 'Painter', exp: 7, rate: 500, visit: 150, city: 'Bengaluru', state: 'Karnataka', pin: '560102', area: 'HSR Layout', extra: ['560034', '560068'], radius: 12, verified: true, skills: ['Royale & texture finish', 'Wallpaper', 'Ceiling painting'], bio: 'Premium interior finishing for flats and villas in HSR, BTM and Koramangala.', ratings: [5, 4, 5, 0, 0] },
  { name: 'Praveen Rai', email: 'praveen@example.com', category: 'Mechanic', exp: 7, rate: 280, visit: 100, city: 'Udupi', state: 'Karnataka', pin: '576101', area: 'Manipal Road', extra: ['576102', '576104'], radius: 20, verified: true, skills: ['Two-wheeler service', 'Car battery & clutch', 'Doorstep breakdown help'], bio: 'Bike and hatchback mechanic. Doorstep pickup available within Udupi–Manipal.', ratings: [4, 4, 5, 3, 4] },
  { name: 'Imran Pasha', email: 'imran@example.com', category: 'Mechanic', exp: 15, rate: 700, visit: 300, city: 'Bengaluru', state: 'Karnataka', pin: '560078', area: 'JP Nagar', extra: ['560076', '560062', '560041'], radius: 20, verified: true, skills: ['Car AC & electrical', 'Engine diagnostics', 'Brake & suspension', 'Hybrid servicing'], bio: 'Four-wheeler specialist with 15 years in multi-brand workshops, now offering doorstep diagnostics.', ratings: [5, 5, 5, 5, 4] },
  { name: 'Venkatesh Reddy', email: 'venkatesh@example.com', category: 'Electrician', exp: 9, rate: 650, visit: 250, city: 'Hyderabad', state: 'Telangana', pin: '500081', area: 'Madhapur', extra: ['500033', '500084', '500032'], radius: 15, verified: true, skills: ['Villa wiring', 'LED lighting design', 'Inverter & UPS', 'EV charger install'], bio: 'Electrical contractor for villas and gated communities in Hyderabad West.', ratings: [4, 3, 4, 0, 0] },
  { name: 'Sandeep Patil', email: 'sandeep@example.com', category: 'Plumber', exp: 8, rate: 320, visit: 150, city: 'Pune', state: 'Maharashtra', pin: '411001', area: 'Camp', extra: ['411002', '411004', '411030'], radius: 14, verified: false, skills: ['Pipeline fitting', 'Geyser installation', 'Drain cleaning'], bio: 'Quick, reliable plumbing for flats and bungalows across Pune city.', ratings: [4, 5, 0, 0, 0] },
  { name: 'Karthik Subramanian', email: 'karthik@example.com', category: 'AC Technician', exp: 13, rate: 750, visit: 350, city: 'Chennai', state: 'Tamil Nadu', pin: '600001', area: 'Parrys', extra: ['600002', '600003', '600017'], radius: 20, verified: true, skills: ['Inverter AC', 'VRV systems', 'Fridge & washing machine'], bio: 'Certified refrigeration mechanic handling residential and commercial AC across Chennai.', ratings: [5, 4, 5, 5, 0] },
  { name: 'Mohan Das', email: 'mohan@example.com', category: 'Carpenter', exp: 20, rate: 250, visit: 100, city: 'Mysuru', state: 'Karnataka', pin: '570001', area: 'Lashkar Mohalla', extra: ['570002', '570004', '570008'], radius: 15, verified: true, skills: ['Rosewood furniture', 'Door polish', 'Bed & sofa repair', 'Wooden flooring'], bio: 'Third-generation carpenter. Traditional Mysuru woodwork and everyday repairs at fair rates.', ratings: [5, 5, 4, 5, 5] },
  { name: 'Ganesh Bhat', email: 'ganesh@example.com', category: 'Plumber', exp: 5, rate: 275, visit: 0, city: 'Mysuru', state: 'Karnataka', pin: '570008', area: 'Vijayanagar', extra: ['570017', '570001'], radius: 10, verified: false, skills: ['Tap & flush repair', 'Water purifier fitting', 'Pipe leakage'], bio: 'Affordable plumbing, free inspection. Available evenings and weekends.', ratings: [4, 0, 0, 0, 0] },
  { name: 'Deepak Sharma', email: 'deepak@example.com', category: 'Electrician', exp: 16, rate: 800, visit: 400, city: 'New Delhi', state: 'Delhi', pin: '110001', area: 'Connaught Place', extra: ['110002', '110003', '110016'], radius: 25, verified: true, skills: ['Commercial wiring', 'Panel upgrade', 'CCTV & intercom', 'Surge protection'], bio: 'Licensed electrical contractor for offices, showrooms and homes across central & south Delhi.', ratings: [5, 4, 4, 5, 5] },
];

const comments = {
  5: ['Excellent work, arrived on time and finished quickly. Highly recommended!', 'Very professional and honest about pricing. Will call again.', 'Fixed the problem in one visit. Clean work and fair ₹ charges.', 'Super polite and skilled. Explained everything clearly.'],
  4: ['Good job overall. Slightly late but the quality was great.', 'Work was neat and the rate was reasonable.', 'Solved the issue well. Would hire again.'],
  3: ['Decent work but took longer than quoted.', 'Average experience, job done but needed a follow-up visit.'],
};
const pick = (arr, i) => arr[i % arr.length];

(async () => {
  await connectDB();
  console.log('🧹 Clearing existing data…');
  await Promise.all([User.deleteMany({}), WorkerProfile.deleteMany({}), Review.deleteMany({})]);

  await User.create({ name: 'FixitNow Admin', email: 'admin@fixitnow.in', password: ADMIN_PASSWORD, role: 'admin', phone: '8045678900' });

  const customerDocs = [];
  for (const [i, c] of customers.entries()) {
    customerDocs.push(await User.create({ ...c, password: PASSWORD, role: 'customer', phone: mkPhone(100 + i) }));
  }

  let reviewTotal = 0;
  for (const [i, w] of workers.entries()) {
    const phone = w.phone ? (normalizePhone(w.phone) || w.phone) : mkPhone(i + 1);
    const user = await User.create({ name: w.name, email: w.email, password: PASSWORD, role: 'worker', phone });
    const profile = await WorkerProfile.create({
      userId: user._id, phone, category: w.category, skills: w.skills, experienceYears: w.exp,
      hourlyRate: w.rate, visitingCharges: w.visit, bio: w.bio,
      location: { address: w.area, city: w.city, state: w.state, pincode: w.pin },
      servicePincodes: [w.pin, ...w.extra], serviceRadiusKm: w.radius,
      isAvailable: i % 5 !== 3, // a few workers are "Busy"
      isVerified: w.verified,
    });
    for (const [ci, rating] of w.ratings.entries()) {
      if (!rating) continue;
      await Review.create({
        workerId: profile._id, customerId: customerDocs[ci]._id, rating,
        comment: pick(comments[rating], i + ci),
        createdAt: new Date(Date.now() - (ci * 9 + i * 2 + 1) * 86400000),
      });
      reviewTotal += 1;
    }
    await Review.recalculate(profile._id);
  }

  console.log(`✅ Seeded 1 admin, ${customerDocs.length} customers, ${workers.length} workers, ${reviewTotal} reviews.\n`);
  console.log('Login credentials');
  console.log(`  Admin    admin@fixitnow.in     / ${ADMIN_PASSWORD}`);
  console.log(`  Customer priya@example.com     / ${PASSWORD}`);
  console.log(`  Worker   ramesh@example.com    / ${PASSWORD}`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('❌ Seeding failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
