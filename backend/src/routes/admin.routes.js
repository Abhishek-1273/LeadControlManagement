const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ctrl = require('../controllers/admin.controller');

// Sab routes admin only
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

module.exports = router;