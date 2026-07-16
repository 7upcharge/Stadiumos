/**
 * StadiumOS AI — Express Server Entry Point
 *
 * Serves the API on port 3001. The Vite dev server proxies
 * /api requests here, so in development both servers run concurrently.
 */

import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ?? 3001;

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
