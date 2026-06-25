const cron = require('node-cron');
const Lead = require('../models/Lead.model');
const { startOfDay } = require('./dateRange');

// Runs every day at midnight IST (18:30 UTC).
// Promotes all 'New' leads created on previous days to 'Pending'.
//
// NOTE: this function is currently NOT called anywhere in app.js — it's
// dormant. The per-request New→Pending promotion in lead.controller.js
// (getDashboardStats / getEmployeePendingLeads) already covers the same
// promotion whenever those endpoints are hit. Wiring this cron up as well
// would add promotion even on days nobody opens the dashboard, which is a
// behavior change beyond fixing the bug below — left for a deliberate
// decision rather than bundled into this fix.
function startScheduler() {
  cron.schedule('30 18 * * *', async () => {
    try {
      // FIX: setHours(0,0,0,0) computed midnight in the server's local/UTC
      // time, not Asia/Kolkata — a ~5.5 hour mismatch against the IST
      // midnight this job is actually scheduled to run at. Use the same
      // IST-aware startOfDay() helper the rest of the app already relies on.
      const result = await Lead.updateMany(
        { status: 'New', createdAt: { $lt: startOfDay() } },
        {
          $set: { status: 'Pending' },
          $push: {
            timeline: {
              type: 'status_changed',
              description: 'Status auto-changed: New → Pending (end of day)',
              createdAt: new Date(),
            },
          },
        }
      );
      console.log(`[Scheduler] New→Pending: ${result.modifiedCount} lead(s) promoted`);
    } catch (err) {
      console.error('[Scheduler] New→Pending error:', err.message);
    }
  });

  console.log('[Scheduler] midnight IST New→Pending cron registered');
}

module.exports = { startScheduler };
