const router = require('express').Router();
const auth = require('../middleware/auth');
const webhookAuth = require('../middleware/webhookAuth');
const { webhookLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validate');
const v = require('../middleware/leadValidators');
const ctrl = require('../controllers/lead.controller');

// Public webhook (Step 4)
router.post('/webhook', webhookLimiter, webhookAuth, ctrl.webhookLead);

// All routes below require auth
router.use(auth);

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/followups/today', ctrl.getTodayFollowUps);
router.patch('/followup/:followUpId/complete', ctrl.completeFollowUp);
router.delete('/bulk', ctrl.bulkDeleteLeads);

router.get('/', v.listLeadsRules, validate, ctrl.getMyLeads);
router.get('/:id', v.idRule, validate, ctrl.getLeadById);

router.patch('/:id/status', v.updateStatusRules, validate, ctrl.updateStatus);
router.patch('/:id/note', v.addNoteRules, validate, ctrl.addNote);
router.patch('/:id/pin', v.idRule, validate, ctrl.togglePin);
router.patch('/:id/info', v.updateInfoRules, validate, ctrl.updateLeadInfo);
router.post('/:id/followup', v.followUpRules, validate, ctrl.addFollowUp);
router.patch('/:id/visitor-date', v.visitorDateRules, validate, ctrl.updateVisitorDate);

router.delete('/:id', ctrl.deleteLead);

module.exports = router;