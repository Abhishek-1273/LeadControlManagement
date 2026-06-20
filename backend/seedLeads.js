/**
 * seedLeads.js — 100 realistic Indian leads with varied dates & statuses
 *
 * Usage:
 *   node seedLeads.js
 *
 * Env: MONGO_URI must be set (or edit the fallback below)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('./src/models/Lead.model');   // adjust path if needed
const User = require('./src/models/User.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/leads';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Random int between min and max inclusive */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Pick a random element from an array */
const pick = (arr) => arr[randInt(0, arr.length - 1)];

/** Date string N days ago (midnight IST-ish) */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── data pools ─────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun',
  'Reyansh', 'Ayaan', 'Atharva', 'Krishna', 'Ishaan',
  'Shaurya', 'Dhruv', 'Kabir', 'Ritvik', 'Aadhya',
  'Ananya', 'Pari', 'Aanya', 'Riya', 'Saanvi',
  'Priya', 'Nisha', 'Pooja', 'Sneha', 'Kavya',
  'Rahul', 'Rohit', 'Amit', 'Suresh', 'Vijay',
  'Rajesh', 'Manoj', 'Deepak', 'Sanjay', 'Vikas',
  'Neha', 'Swati', 'Anjali', 'Sunita', 'Geeta',
  'Harish', 'Girish', 'Nitin', 'Sachin', 'Ashish',
  'Mukesh', 'Rakesh', 'Dinesh', 'Ganesh', 'Naresh',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar',
  'Patel', 'Shah', 'Mehta', 'Joshi', 'Mishra',
  'Yadav', 'Agarwal', 'Tiwari', 'Pandey', 'Dubey',
  'Chauhan', 'Rajput', 'Nair', 'Pillai', 'Menon',
  'Reddy', 'Rao', 'Naidu', 'Iyer', 'Subramanian',
  'Desai', 'Patil', 'More', 'Shinde', 'Jadhav',
];

const CITIES = [
  'Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Hyderabad',
  'Chennai', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur',
  'Lucknow', 'Nagpur', 'Indore', 'Bhopal', 'Patna',
  'Vadodara', 'Ghaziabad', 'Ludhiana', 'Coimbatore', 'Nashik',
];

const SOURCES = ['Facebook', 'Instagram', 'Google', 'YouTube', 'JustDial', 'CarDekho', 'Manual', 'Reference', 'OLX'];

const CAMPAIGNS = [
  'Summer Offer 2025', 'Monsoon Fest', 'Diwali Sale',
  'Year End Deals', 'Test Drive Camp', 'Exchange Mela',
  'EMI Zero', 'Loyalty Bonus', null,
];

const CARS = [
  'Maruti Swift', 'Maruti Baleno', 'Maruti Brezza',
  'Hyundai i20', 'Hyundai Creta', 'Hyundai Venue',
  'Tata Nexon', 'Tata Punch', 'Tata Altroz',
  'Honda City', 'Honda Amaze',
  'Kia Seltos', 'Kia Sonet',
  'Toyota Innova Crysta', 'Toyota Fortuner',
  'MG Hector', 'Mahindra XUV 700', 'Mahindra Thar',
];

const STATUSES = ['Hot', 'Warm', 'Cold', 'Follow Up', 'Booked'];

const STATUS_WEIGHTS = [10, 25, 35, 20, 10]; 

function weightedStatus() {
  const r = randInt(1, 100);
  let cum = 0;
  for (let i = 0; i < STATUSES.length; i++) {
    cum += STATUS_WEIGHTS[i];
    if (r <= cum) return STATUSES[i];
  }
  return 'Cold';
}

// ─── phone generator (unique 10-digit Indian-ish numbers) ──────────────────

const usedPhones = new Set();

function uniquePhone() {
  const prefixes = ['98', '97', '96', '95', '94', '93', '92', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '71', '70'];
  let phone;
  do {
    const prefix = pick(prefixes);
    const suffix = String(randInt(10000000, 99999999));
    phone = prefix + suffix;
  } while (usedPhones.has(phone));
  usedPhones.add(phone);
  return phone;
}

// ─── date distribution ──────────────────────────────────────────────────────
// ~20 leads today, ~15 yesterday, ~25 this week, ~40 older (2–30 days ago)

function assignedDate(index) {
  if (index < 20) return daysAgo(0);        // today
  if (index < 35) return daysAgo(1);        // yesterday
  if (index < 60) return daysAgo(randInt(2, 6));   // this week
  return daysAgo(randInt(7, 30));           // older
}

// ─── build leads ────────────────────────────────────────────────────────────

function buildLeads(employees) {
  const leads = [];

  for (let i = 0; i < 100; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName  = pick(LAST_NAMES);
    const name      = `${firstName} ${lastName}`;
    const status    = weightedStatus();
    const createdAt = assignedDate(i);

    // updatedAt: for Booked leads push updatedAt to same day as createdAt (or today)
    const updatedAt = status === 'Booked'
      ? (randInt(0, 1) ? createdAt : daysAgo(0))
      : new Date(createdAt.getTime() + randInt(0, 3) * 60 * 60 * 1000);

    const employee = employees.length ? pick(employees) : null;

    leads.push({
      name,
      phone:          uniquePhone(),
      secondaryPhone: randInt(0, 3) === 0 ? uniquePhone() : '',   // ~25% have secondary
      email:          randInt(0, 2) === 0
        ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1, 99)}@gmail.com`
        : '',
      city:           pick(CITIES),
      source:         pick(SOURCES),
      campaign:       pick(CAMPAIGNS) || undefined,
      car:            randInt(0, 4) !== 0 ? pick(CARS) : '',      // 80% have car interest
      status,
      isPinned:       randInt(0, 9) === 0,   // 10% pinned
      assignedTo:     employee?._id || null,
      notes:          [],
      timeline: [{
        type: 'created',
        description: `Lead created via seed script (${pick(SOURCES)})`,
        createdAt,
        updatedAt: createdAt,
      }],
      createdAt,
      updatedAt,
    });
  }

  return leads;
}

// ─── main ───────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB:', MONGO_URI);

  // Fetch active employees to assign leads to
  const employees = await User.find({ role: 'employee', isActive: true }).select('_id name');
  if (!employees.length) {
    console.warn('⚠️  No active employees found — leads will be unassigned.');
  } else {
    console.log(`👥  Found ${employees.length} employee(s): ${employees.map(e => e.name).join(', ')}`);
  }

  // Optional: wipe existing seed leads (comment out to append instead)
  const deleted = await Lead.deleteMany({});
  console.log(`🗑️   Cleared ${deleted.deletedCount} existing leads`);

  const leads = buildLeads(employees);

  // timestamps: false → Mongoose respects our custom createdAt/updatedAt
  await Lead.insertMany(leads, { timestamps: false });

  console.log(`🌱  Seeded ${leads.length} leads successfully`);

  // Quick summary
  const summary = {};
  for (const l of leads) {
    summary[l.status] = (summary[l.status] || 0) + 1;
  }
  console.log('📊  Status breakdown:', summary);

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayCount = leads.filter(l => l.createdAt >= todayStart).length;
  console.log(`📅  Today's leads: ${todayCount}`);

  await mongoose.disconnect();
  console.log('🔌  Disconnected. Done!');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});