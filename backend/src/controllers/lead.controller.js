const mongoose = require('mongoose');
const Lead     = require('../models/Lead.model');
const User     = require('../models/User.model');
const FollowUp = require('../models/FollowUp.model');
const asyncHandler = require('../utils/asyncHandler');
const { normalizePhone } = require('../middleware/leadValidators');

// ─── helpers ─────────────────────────────────────────────────────────────────

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Centralised duplicate-phone check (system-wide, ignores ownership).
 * Pass the lead _id to exclude if you're editing an existing lead.
 * Returns the conflicting lead or null.
 */
async function findPhoneDuplicate(primary, secondary, excludeLeadId = null) {
  const numbersToCheck = [primary];
  if (secondary) numbersToCheck.push(secondary);

  // Build the query: match any lead whose primary OR secondary phone
  // equals any of the numbers we're checking.
  const orClauses = [
    { phone:          { $in: numbersToCheck } },
    { secondaryPhone: { $in: numbersToCheck } },
  ];

  const query = { $or: orClauses };

  // When editing, exclude the lead being updated from the check
  if (excludeLeadId) {
    query._id = { $ne: excludeLeadId };
  }

  return Lead.findOne(query).select('_id name phone secondaryPhone assignedTo');
}

// Fetch lead by :id and enforce employee ownership (admins can always access).
async function getOwnedLead(req, res) {
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(404).json({ message: 'Lead not found' });
    return null;
  }

  const lead = await Lead.findById(id);
  if (!lead) {
    res.status(404).json({ message: 'Lead not found' });
    return null;
  }

  if (
    req.user.role === 'employee' &&
    lead.assignedTo?.toString() !== req.user._id.toString()
  ) {
    res.status(403).json({ message: 'Access denied' });
    return null;
  }

  return lead;
}

// ─── controllers ─────────────────────────────────────────────────────────────

// GET /leads — list (employee sees only their own; admin sees all)
exports.getMyLeads = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;
  const { search, status } = req.query;

  const filter = {};
  if (role === 'employee') filter.assignedTo = _id;
  if (status)              filter.status = status;

  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name:  { $regex: safe, $options: 'i' } },
      { phone: { $regex: safe, $options: 'i' } },
    ];
  }

  const leads = await Lead.find(filter)
    .populate('assignedTo', 'name email')
    .sort({ isPinned: -1, createdAt: -1 });

  res.json({ leads, total: leads.length });
});

// GET /leads/:id
exports.getLeadById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(404).json({ message: 'Lead not found' });

  const lead = await Lead.findById(id)
    .populate('assignedTo', 'name email')
    .populate('notes.createdBy', 'name');

  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  if (
    req.user.role === 'employee' &&
    lead.assignedTo?._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(lead);
});

// PATCH /leads/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const lead = await getOwnedLead(req, res);
  if (!lead) return;

  const oldStatus = lead.status;
  lead.status = status;
  lead.timeline.push({
    type: 'status_changed',
    description: `Status changed: ${oldStatus} → ${status}`,
  });
  await lead.save();

  res.json({ message: 'Status updated', status });
});

// PATCH /leads/:id/note
exports.addNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const lead = await getOwnedLead(req, res);
  if (!lead) return;

  lead.notes.push({ content: note, createdBy: req.user._id });
  lead.timeline.push({
    type: 'note_added',
    description: `Note added: ${note.substring(0, 50)}`,
  });
  await lead.save();

  res.json({ message: 'Note saved' });
});

// PATCH /leads/:id/pin
exports.togglePin = asyncHandler(async (req, res) => {
  const lead = await getOwnedLead(req, res);
  if (!lead) return;

  lead.isPinned = !lead.isPinned;
  await lead.save();
  res.json({ isPinned: lead.isPinned });
});

// GET /leads/dashboard
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;
  const filter = role === 'employee' ? { assignedTo: _id } : {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, newToday, hot, warm, cold, followUp, booked, followUps] =
    await Promise.all([
      Lead.countDocuments(filter),
      Lead.countDocuments({ ...filter, createdAt: { $gte: today } }),
      Lead.countDocuments({ ...filter, status: 'Hot' }),
      Lead.countDocuments({ ...filter, status: 'Warm' }),
      Lead.countDocuments({ ...filter, status: 'Cold' }),
      Lead.countDocuments({ ...filter, status: 'Follow Up' }),
      Lead.countDocuments({ ...filter, status: 'Booked' }),
      FollowUp.countDocuments({
        employee: _id,
        date: today.toISOString().split('T')[0],
        isCompleted: false,
      }),
    ]);

  res.json({
    totalLeads: total, newToday,
    hot, warm, cold, followUp, booked,
    todayFollowUps: followUps,
    pending: followUp,
  });
});

// POST /leads — create lead (both admin and employee)
exports.createLead = asyncHandler(async (req, res) => {
  const {
    name, primaryPhone, secondaryPhone,
    email, city, source, campaign, car,
    assignedTo,           // only meaningful when called by admin
  } = req.body;

  const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

  // Normalise phones (validator already sanitises, but be defensive)
  const primary   = normalizePhone(primaryPhone);
  const secondary = secondaryPhone ? normalizePhone(secondaryPhone) : '';

  // ── SYSTEM-WIDE duplicate check ──────────────────────────────────────────
  const duplicate = await findPhoneDuplicate(primary, secondary);
  if (duplicate) {
    return res.status(409).json({
      message: 'Lead already exists with this phone number.',
      conflictLead: {
        id:   duplicate._id,
        name: duplicate.name,
        phone: duplicate.phone,
      },
    });
  }

  // ── Determine assignee ───────────────────────────────────────────────────
  // Admin → use the assignedTo value from the request body (can be null/undefined)
  // Employee → always assign to themselves
  let assignee = null;
  if (req.user.role === 'admin') {
    if (assignedTo) {
      // Validate the provided employee ID exists
      if (!isValidId(assignedTo)) {
        return res.status(400).json({ message: 'Invalid assignedTo employee ID' });
      }
      const emp = await User.findById(assignedTo).select('_id role isActive');
      if (!emp) {
        return res.status(400).json({ message: 'Assigned employee not found' });
      }
      if (emp.role !== 'employee') {
        return res.status(400).json({ message: 'assignedTo must be an employee, not admin' });
      }
      assignee = emp._id;
    }
    // if assignedTo is empty/null, assignee stays null (unassigned)
  } else {
    // Employee creating a lead → always assigned to themselves
    assignee = req.user._id;
  }

  // ── Create ───────────────────────────────────────────────────────────────
  const lead = await Lead.create({
    name:          clip(name, 120),
    phone:         primary,
    secondaryPhone: secondary,
    email:         clip(email, 120),
    city:          clip(city, 80),
    source:        clip(source, 40) || 'Manual',
    campaign:      clip(campaign, 120),
    car:           clip(car, 80),
    status:        'Cold',
    assignedTo:    assignee,
    timeline: [{
      type: 'created',
      description: `Lead created manually by ${req.user.name}` +
        (assignee ? '' : ' (unassigned)'),
    }],
  });

  // Populate assignedTo so the frontend gets the full object back immediately
  await lead.populate('assignedTo', 'name email');

  res.status(201).json({ message: 'Lead created successfully', lead });
});

// POST /leads/webhook — n8n / external webhook
exports.webhookLead = asyncHandler(async (req, res) => {
  const { name, phone, email, city, source, campaign, message, car } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ message: 'A valid phone is required' });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!/^\d{10}$/.test(normalizedPhone)) {
    return res.status(400).json({ message: 'Phone must be exactly 10 digits (no country code)' });
  }

  if (email?.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  // ── System-wide duplicate check ──────────────────────────────────────────
  const duplicate = await findPhoneDuplicate(normalizedPhone, '');
  if (duplicate) {
    // Return 200 so the webhook caller doesn't retry; just skip silently
    return res.json({ success: true, skipped: true, reason: 'duplicate_phone', leadId: duplicate._id });
  }

  const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

  // Round-robin: pick the least-loaded active employee
  const employee = await User.findOne({ role: 'employee', isActive: true });

  const lead = await Lead.create({
    name:     clip(name, 120),
    phone:    normalizedPhone,
    email:    clip(email, 120),
    city:     clip(city, 80),
    source:   clip(source, 40) || 'n8n',
    campaign: clip(campaign, 120),
    message:  clip(message, 1000),
    car:      clip(car, 80),
    status:   'Cold',
    assignedTo: employee?._id || null,
    timeline: [{
      type: 'created',
      description: `Lead received via webhook from ${clip(source, 40) || 'n8n'}`,
    }],
  });

  res.json({ success: true, skipped: false, leadId: lead._id });
});

// POST /leads/:id/followup
exports.addFollowUp = asyncHandler(async (req, res) => {
  const { date, time, notes } = req.body;
  const lead = await getOwnedLead(req, res);
  if (!lead) return;

  const followUp = await FollowUp.create({
    lead: lead._id,
    employee: req.user._id,
    date, time, notes,
  });

  lead.timeline.push({
    type: 'followup_added',
    description: `Follow-up scheduled for ${date} at ${time}`,
  });
  await lead.save();

  res.json({ message: 'Follow-up saved', followUp });
});

// GET /leads/followups/today
exports.getTodayFollowUps = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const followUps = await FollowUp.find({
    employee:    req.user._id,
    date:        today,
    isCompleted: false,
  }).populate('lead', 'name phone status');

  res.json({ followUps, total: followUps.length });
});

// PATCH /leads/followup/:followUpId/complete
exports.completeFollowUp = asyncHandler(async (req, res) => {
  const followUp = await FollowUp.findById(req.params.followUpId);
  if (!followUp) return res.status(404).json({ message: 'Follow-up not found' });
  if (followUp.employee.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  followUp.isCompleted = true;
  await followUp.save();
  res.json({ message: 'Follow-up marked complete', followUp });
});

// PATCH /leads/:id/info
exports.updateLeadInfo = asyncHandler(async (req, res) => {
  const { name, phone, email, city, car, campaign } = req.body;
  const lead = await getOwnedLead(req, res);
  if (!lead) return;

  // If phone is being updated, run a duplicate check excluding this lead
  if (phone) {
    const normalised = normalizePhone(phone);
    if (!/^\d{10}$/.test(normalised)) {
      return res.status(400).json({ message: 'Phone must be exactly 10 digits (no country code)' });
    }
    const dup = await findPhoneDuplicate(normalised, '', lead._id);
    if (dup) {
      return res.status(409).json({ message: 'Another lead already has this phone number.' });
    }
    lead.phone = normalised;
  }

  if (name     !== undefined) lead.name     = name;
  if (email    !== undefined) lead.email    = email;
  if (city     !== undefined) lead.city     = city;
  if (car      !== undefined) lead.car      = car;
  if (campaign !== undefined) lead.campaign = campaign;

  lead.timeline.push({
    type: 'status_changed',
    description: `Lead info updated by ${req.user.name}`,
  });

  await lead.save();
  res.json({ message: 'Lead updated successfully', lead });
});

// DELETE /leads/:id
exports.deleteLead = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Lead not found' });
  await Lead.findByIdAndDelete(req.params.id);
  res.json({ message: 'Lead deleted' });
});

// DELETE /leads/bulk?days=N
exports.bulkDeleteLeads = asyncHandler(async (req, res) => {
  const days   = parseInt(req.query.days) || 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await Lead.deleteMany({ createdAt: { $lt: cutoff } });
  res.json({ message: `${result.deletedCount} leads deleted`, deletedCount: result.deletedCount });
});
