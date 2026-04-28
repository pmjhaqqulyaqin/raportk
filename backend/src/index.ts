import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { auth } from './lib/auth';
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";

import studentsRouter from './routes/students';
import schoolInfoRouter from './routes/schoolInfo';
import reportsRouter from './routes/reports';
import templatesRouter from './routes/templates';
import backupRouter from './routes/backup';
import aiRouter from './routes/ai';

// Load .env — Docker production: /app/.env.production, Dev: ../../.env
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Better Auth Route Handler
app.use("/api/auth", toNodeHandler(auth));

// API Routes
app.use('/api/students', studentsRouter);
app.use('/api/school-info', schoolInfoRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/backup', backupRouter);
app.use('/api/ai', aiRouter);

// A simple protected route test
app.get('/api/protected', async (req, res) => {
    // using the getSession method from Better Auth
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
    });
    
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({ message: 'This is protected data', user: session.user });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- Production: Serve frontend static files ---
if (isProduction) {
  const frontendPath = path.resolve(__dirname, '../public');
  app.use(express.static(frontendPath));

  // SPA fallback: all non-API routes serve index.html
  app.get('/(.*)', (req, res) => {
    res.sendFile(path.resolve(frontendPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Backend server listening on port ${port} (${isProduction ? 'production' : 'development'})`);
});
