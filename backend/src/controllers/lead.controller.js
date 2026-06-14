const Lead = require('../models/Lead.model');
const User = require('../models/User.model');
const FollowUp = require('../models/FollowUp.model');
const asyncHandler = require('../utils/asyncHandler');

// Escapes regex metacharacters so user input can't inject patterns / cause ReDoS.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Fetch a lead by :id and enforce ownership.
// Returns the lead if allowed; otherwise sends the response and returns null.
// Admins can access any lead; employees only leads assigned to them.
async function getOwnedLead(req, res) {
  const { id } = req.params;

  if (!Lead.base.Types.ObjectId.isValid(id)) {
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

// My Leads
exports.getMyLeads = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;
  const { search, status } = req.query;

  let filter = {};

  // Employee sirf apne leads
  if (role === 'employee') {
    filter.assignedTo = _id;
  }

  // Search (regex-escaped)
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { phone: { $regex: safe, $options: 'i' } },
    ];
  }

  // Status filter
  if (status) filter.status = status;

  const leads = await Lead.find(filter)
    .populate('assignedTo', 'name email')
    .sort({ isPinned: -1, createdAt: -1 });

  res.json({ leads, total: leads.length });
});

// Single Lead
exports.getLeadById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!Lead.base.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'Lead not found' });
  }

  const lead = await Lead.findById(id)
    .populate('assignedTo', 'name email')
    .populate('notes.createdBy', 'name');

  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  // Employee access check
  if (
    req.user.role === 'employee' &&
    lead.assignedTo?._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(lead);
});

// Status Update
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

// Add Note
exports.addNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const lead = await getOwnedLead(req, res);
  if (!lead) return;

  lead.notes.push({
    content: note,
    createdBy: req.user._id,
  });
  lead.timeline.push({
    type: 'note_added',
    description: `Note added: ${note.substring(0, 50)}...`,
  });
  await lead.save();

  res.json({ message: 'Note saved' });
});

// Pin Toggle
exports.togglePin = asyncHandler(async (req, res) => {
  const lead = await getOwnedLead(req, res);
  if (!lead) return;

  lead.isPinned = !lead.isPinned;
  await lead.save();
  res.json({ isPinned: lead.isPinned });
});

// Dashboard Stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;

  const filter = role === 'employee' ? { assignedTo: _id } : {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, newToday, interested, booked,
    contacted, followUp, visitor,
    uninterested, noResponse, followUps] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.countDocuments({ ...filter, createdAt: { $gte: today } }),
      Lead.countDocuments({ ...filter, status: 'Interested' }),
      Lead.countDocuments({ ...filter, status: 'Booked' }),
      Lead.countDocuments({ ...filter, status: 'Contacted' }),
      Lead.countDocuments({ ...filter, status: 'Follow Up' }),
      Lead.countDocuments({ ...filter, status: 'Visitor' }),
      Lead.countDocuments({ ...filter, status: 'Uninterested' }),
      Lead.countDocuments({ ...filter, status: 'No Response' }),
      FollowUp.countDocuments({
        employee: _id,
        date: today.toISOString().split('T')[0],
        isCompleted: false,
      }),
    ]);

  res.json({
    totalLeads: total,
    newToday,
    interested,
    booked,
    contacted,
    followUp,
    visitor,
    uninterested,
    noResponse,
    todayFollowUps: followUps,
    pending: followUp,
  });
});

// n8n Webhook
exports.webhookLead = asyncHandler(async (req, res) => {
  const { name, phone, email, city, source, campaign, message, car } = req.body;

  // Required-field validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }
  if (!phone || typeof phone !== 'string' || !/^[+\d][\d\s-]{6,19}$/.test(phone.trim())) {
    return res.status(400).json({ message: 'A valid phone is required' });
  }
  if (email && typeof email === 'string' && email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  // Cap lengths so a caller cannot send megabytes of text.
  const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

  const employee = await User.findOne({ role: 'employee', isActive: true });

  const lead = await Lead.create({
    name: clip(name, 120),
    phone: clip(phone, 20),
    email: clip(email, 120),
    city: clip(city, 80),
    source: clip(source, 40) || 'n8n',
    campaign: clip(campaign, 120),
    message: clip(message, 1000),
    car: clip(car, 80),
    status: 'New Lead',
    assignedTo: employee?._id || null,
    timeline: [{
      type: 'created',
      description: `Lead received from ${clip(source, 40) || 'n8n'}`,
    }],
  });

  res.json({ success: true, leadId: lead._id });
});

// Add Follow Up
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

// Update Visitor Date
exports.updateVisitorDate = asyncHandler(async (req, res) => {
  const { visitorDate } = req.body;
  const lead = await getOwnedLead(req, res);
  if (!lead) return;

  lead.visitorDate = visitorDate;
  lead.timeline.push({
    type: 'status_changed',
    description: `Visitor date set: ${visitorDate}`,
  });
  await lead.save();

  res.json({ message: 'Visitor date updated', visitorDate });
});

// Today's Follow Ups
exports.getTodayFollowUps = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const followUps = await FollowUp.find({
    employee: req.user._id,
    date: today,
    isCompleted: false,
  }).populate('lead', 'name phone status');

  res.json({ followUps, total: followUps.length });
});

// Update Lead Info
exports.updateLeadInfo = asyncHandler(async (req, res) => {
  const { name, phone, email, city, car, campaign } = req.body;
  const lead = await getOwnedLead(req, res);
  if (!lead) return;

  if (name) lead.name = name;
  if (phone) lead.phone = phone;
  if (email !== undefined) lead.email = email;
  if (city !== undefined) lead.city = city;
  if (car !== undefined) lead.car = car;
  if (campaign !== undefined) lead.campaign = campaign;

  lead.timeline.push({
    type: 'status_changed',
    description: `Lead information updated by ${req.user.name}`,
  });

  await lead.save();
  res.json({ message: 'Lead updated successfully', lead });
});