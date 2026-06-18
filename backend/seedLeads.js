const mongoose = require('mongoose');

// ── Inline schemas (no external imports needed) ──────────────────────────────

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const timelineSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['created', 'status_changed', 'note_added', 'followup_added', 'assigned'],
  },
  description: String,
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  phone:       { type: String, required: true },
  email:       { type: String },
  city:        { type: String },
  source:      { type: String, default: 'Unknown' },
  campaign:    { type: String },
  message:     { type: String },
  car:         { type: String },
  visitorDate: { type: String },
  status: {
    type: String,
    enum: [
      'New Lead','Contacted','Follow Up','Interested',
      'Visitor','Booked','Closed','Uninterested','No Response','Wrong Number',
    ],
    default: 'New Lead',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPinned:   { type: Boolean, default: false },
  notes:      [noteSchema],
  timeline:   [timelineSchema],
}, { timestamps: true });

const Lead = mongoose.model('Lead', leadSchema);

// ── Data pools ────────────────────────────────────────────────────────────────

const firstNames = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan',
  'Ananya','Aadhya','Diya','Saanvi','Myra','Priya','Riya','Sneha','Neha','Pooja',
  'Rohit','Rahul','Amit','Suresh','Vikram','Rajesh','Manish','Deepak','Harish','Kiran',
  'Sunita','Kavya','Divya','Swati','Meera','Lalita','Geeta','Asha','Nisha','Rekha',
  'Mohit','Nikhil','Gaurav','Sachin','Abhishek','Pankaj','Sanjay','Ravi','Anil','Manoj',
];

const lastNames = [
  'Sharma','Verma','Singh','Kumar','Patel','Joshi','Mehta','Gupta','Yadav','Mishra',
  'Chopra','Malhotra','Kapoor','Reddy','Nair','Pillai','Iyer','Menon','Rao','Das',
];

const cities = [
  'Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad',
  'Jaipur','Lucknow','Chandigarh','Surat','Nagpur','Indore','Bhopal',
];

const sources = ['Facebook','Instagram','Google','WhatsApp','Referral','Walk-In','Website','Unknown'];

const campaigns = [
  'Diwali Offer 2024','Summer Sale','New Year Deal','Festival Bonanza',
  'EMI Zero Scheme','Test Drive Campaign','Trade-In Offer',null,null,
];

const cars = [
  'Maruti Swift','Hyundai i20','Honda City','Tata Nexon','Kia Seltos',
  'Mahindra Scorpio','Toyota Fortuner','Creta','Volkswagen Polo','MG Hector',
  'Tata Punch','Maruti Baleno','Hyundai Venue','Renault Kiger','Nissan Magnite',
];

const statuses = [
  'New Lead','Contacted','Follow Up','Interested',
  'Visitor','Booked','Closed','Uninterested','No Response','Wrong Number',
];

const messages = [
  'Interested in test drive','Please call back','Looking for exchange offer',
  'Need EMI details','Enquiry for corporate discount','Want to visit showroom',
  'Comparing with competitor','Budget around 10L','Urgent requirement','No message',
];

const noteTexts = [
  'Customer is very interested, follow up by weekend.',
  'Sent brochure on WhatsApp.',
  'Left voicemail, awaiting callback.',
  'Offered a test drive for Saturday.',
  'Negotiation in progress on price.',
  'Customer asked for insurance details.',
  'Visit scheduled for next week.',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const rand5 = ()  => Math.floor(Math.random() * 5);
const phone = ()  => `+91${Math.floor(6000000000 + Math.random() * 3999999999)}`;

const randomDate = (start, end) => {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
};

function buildLead(i) {
  const firstName = pick(firstNames);
  const lastName  = pick(lastNames);
  const status    = pick(statuses);
  const source    = pick(sources);

  // Build timeline
  const timeline = [
    { type: 'created', description: `Lead created from ${source}` },
  ];
  if (status !== 'New Lead') {
    timeline.push({ type: 'status_changed', description: `Status changed to ${status}` });
  }

  // Optionally add a note
  const notes = [];
  if (Math.random() > 0.4) {
    notes.push({ content: pick(noteTexts) });
    timeline.push({ type: 'note_added', description: 'A note was added' });
  }

  return {
    name:        `${firstName} ${lastName}`,
    phone:       phone(),
    email:       Math.random() > 0.3
                   ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`
                   : undefined,
    city:        pick(cities),
    source,
    campaign:    pick(campaigns),
    message:     pick(messages),
    car:         pick(cars),
    visitorDate: Math.random() > 0.6
                   ? randomDate(new Date('2024-01-01'), new Date())
                   : undefined,
    status,
    isPinned:    Math.random() > 0.85,
    notes,
    timeline,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/velta';

  console.log(`🔌 Connecting to: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  const leads = Array.from({ length: 100 }, (_, i) => buildLead(i + 1));

  await Lead.insertMany(leads);
  console.log(`🌱 Inserted 100 leads successfully!`);

  await mongoose.disconnect();
  console.log('👋 Disconnected. Done.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});