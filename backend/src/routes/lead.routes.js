const router      = require('express').Router();
const auth        = require('../middleware/auth');
const validate    = require('../middleware/validate');
const v           = require('../middleware/leadValidators');
const ctrl        = require('../controllers/lead.controller');
const appointmentCtrl = require('../controllers/appointment.controller');

// ── All routes below require auth ────────────────────────────────────────────
router.use(auth);

// Dashboard & follow-ups (no :id — must be before /:id routes)
router.get('/dashboard',            ctrl.getDashboardStats);
router.get('/followups/today',      ctrl.getTodayFollowUps);
router.patch('/followup/:followUpId/complete', ctrl.completeFollowUp);

// Employee-specific lead lists (today / pending / booked)
router.get('/employee-today',       ctrl.getEmployeeTodayLeads);
router.get('/employee-pending',     ctrl.getEmployeePendingLeads);
router.get('/employee-booked',      ctrl.getEmployeeBookedLeads);

// Appointment — employee can book for their own lead
router.post('/appointments', appointmentCtrl.createAppointment);

// Lead CRUD
router.get ('/',    v.listLeadsRules,   validate, ctrl.getMyLeads);
router.post('/',    v.createLeadRules,  validate, ctrl.createLead);
router.get ('/:id', v.idRule,           validate, ctrl.getLeadById);

// Lead actions
router.patch ('/:id/status',   v.updateStatusRules, validate, ctrl.updateStatus);
router.patch ('/:id/note',     v.addNoteRules,       validate, ctrl.addNote);
router.patch ('/:id/pin',      v.idRule,             validate, ctrl.togglePin);
router.patch ('/:id/info',     v.updateInfoRules,    validate, ctrl.updateLeadInfo);
router.post  ('/:id/followup', v.followUpRules,      validate, ctrl.addFollowUp);


module.exports = router;