const User = require('../models/User.model');
const Lead = require('../models/Lead.model');
const Appointment = require('../models/Appointment.model');
const bcrypt = require('bcryptjs');

// Admin Stats — updated for new 5 statuses
exports.getAdminStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalLeads, todayLeads, hot,
      warm, cold, followUp, booked, totalEmployees,
    ] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ createdAt: { $gte: today } }),
      Lead.countDocuments({ status: 'Hot' }),
      Lead.countDocuments({ status: 'Warm' }),
      Lead.countDocuments({ status: 'Cold' }),
      Lead.countDocuments({ status: 'Follow Up' }),
      Lead.countDocuments({ status: 'Booked' }),
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

// Get All Employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });

    const employeesWithStats = await Promise.all(
      employees.map(async (emp) => {
        const totalLeads = await Lead.countDocuments({ assignedTo: emp._id });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLeads = await Lead.countDocuments({
          assignedTo: emp._id,
          createdAt: { $gte: today }
        });
        return { ...emp.toObject(), totalLeads, todayLeads };
      })
    );

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

    const totalLeads = await Lead.countDocuments({ assignedTo: employee._id });
    const recentLeads = await Lead.find({ assignedTo: employee._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ ...employee.toObject(), totalLeads, recentLeads });
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

// Get All Leads (Admin)
exports.getAllLeads = async (req, res) => {
  const { search, status } = req.query;
  try {
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ leads, total: leads.length });
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

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    lead.assignedTo = employeeId;
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

// ─── Appointments ───────────────────────────────────────────────────────────

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

// NOTE: createAppointment moved to src/controllers/appointment.controller.js
// so employees (not just admins) can create appointments for their own leads.

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

// Delete appointment
exports.deleteAppointment = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
