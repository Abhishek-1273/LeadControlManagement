const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ctrl = require('../controllers/admin.controller');

// All routes admin only
router.use(auth, adminOnly);

// Stats
router.get('/stats', ctrl.getAdminStats);

// Employee routes
router.get('/employees', ctrl.getEmployees);
router.post('/employees', ctrl.addEmployee);
router.get('/employees/:id', ctrl.getEmployeeById);
router.patch('/employees/:id', ctrl.updateEmployee);
router.patch('/employees/:id/toggle', ctrl.toggleEmployeeStatus);

// Lead routes
router.get('/leads', ctrl.getAllLeads);
router.patch('/leads/:id/assign', ctrl.assignLead);

// Appointment routes (view/edit/delete = admin only)
// NOTE: creating an appointment is now handled by employees too,
// via POST /api/leads/appointments (see lead.routes.js) — removed here
// to avoid the adminOnly gate blocking employee bookings.
router.get('/appointments', ctrl.getAppointments);
router.get('/appointments/:id', ctrl.getAppointmentById);
router.patch('/appointments/:id', ctrl.updateAppointment);
router.delete('/appointments/:id', ctrl.deleteAppointment);

module.exports = router;
