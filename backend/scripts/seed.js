// One-off seeder. Run locally:  node scripts/seed.js
// NEVER exposed over HTTP. Refuses to run in production.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User.model');

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run seed in production.');
    process.exit(1);
  }

  // DB connect — ye line zaroori hai, warna findOne timeout ho jaata hai
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Mongo connected');

  // --- Employee (testing ke liye) ---
  const empEmail = process.env.SEED_EMP_EMAIL;
  const empPassword = process.env.SEED_EMP_PASSWORD;

  if (empEmail && empPassword) {
    const existingEmp = await User.findOne({ email: empEmail.toLowerCase() });
    if (!existingEmp) {
      await User.create({
        name: 'Employee',
        email: empEmail.toLowerCase(),
        password: empPassword,
        role: 'employee',
        isActive: true,
      });
      console.log(`Employee "${empEmail}" created.`);
    } else {
      console.log(`Employee "${empEmail}" already exists.`);
    }
  } else {
    console.log('SEED_EMP_EMAIL / SEED_EMP_PASSWORD not set in .env');
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});