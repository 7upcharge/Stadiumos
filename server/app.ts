import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { scenarioRouter } from './api/scenario.js';
import { copilotRouter } from './api/copilot.js';
import { standardLimiter, aiLimiter } from './config/rateLimiter.js';

dotenv.config();

const app = express();

// Secure headers using helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://stadium-os-ten.vercel.app"],
    },
  },
}));

// Restrict CORS origins
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Apply standard rate limiting to all requests
app.use(standardLimiter);

// Mount Simulator routes
app.use('/api', scenarioRouter);

// Apply strict rate limiting to copilot endpoint
app.use('/api/ai', aiLimiter, copilotRouter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'StadiumOS AI Core Services',
    demoMode: !process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Fallback error handler to prevent stack trace leakage in client response
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API Pipeline Error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: 'An internal server error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Detailed diagnostics hidden for security.',
  });
});

export default app;
