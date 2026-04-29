import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import path from 'path';
import { auth } from './lib/auth';
import { toNodeHandler } from "better-auth/node";

import studentsRouter from './routes/students';
import schoolInfoRouter from './routes/schoolInfo';
import reportsRouter from './routes/reports';
import templatesRouter from './routes/templates';
import backupRouter from './routes/backup';
import aiRouter from './routes/ai';
import uploadRouter from './routes/upload';
import schoolsRouter from './routes/schools';
import chatRouter from './routes/chat';
import pushRouter from './routes/push';

// Load .env — Docker production: /app/.env.production, Dev: ../../.env
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const app = express();
const port = process.env.PORT || 3000;

// ─── CORS ────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.BETTER_AUTH_URL || '',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────
// Global: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak request. Coba lagi nanti.' },
});

// Auth: 10 requests per minute (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak percobaan login. Tunggu 1 menit.' },
});

// AI: 15 requests per minute (API quota protection)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Terlalu banyak request AI. Tunggu sebentar.' },
});

// Chat: 30 messages per minute
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Terlalu banyak pesan. Tunggu sebentar.' },
});

app.use('/api/', globalLimiter);

// ─── Body Parser ─────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ─── Routes ──────────────────────────────────────────────
// Auth (with stricter rate limit)
app.use("/api/auth", authLimiter, toNodeHandler(auth));

// API Routes (with specific rate limits for sensitive endpoints)
app.use('/api/students', studentsRouter);
app.use('/api/school-info', schoolInfoRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/backup', backupRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/schools', schoolsRouter);
app.use('/api/chat', chatLimiter, chatRouter);
app.use('/api/push', pushRouter);

// Serve uploaded files (profile photos, etc.)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── Production: Serve frontend static files ─────────────
if (isProduction) {
  const frontendPath = path.resolve(__dirname, '../public');
  app.use(express.static(frontendPath));

  // SPA fallback: all non-API routes serve index.html
  app.use((req, res) => {
    res.sendFile(path.resolve(frontendPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Backend server listening on port ${port} (${isProduction ? 'production' : 'development'})`);
});
