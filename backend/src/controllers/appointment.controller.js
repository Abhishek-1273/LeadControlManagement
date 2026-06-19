const Appointment = require('../models/Appointment.model');
const Lead = require('../models/Lead.model');

// Create appointment — used by EMPLOYEE when marking a lead as "Booked".
// Employee can only book an appointment for a lead assigned to them.
// Admin can also call this (e.g. booking on behalf of an employee).
exports.createAppointment = async (req, res) => {
  const { leadId, appointmentDate, appointmentTime, description } = req.body;
  try {
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // Employees can only book appointments for their own assigned leads
    if (
      req.user.role === 'employee' &&
      lead.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'You can only book appointments for your own leads' });
    }

    // Set lead status to Booked
    const oldStatus = lead.status;
    lead.status = 'Booked';
    lead.timeline.push({
      type: 'appointment_set',
      description: `Appointment booked for ${appointmentDate} at ${appointmentTime} by ${req.user.name}`,
    });
    await lead.save();

    const appointment = await Appointment.create({
      lead: leadId,
      appointmentDate,
      appointmentTime,
      description: description || '',
      createdBy: req.user._id,
    });

    const populated = await appointment.populate([
      { path: 'lead', select: 'name phone status assignedTo', populate: { path: 'assignedTo', select: 'name' } },
      { path: 'createdBy', select: 'name' },
    ]);

    res.status(201).json({ message: 'Appointment created successfully', appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
