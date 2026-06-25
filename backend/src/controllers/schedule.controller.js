const mongoose = require('mongoose');
const AdminSchedule = require('../models/AdminSchedule.model');
const Appointment = require('../models/Appointment.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function validateDay(day) {
  if (typeof day.dayOfWeek !== 'number' || day.dayOfWeek < 0 || day.dayOfWeek > 6) {
    return 'Invalid dayOfWeek';
  }
  if (!day.isWorking) return null; // no further validation needed for off days
  if (!TIME_RE.test(day.startTime) || !TIME_RE.test(day.endTime)) {
    return `Invalid start/end time for ${DAY_NAMES[day.dayOfWeek]}`;
  }
  if (toMinutes(day.startTime) >= toMinutes(day.endTime)) {
    return `Start time must be before end time on ${DAY_NAMES[day.dayOfWeek]}`;
  }
  if (day.breakStart || day.breakEnd) {
    if (!TIME_RE.test(day.breakStart) || !TIME_RE.test(day.breakEnd)) {
      return `Invalid break time for ${DAY_NAMES[day.dayOfWeek]}`;
    }
    if (toMinutes(day.breakStart) >= toMinutes(day.breakEnd)) {
      return `Break start must be before break end on ${DAY_NAMES[day.dayOfWeek]}`;
    }
    if (toMinutes(day.breakStart) < toMinutes(day.startTime) || toMinutes(day.breakEnd) > toMinutes(day.endTime)) {
      return `Break must fall within working hours on ${DAY_NAMES[day.dayOfWeek]}`;
    }
  }
  if (!day.slotDuration || day.slotDuration < 5 || day.slotDuration > 240) {
    return `Slot duration must be between 5 and 240 minutes on ${DAY_NAMES[day.dayOfWeek]}`;
  }
  return null;
}

// GET /schedule — any authenticated user (admin or employee) can view the
// admin's schedule. Employees need this read-only to know when to book.
exports.getSchedule = asyncHandler(async (req, res) => {
  // DESIGN DECISION (confirmed with user): this app has ONE shared
  // weekly schedule, regardless of how many admin accounts exist.
  // Any admin editing "My Schedule" edits the same single document —
  // it is not per-admin. So this always reads/creates the one
  // AdminSchedule document, with no per-admin _id filtering. This
  // matches updateSchedule() below, which now does the same.
  let schedule = await AdminSchedule.findOne().populate('admin', 'name');
  if (!schedule) {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'No admin account found' });
    schedule = await AdminSchedule.create({ admin: admin._id });
    schedule = await schedule.populate('admin', 'name');
  }
  res.json({ schedule });
});

// PUT /schedule — admin only, upserts their own weekly schedule.
exports.updateSchedule = asyncHandler(async (req, res) => {
  const { days } = req.body;
  if (!Array.isArray(days) || days.length !== 7) {
    return res.status(400).json({ message: 'days must be an array of 7 entries (Sun-Sat)' });
  }

  for (const day of days) {
    const err = validateDay(day);
    if (err) return res.status(400).json({ message: err });
  }

  const existing = await AdminSchedule.findOne();
  const schedule = existing
    ? await AdminSchedule.findByIdAndUpdate(
        existing._id,
        { days },
        { new: true, runValidators: true }
      ).populate('admin', 'name')
    : await (await AdminSchedule.create({ admin: req.user._id, days })).populate('admin', 'name');

  res.json({ message: 'Schedule updated', schedule });
});

exports.getAvailableSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'date query param (YYYY-MM-DD) is required' });
  }

  // BUG FIX (round 2): the previous fix still depended on
  // `User.findOne({ role: 'admin' })` to figure out which admin's
  // schedule to read — but when there's more than one user with
  // role:'admin' in the DB, findOne() with no sort/filter can return
  // ANY of them, with no guarantee it's the one whose _id matches the
  // single AdminSchedule document that was actually saved. When it
  // picked the wrong admin, this code would create a brand-new, blank
  // (all-days-off) AdminSchedule for that wrong admin — which is why
  // every single day showed "Not available", not just specific days.
  //
  // This app only supports ONE active weekly schedule total (confirmed:
  // exactly one document exists in the adminschedules collection). So
  // rather than resolving an admin first and filtering by their _id,
  // just read whichever AdminSchedule document already exists. This
  // sidesteps the multiple-admin-accounts ambiguity entirely. If/when
  // the app needs genuinely independent per-admin schedules, this will
  // need a real adminId param instead of an implicit single document.
  let schedule = await AdminSchedule.findOne();
  if (!schedule) {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'No admin account found' });
    schedule = await AdminSchedule.create({ admin: admin._id });
  }

  // Parse the date string as a local calendar date (not UTC) to get the
  // correct day-of-week regardless of server timezone.
  const [y, m, d] = date.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  const daySchedule = schedule.days.find((dd) => dd.dayOfWeek === dayOfWeek);

  if (!daySchedule || !daySchedule.isWorking) {
    return res.json({ date, dayOfWeek, isWorking: false, slots: [] });
  }

  // Existing appointments on this date — their exact times are "taken".
  const existing = await Appointment.find({ appointmentDate: date }).select('appointmentTime');
  const takenTimes = new Set(existing.map((a) => a.appointmentTime));

  const slots = [];
  const startMin = toMinutes(daySchedule.startTime);
  const endMin = toMinutes(daySchedule.endTime);
  const breakStartMin = daySchedule.breakStart ? toMinutes(daySchedule.breakStart) : null;
  const breakEndMin = daySchedule.breakEnd ? toMinutes(daySchedule.breakEnd) : null;
  const duration = daySchedule.slotDuration || 30;

  for (let t = startMin; t + duration <= endMin; t += duration) {
    const time = toHHMM(t);
    const inBreak = breakStartMin !== null && t >= breakStartMin && t < breakEndMin;
    const isTaken = takenTimes.has(time);
    slots.push({
      time,
      available: !inBreak && !isTaken,
      reason: inBreak ? 'break' : isTaken ? 'booked' : null,
    });
  }

  res.json({
    date,
    dayOfWeek,
    isWorking: true,
    startTime: daySchedule.startTime,
    endTime: daySchedule.endTime,
    breakStart: daySchedule.breakStart,
    breakEnd: daySchedule.breakEnd,
    slotDuration: duration,
    slots,
  });
});
