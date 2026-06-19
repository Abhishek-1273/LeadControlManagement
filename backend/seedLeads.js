// seed.js — 100 leads seed karo
// Usage: node seed.js
// Place karo: backend/ folder mein (same level as package.json)

require('dotenv').config({ path: './src/../.env' });
const mongoose = require('mongoose');

// ── Models inline (path adjust karo agar zaroorat ho) ──
const Lead = require('./src/models/Lead.model');
const User = require('./src/models/User.model');

// ── Realistic Indian data ───────────────────────────────
const FIRST_NAMES = [
  'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Pooja', 'Arjun', 'Neha',
  'Rohit', 'Anita', 'Suresh', 'Kavya', 'Manish', 'Divya', 'Rajesh', 'Sunita',
  'Deepak', 'Meera', 'Aakash', 'Ritu', 'Sanjay', 'Anjali', 'Karan', 'Nisha',
  'Vikas', 'Swati', 'Nikhil', 'Preeti', 'Gaurav', 'Shweta', 'Harsh', 'Pallavi',
  'Mohit', 'Rekha', 'Tarun', 'Geeta', 'Vivek', 'Madhuri', 'Sachin', 'Asha',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Mehta',
  'Shah', 'Reddy', 'Nair', 'Iyer', 'Kapoor', 'Malhotra', 'Chauhan', 'Yadav',
  'Mishra', 'Pandey', 'Tiwari', 'Agarwal', 'Bose', 'Das', 'Roy', 'Sen',
];

const CARS = [
  'Maruti Swift', 'Hyundai i20', 'Tata Nexon', 'Honda City',
  'Kia Seltos', 'Mahindra XUV700', 'Toyota Innova', 'Volkswagen Polo',
  'Skoda Slavia', 'Hyundai Creta', 'Tata Altroz', 'Renault Kiger',
  'Nissan Magnite', 'MG Hector', 'Ford EcoSport', 'Maruti Ertiga',
  'Honda Amaze', 'Tata Punch', 'Mahindra Scorpio', 'Toyota Fortuner',
  'Swift Dzire', 'Hyundai Venue', 'Kia Sonet', 'Maruti Baleno',
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Nagpur',
  'Indore', 'Bhopal', 'Gurugram', 'Noida', 'Vadodara', 'Surat',
];

const SOURCES = [
  'WhatsApp', 'Facebook', 'Instagram', 'Referral',
  'Walk-in', 'Website', 'Unknown', 'Google Ads',
];

const STATUSES = [
  'New Lead', 'New Lead', 'New Lead',       // more new leads
  'Contacted', 'Contacted',
  'Follow Up', 'Follow Up',
  'Interested', 'Interested',
  'Visitor',
  'Booked',
  'Uninterested',
  'No Response', 'No Response',
];

// ── Helpers ─────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomPhone = () => {
  const prefixes = ['98', '97', '96', '95', '94', '93', '91', '90', '88', '87', '86', '85', '70'];
  return pick(prefixes) + String(Math.floor(Math.random() * 90000000 + 10000000));
};

const randomDate = (daysBack) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d;
};

// ── Seed function ────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Employees fetch karo — unhe leads assign karenge
    const employees = await User.find({ role: 'employee', isActive: true }).select('_id name');
    if (!employees.length) {
      console.warn('⚠️  No employees found — leads will be unassigned');
    } else {
      console.log(`👥 Found ${employees.length} employee(s): ${employees.map(e => e.name).join(', ')}`);
    }

    // Purane seed leads delete karo (optional — comment out karo agar nahi karna)
    const deleted = await Lead.deleteMany({ source: { $in: ['WhatsApp', 'Facebook', 'Instagram', 'Referral', 'Walk-in', 'Website', 'Unknown', 'Google Ads'] } });
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing leads`);

    const leads = [];

    for (let i = 0; i < 100; i++) {
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const status = pick(STATUSES);
      const assignedTo = employees.length
        ? pick(employees)._id
        : undefined;

      const createdAt = randomDate(180); // last 6 months

      const lead = {
        name,
        phone: randomPhone(),
        secondaryPhone: Math.random() > 0.7 ? randomPhone() : '',
        email: Math.random() > 0.6
          ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 99)}@gmail.com`
          : undefined,
        city: pick(CITIES),
        source: pick(SOURCES),
        car: pick(CARS),
        status,
        assignedTo,
        isPinned: Math.random() > 0.9, // ~10% pinned
        notes: [],
        timeline: [
          {
            type: 'created',
            description: `Lead created`,
            createdAt,
            updatedAt: createdAt,
          },
          ...(status !== 'New Lead' ? [{
            type: 'status_changed',
            description: `Status changed to ${status}`,
            createdAt: randomDate(90),
            updatedAt: randomDate(90),
          }] : []),
        ],
        createdAt,
        updatedAt: createdAt,
      };

      leads.push(lead);
    }

    await Lead.insertMany(leads);
    console.log(`✅ 100 leads seeded successfully!`);

    // Summary print karo
    const statusSummary = leads.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});
    console.log('\n📊 Status breakdown:');
    Object.entries(statusSummary).forEach(([s, c]) => console.log(`   ${s}: ${c}`));
    console.log(`\n📌 Pinned: ${leads.filter(l => l.isPinned).length}`);
    console.log(`👥 Assigned: ${leads.filter(l => l.assignedTo).length}`);

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

seed();