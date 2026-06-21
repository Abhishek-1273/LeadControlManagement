const User = require('../models/User.model');
const Lead = require('../models/Lead.model');
const Appointment = require('../models/Appointment.model');
const bcrypt = require('bcryptjs');
const { startOfDay, endOfDay, startOfDaysAgo, todayString, startOfMonth, APP_TZ } = require('../utils/dateRange');

// Escape user input before using it in a Mongo $regex to prevent ReDoS / injection.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Admin Stats (overview numbers)
exports.getAdminStats = async (req, res) => {
  try {
    const today = startOfDay();
    const todayEnd = endOfDay();
    const monthStart = startOfMonth();
    const todayKey = todayString();

    // Hot/Warm/Cold/Booked share the same today window as "Today Leads" —
    // combined across every employee (no assignedTo filter; admin sees the
    // org-wide total). "Monthly Leads" and conversion rate are scoped to
    // the current calendar month instead, per the dashboard redesign.
    const todayFilter = { createdAt: { $gte: today, $lte: todayEnd } };
    const monthFilter = { createdAt: { $gte: monthStart } };

    const [
      monthLeads, todayLeads, hot,
      warm, cold, followUp, bookedToday, activeEmployees,
      monthBooked, appointmentsToday, pendingLeads, allBooked,
    ] = await Promise.all([
      // Monthly Leads — this calendar month's total leads (booked +
      // unbooked), every employee combined. Replaces the old all-time
      // "Total Leads" card.
      Lead.countDocuments(monthFilter),
      Lead.countDocuments(todayFilter),
      Lead.countDocuments({ ...todayFilter, status: 'Hot' }),
      Lead.countDocuments({ ...todayFilter, status: 'Warm' }),
      Lead.countDocuments({ ...todayFilter, status: 'Cold' }),
      Lead.countDocuments({ ...todayFilter, status: 'Follow Up' }),
      Lead.countDocuments({ ...todayFilter, status: 'Booked' }),
      // Active Employees — replaces the old total-employee-count card.
      User.countDocuments({ role: 'employee', isActive: true }),
      // Conversion rate uses booked-this-month / total-leads-this-month —
      // monthLeads above already gives the denominator.
      Lead.countDocuments({ ...monthFilter, status: 'Booked' }),
      // Appointments scheduled for today (appointmentDate is a "YYYY-MM-DD"
      // string in app-timezone, so a direct string match is correct here).
      Appointment.countDocuments({ appointmentDate: todayKey }),
      // Pending Leads — every employee's previous-day unbooked leads
      // combined (no assignedTo filter), same definition as the employee
      // side's "Previous Pending" (getEmployeePendingLeads), just org-wide.
      Lead.countDocuments({
        createdAt: { $lt: today },
        status: { $in: ['Hot', 'Warm', 'Cold', 'Follow Up'] },
      }),
      // All Booked — every lead ever booked, any date, every employee
      // combined. Lifetime counterpart to "Booked Today".
      Lead.countDocuments({ status: 'Booked' }),
    ]);

    const conversionRate = monthLeads > 0
      ? Math.round((monthBooked / monthLeads) * 100)
      : 0;

    res.json({
      monthLeads,
      todayLeads,
      hot, warm, cold, followUp,
      booked: bookedToday,
      allBooked,
      activeEmployees,
      conversionRate,
      appointmentsToday,
      pendingLeads,
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

    // Date range filter.
    // FIX: previously used `new Date(dateFrom)` + `setHours(0,0,0,0)`/
    // `setHours(23,59,59,999)`, which compute midnight/end-of-day in the
    // SERVER's local timezone. On Render (UTC), that's 5:30 hours off from
    // the intended Asia/Kolkata day boundary, so a search for "today" or a
    // specific date could silently include/exclude leads from the wrong
    // side of midnight IST. Use the app's timezone-aware helpers instead.
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = startOfDay(new Date(`${dateFrom}T12:00:00Z`));
      if (dateTo) filter.createdAt.$lte = endOfDay(new Date(`${dateTo}T12:00:00Z`));
    }

    // Month + Year filter (overrides dateFrom/dateTo).
    // FIX: same timezone issue — `new Date(year, month-1, 1)` resolves in
    // the server's local time, not Asia/Kolkata. Anchor to noon UTC on the
    // 1st (always lands on the correct calendar date regardless of server
    // timezone) then convert to the IST day boundary.
    if (month && year) {
      const mm = String(parseInt(month, 10)).padStart(2, '0');
      const startDate = startOfDay(new Date(`${year}-${mm}-01T12:00:00Z`));
      const nextMonth = parseInt(month, 10) === 12 ? 1 : parseInt(month, 10) + 1;
      const nextYear = parseInt(month, 10) === 12 ? parseInt(year, 10) + 1 : parseInt(year, 10);
      const nextMm = String(nextMonth).padStart(2, '0');
      const endDate = new Date(
        startOfDay(new Date(`${nextYear}-${nextMm}-01T12:00:00Z`)).getTime() - 1
      );
      filter.createdAt = { $gte: startDate, $lte: endDate };
    } else if (year && !month) {
      const startDate = startOfDay(new Date(`${year}-01-01T12:00:00Z`));
      const endDate = new Date(
        startOfDay(new Date(`${parseInt(year, 10) + 1}-01-01T12:00:00Z`)).getTime() - 1
      );
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Default archive window: last 30 days, UNLESS the admin is explicitly
    // searching/filtering. Older leads remain stored and reachable via search,
    // status, employee, or an explicit date/month/year range.
    const hasExplicitScope =
      search || status || employee || dateFrom || dateTo || month || year;
    if (!hasExplicitScope && !filter.createdAt) {
      filter.createdAt = { $gte: startOfDaysAgo(30) };
    }

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

    // FIX: if a lead was deleted after its appointment was created, populate
    // returns lead: null for that record. The app screen reads
    // item.lead.name/.phone directly with no null guard, which crashes the
    // whole list (TypeError: Cannot read property 'name' of null). Filter
    // out orphaned appointments here so the API never returns a shape the
    // client can't safely render.
    const validAppointments = appointments.filter((a) => a.lead != null);

    res.json({ appointments: validAppointments, total: validAppointments.length });
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

// Set appointment status — 'scheduled' | 'completed' | 'missed'.
// Kept separate from updateAppointment (which only handles reschedule
// fields) so status changes have their own clear intent/endpoint, same
// as completeFollowUp is separate from generic follow-up edits.
// Does NOT touch the underlying Lead's status — appointment status and
// lead status are intentionally independent in this codebase.
const VALID_STATUSES = ['scheduled', 'completed', 'missed'];
exports.setAppointmentStatus = async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate({
      path: 'lead',
      select: 'name phone status assignedTo',
      populate: { path: 'assignedTo', select: 'name' },
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment status updated', appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};