const User = require('../models/User.model');
const Lead = require('../models/Lead.model');
const Appointment = require('../models/Appointment.model');
const bcrypt = require('bcryptjs');
const { startOfDay, endOfDay, startOfDaysAgo, todayString, APP_TZ } = require('../utils/dateRange');

// Escape user input before using it in a Mongo $regex to prevent ReDoS / injection.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Admin Stats (overview numbers)
exports.getAdminStats = async (req, res) => {
  try {
    const today = startOfDay();
    const todayEnd = endOfDay();

    const [
      totalLeads, todayLeads, hot,
      warm, cold, followUp, booked, totalEmployees,
    ] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ createdAt: { $gte: today } }),
      // Status breakdown is scoped to TODAY's leads only, so the dashboard
      // always reflects today's snapshot instead of mixing in old/archived
      // leads. (Hot+Warm+Cold+FollowUp+Booked here adds up to todayLeads.)
      Lead.countDocuments({ status: 'Hot', createdAt: { $gte: today, $lte: todayEnd } }),
      Lead.countDocuments({ status: 'Warm', createdAt: { $gte: today, $lte: todayEnd } }),
      Lead.countDocuments({ status: 'Cold', createdAt: { $gte: today, $lte: todayEnd } }),
      Lead.countDocuments({ status: 'Follow Up', createdAt: { $gte: today, $lte: todayEnd } }),
      Lead.countDocuments({ status: 'Booked', createdAt: { $gte: today, $lte: todayEnd } }),
      User.countDocuments({ role: 'employee' }),
    ]);

    res.json({
      totalLeads, todayLeads, hot,
      warm, cold, followUp, booked, totalEmployees,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Monthly Leads Trend — rolling last 6 months (real data, timezone-aware).
// Returns: { trend: [{ label: 'Jul', year: 2026, count: 12 }, ...] }
// Always ends on the current month, so it auto-rolls forward (e.g. when July
// arrives the window becomes Feb–Jul instead of staying Jan–Jun).
exports.getMonthlyTrend = async (req, res) => {
  try {
    const MONTH_NAMES = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    // Build the list of the last 6 calendar months (oldest → newest),
    // anchored to the current month in the app timezone.
    const [yStr, mStr] = todayString().split('-');
    let year = parseInt(yStr, 10);
    let monthIdx = parseInt(mStr, 10) - 1; // 0-based

    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      let m = monthIdx - i;
      let y = year;
      while (m < 0) {
        m += 12;
        y -= 1;
      }
      buckets.push({ key: `${y}-${String(m + 1).padStart(2, '0')}`, label: MONTH_NAMES[m], year: y });
    }

    // Start = first day of the oldest bucket, in the app timezone.
    const first = buckets[0];
    const rangeStart = startOfDay(new Date(`${first.key}-01T12:00:00Z`));

    // Group leads by their createdAt year-month, in the app timezone.
    const grouped = await Lead.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt',
              timezone: APP_TZ,
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const countByKey = Object.fromEntries(grouped.map((g) => [g._id, g.count]));

    const trend = buckets.map((b) => ({
      label: b.label,
      year: b.year,
      count: countByKey[b.key] || 0,
    }));

    res.json({ trend });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin Performance Dashboard — per-employee booking metrics
exports.getPerformanceDashboard = async (req, res) => {
  try {
    const today = startOfDay();
    const todayEnd = endOfDay();
    const weekStart = startOfDaysAgo(7);
    // First day of the current month, anchored to the start of that local day.
    const [y, m] = todayString().split('-');
    const monthStart = startOfDay(new Date(`${y}-${m}-01T12:00:00Z`));

    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ name: 1 })
      .lean();
    const ids = employees.map((e) => e._id);

    // Single aggregation over all employees' leads instead of N queries per employee.
    const agg = await Lead.aggregate([
      { $match: { assignedTo: { $in: ids } } },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          totalBooked: {
            $sum: { $cond: [{ $eq: ['$status', 'Booked'] }, 1, 0] },
          },
          assignedToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', today] },
                    { $lte: ['$createdAt', todayEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          bookedToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'Booked'] },
                    { $gte: ['$updatedAt', today] },
                    { $lte: ['$updatedAt', todayEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          weeklyBooked: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'Booked'] },
                    { $gte: ['$updatedAt', weekStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          monthlyBooked: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'Booked'] },
                    { $gte: ['$updatedAt', monthStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          previousPending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$createdAt', today] },
                    { $in: ['$status', ['Hot', 'Warm', 'Cold', 'Follow Up']] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const byId = Object.fromEntries(agg.map((a) => [String(a._id), a]));

    const performanceData = employees.map((emp) => {
      const s = byId[String(emp._id)] || {};
      const totalAssigned = s.totalAssigned || 0;
      const totalBooked = s.totalBooked || 0;
      const conversionRate =
        totalAssigned > 0 ? Math.round((totalBooked / totalAssigned) * 100) : 0;

      return {
        employee: {
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          isActive: emp.isActive,
        },
        assignedToday: s.assignedToday || 0,
        bookedToday: s.bookedToday || 0,
        previousPending: s.previousPending || 0,
        totalAssigned,
        totalBooked,
        weeklyBooked: s.weeklyBooked || 0,
        monthlyBooked: s.monthlyBooked || 0,
        conversionRate,
      };
    });

    res.json({ performance: performanceData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Employees
exports.getEmployees = async (req, res) => {
  try {
    const today = startOfDay();

    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    const ids = employees.map((e) => e._id);

    // One aggregation instead of 2 queries per employee.
    const counts = await Lead.aggregate([
      { $match: { assignedTo: { $in: ids } } },
      {
        $group: {
          _id: '$assignedTo',
          totalLeads: { $sum: 1 },
          todayLeads: {
            $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] },
          },
        },
      },
    ]);
    const byId = Object.fromEntries(counts.map((c) => [String(c._id), c]));

    const employeesWithStats = employees.map((emp) => ({
      ...emp,
      totalLeads: byId[String(emp._id)]?.totalLeads || 0,
      todayLeads: byId[String(emp._id)]?.todayLeads || 0,
    }));

    res.json({ employees: employeesWithStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Employee By ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const [y, m] = todayString().split('-');
    const monthStart = startOfDay(new Date(`${y}-${m}-01T12:00:00Z`));

    const [totalLeads, totalBooked, monthlyBooked, recentLeads] = await Promise.all([
      Lead.countDocuments({ assignedTo: employee._id }),
      Lead.countDocuments({ assignedTo: employee._id, status: 'Booked' }),
      Lead.countDocuments({ assignedTo: employee._id, status: 'Booked', updatedAt: { $gte: monthStart } }),
      Lead.find({ assignedTo: employee._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((totalBooked / totalLeads) * 100) : 0;

    res.json({ ...employee.toObject(), totalLeads, totalBooked, monthlyBooked, conversionRate, recentLeads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add Employee
exports.addEmployee = async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const employee = await User.create({
      name, email, phone,
      password: password || 'employee123',
      role: 'employee',
      isActive: true,
    });
    res.json({
      message: 'Employee added successfully',
      employee: { _id: employee._id, name: employee.name, email: employee.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Employee
exports.updateEmployee = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    await User.findByIdAndUpdate(req.params.id, { name, email, phone });
    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle Employee Status
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    employee.isActive = !employee.isActive;
    await employee.save();
    res.json({
      message: `Employee ${employee.isActive ? 'activated' : 'deactivated'}`,
      isActive: employee.isActive
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Leads (Admin) — paginated archive/history
exports.getAllLeads = async (req, res) => {
  const { search, status, employee, dateFrom, dateTo, month, year, page = 1, limit = 50 } = req.query;
  try {
    let filter = {};

    // Text search
    if (search) {
      const safe = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { phone: { $regex: safe, $options: 'i' } },
      ];
    }

    // Status filter
    if (status) filter.status = status;

    // Employee filter
    if (employee) filter.assignedTo = employee;

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Month + Year filter (overrides dateFrom/dateTo)
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    } else if (year && !month) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    // No implicit date restriction here: the Archive is meant to hold the
    // complete lead history, oldest and newest alike. Date scoping only
    // happens when the admin explicitly passes dateFrom/dateTo/month/year.
    // (Newest-first sort below already brings recent leads to the top.)

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Lead.countDocuments(filter),
    ]);

    res.json({ leads, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign Lead
exports.assignLead = async (req, res) => {
  const { employeeId } = req.body;
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const employee = await User.findById(employeeId).select('_id name role isActive');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    if (employee.role !== 'employee') {
      return res.status(400).json({ message: 'Leads can only be assigned to employees' });
    }
    if (!employee.isActive) {
      return res.status(400).json({ message: 'Cannot assign to an inactive employee' });
    }

    lead.assignedTo = employee._id;
    lead.timeline.push({
      type: 'assigned',
      description: `Lead assigned to ${employee.name}`,
    });
    await lead.save();

    res.json({ message: 'Lead assigned successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Appointments ────────────────────────────────────────────────────────────

// Get all appointments (admin view)
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: 'lead',
        select: 'name phone status assignedTo',
        populate: { path: 'assignedTo', select: 'name email' },
      })
      .populate('createdBy', 'name')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json({ appointments, total: appointments.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single appointment
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'lead',
        select: 'name phone secondaryPhone email city status assignedTo',
        populate: { path: 'assignedTo', select: 'name email' },
      })
      .populate('createdBy', 'name');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update appointment
exports.updateAppointment = async (req, res) => {
  const { appointmentDate, appointmentTime, description } = req.body;
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { appointmentDate, appointmentTime, description },
      { new: true }
    ).populate({
      path: 'lead',
      select: 'name phone status assignedTo',
      populate: { path: 'assignedTo', select: 'name' },
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment updated', appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
