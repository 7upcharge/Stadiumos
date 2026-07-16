import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scenarioRouter } from '../server/api/scenario.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', scenarioRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'StadiumOS AI Scenario Simulator (Vercel Serverless)',
    demoMode: !process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

export default app;
