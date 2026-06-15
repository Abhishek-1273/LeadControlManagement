const User = require('../models/User.model');
const Lead = require('../models/Lead.model');
const bcrypt = require('bcryptjs');

// Admin Stats
exports.getAdminStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalLeads, todayLeads, interested,
      visitor, booked, totalEmployees,
      newLeads, uninterested
    ] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ createdAt: { $gte: today } }),
      Lead.countDocuments({ status: 'Interested' }),
      Lead.countDocuments({ status: 'Visitor' }),
      Lead.countDocuments({ status: 'Booked' }),
      User.countDocuments({ role: 'employee' }),
      Lead.countDocuments({ status: 'New Lead' }),
      Lead.countDocuments({ status: 'Uninterested' }),
    ]);

    res.json({
      totalLeads, todayLeads, interested,
      visitor, booked, totalEmployees,
      newLeads, uninterested,
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

    // Har employee ke leads count karo
    const employeesWithStats = await Promise.all(
      employees.map(async (emp) => {
        const totalLeads = await Lead.countDocuments({
          assignedTo: emp._id
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLeads = await Lead.countDocuments({
          assignedTo: emp._id,
          createdAt: { $gte: today }
        });
        return {
          ...emp.toObject(),
          totalLeads,
          todayLeads,
        };
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
    const employee = await User.findById(req.params.id)
      .select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const totalLeads = await Lead.countDocuments({
      assignedTo: employee._id
    });
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
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Employee
exports.updateEmployee = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    await User.findByIdAndUpdate(req.params.id, {
      name, email, phone
    });
    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle Employee Status
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
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