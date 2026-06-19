const router      = require('express').Router();
const auth        = require('../middleware/auth');
const webhookAuth = require('../middleware/webhookAuth');
const { webhookLimiter } = require('../middleware/rateLimiters');
const validate    = require('../middleware/validate');
const v           = require('../middleware/leadValidators');
const ctrl        = require('../controllers/lead.controller');

// ── Public webhook (n8n / external) ─────────────────────────────────────────
router.post('/webhook', webhookLimiter, webhookAuth, ctrl.webhookLead);

// ── All routes below require auth ────────────────────────────────────────────
router.use(auth);

// Dashboard & follow-ups (no :id — must be before /:id routes)
router.get('/dashboard',            ctrl.getDashboardStats);
router.get('/followups/today',      ctrl.getTodayFollowUps);
router.patch('/followup/:followUpId/complete', ctrl.completeFollowUp);
router.delete('/bulk',              ctrl.bulkDeleteLeads);

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

router.delete('/:id', ctrl.deleteLead);

module.exports = router;
