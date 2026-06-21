require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const validateEnv = require('./config/validateEnv');
const { errorHandler, notFound } = require('./middleware/errorHandler');

validateEnv(); // fail fast before anything else boots

const app = express();
// Trust the first proxy hop so req.ip reflects the real client IP
// (needed for correct rate limiting behind Nginx/Render/Railway/etc.)
app.set('trust proxy', 1);
connectDB();

// --- Security headers ---
app.use(helmet());

// --- CORS: allow only known origins ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// --- Body parsing with size caps ---
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));


app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/leads', require('./routes/lead.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/schedule', require('./routes/schedule.routes'));


app.get('/', (req, res) => {
  res.json({ status: '🚀 Lead Backend Running!' });
});

app.use(notFound);      // unmatched routes -> 404
app.use(errorHandler);  // central error handler -> safe responses

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server on port ${process.env.PORT || 5000}`);
});