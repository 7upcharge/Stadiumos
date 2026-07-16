/**
 * StadiumOS AI — Express Server Entry Point
 *
 * Serves the API on port 3001. The Vite dev server proxies
 * /api requests here, so in development both servers run concurrently.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scenarioRouter } from './api/scenario.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api', scenarioRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'StadiumOS AI Scenario Simulator',
    demoMode: !process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  const demoMode = !process.env.GEMINI_API_KEY;
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         StadiumOS AI — Scenario Simulator           ║');
  console.log('║         FIFA World Cup 2026 Operations              ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Server:    http://localhost:${PORT}                    ║`);
  console.log(`║  Mode:      ${demoMode ? 'DEMO (no API key)' : 'LIVE (Gemini active)'}            ║`);
  console.log(`║  Endpoint:  POST /api/scenario-simulate             ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  if (demoMode) {
    console.log('ℹ  Running in demo mode. Set GEMINI_API_KEY in .env for live AI.');
    console.log('');
  }
});
