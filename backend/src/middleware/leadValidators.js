const { body, query, param } = require('express-validator');

const LEAD_STATUSES = [
  'New Lead', 'Contacted', 'Follow Up', 'Visitor',
  'Interested', 'Booked', 'Uninterested', 'No Response',
];
// ^ Adjust this list to match the exact status values your app uses.

const objectId = (name) =>
  param(name).isMongoId().withMessage('Invalid id');

module.exports = {
  LEAD_STATUSES,

  loginRules: [
    body('email').isString().trim().notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],

  listLeadsRules: [
    query('search').optional().isString().trim().isLength({ max: 100 }),
    query('status').optional().isString().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],

  idRule: [objectId('id')],

  updateStatusRules: [
    objectId('id'),
    body('status').isString().trim().isIn(LEAD_STATUSES)
      .withMessage('Invalid status'),
  ],

  addNoteRules: [
    objectId('id'),
    body('note').isString().trim().notEmpty().withMessage('Note is required')
      .isLength({ max: 1000 }).withMessage('Note too long'),
  ],

  followUpRules: [
    objectId('id'),
    body('date').isString().trim().notEmpty().withMessage('Date is required'),
    body('time').isString().trim().notEmpty().withMessage('Time is required'),
    body('notes').optional().isString().trim().isLength({ max: 1000 }),
  ],

  visitorDateRules: [
    objectId('id'),
    body('visitorDate').isString().trim().notEmpty()
      .withMessage('Visitor date is required'),
  ],

  updateInfoRules: [
    objectId('id'),
    body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('phone').optional().isString().trim().matches(/^[+\d][\d\s-]{6,19}$/)
      .withMessage('Invalid phone'),
    body('campaign').optional().isString().trim().isLength({ max: 120 }),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
    body('city').optional().isString().trim().isLength({ max: 80 }),
    body('car').optional().isString().trim().isLength({ max: 80 }),
  ],

  createLeadRules: [
    body('name')
      .isString().trim().notEmpty().withMessage('Name is required')
      .isLength({ max: 120 }).withMessage('Name too long'),

    body('primaryPhone')
      .isString().trim().notEmpty().withMessage('Primary phone is required')
      .matches(/^\d{10}$/).withMessage('Primary phone must be a valid 10-digit number'),

    body('secondaryPhone')
      .optional({ checkFalsy: true })
      .isString().trim()
      .matches(/^\d{10}$/).withMessage('Secondary phone must be a valid 10-digit number')
      .custom((value, { req }) => {
        if (value && value === req.body.primaryPhone) {
          throw new Error('Secondary phone cannot be the same as primary phone');
        }
        return true;
      }),

    body('email')
      .optional({ checkFalsy: true })
      .isEmail().withMessage('Invalid email'),

    body('city').optional().isString().trim().isLength({ max: 80 }),
    body('source').optional().isString().trim().isLength({ max: 40 }),
    body('campaign').optional().isString().trim().isLength({ max: 120 }),
    body('car').optional().isString().trim().isLength({ max: 80 }),
  ],
};