/**
 * StadiumOS AI — API Layer
 *
 * POST /api/scenario-simulate
 *
 * Orchestrates the full pipeline: Parse → Simulate → Reason
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { parseQuery } from '../parser/queryParser.js';
import { runSimulation } from '../simulator/simulationCore.js';
import { generateReasoning } from '../reasoner/reasoningLayer.js';
import type { PipelineResponse, ApiError } from '../../src/types/scenarioSimulator.js';
import { db } from '../config/firebase.js';

export const scenarioRouter = Router();

// Zod schema definitions for input validation
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const gateStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number(),
  currentLoad: z.number(),
  baseWaitMinutes: z.number(),
  position: positionSchema,
  adjacentGateIds: z.array(z.string()),
  isOpen: z.boolean(),
});

const stadiumStateSchema = z.object({
  gates: z.array(gateStateSchema),
  totalCapacity: z.number(),
  currentAttendance: z.number(),
  maxAttendance: z.number(),
  volunteers: z.number(),
  shuttles: z.number(),
  parkingUtilization: z.number(),
});

const scenarioSimulateSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty.')
    .max(500, 'Query exceeds maximum length of 500 characters.'),
  beforeState: stadiumStateSchema.optional(),
});

scenarioRouter.post('/scenario-simulate', async (req: Request, res: Response): Promise<void> => {
  const apiKey = process.env.GEMINI_API_KEY;
  const demoMode = !apiKey;

  const parseResult = scenarioSimulateSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorResponse: ApiError = {
      error: parseResult.error.issues[0]?.message || 'Invalid simulation request body.',
      stage: 'parsing',
    };
    res.status(400).json(errorResponse);
    return;
  }

  const query = parseResult.data.query.trim();
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎯 Scenario Simulation Request${demoMode ? ' [DEMO MODE]' : ''}`);
  console.log(`   Query: "${query}"`);
  console.log(`${'═'.repeat(60)}`);

  try {
    const parseStart = performance.now();
    console.log('📝 Step 1: Parsing query...');
    const parsed = await parseQuery(query, apiKey);
    const parseMs = performance.now() - parseStart;
    console.log(`   ✓ Parsed in ${parseMs.toFixed(0)}ms:`, JSON.stringify(parsed));

    const simStart = performance.now();
    console.log('🔬 Step 2: Running simulation...');
    const simulation = runSimulation(parsed, parseResult.data.beforeState);
    const simulateMs = performance.now() - simStart;
    console.log(`   ✓ Simulated in ${simulateMs.toFixed(0)}ms`);
    console.log(`   Affected: ${simulation.affectedGateName}`);
    console.log(`   Overloaded gates: ${simulation.overloadedGates.length > 0 ? simulation.overloadedGates.join(', ') : 'none'}`);
    console.log(`   Peak load: ${simulation.peakLoadGateId}`);

    const reasonStart = performance.now();
    console.log('🧠 Step 3: Generating reasoning...');
    const reasoning = await generateReasoning(simulation, apiKey);
    const reasonMs = performance.now() - reasonStart;
    console.log(`   ✓ Reasoning generated in ${reasonMs.toFixed(0)}ms`);
    console.log(`   Confidence: ${reasoning.confidence}`);
    console.log(`   Risk: ${reasoning.risk_level}`);
    console.log(`   Actions: ${reasoning.action_plan.length}`);

    const totalMs = parseMs + simulateMs + reasonMs;
    const response: PipelineResponse = {
      input: { query },
      parsed,
      simulation,
      reasoning,
      timing: {
        parseMs: Math.round(parseMs),
        simulateMs: Math.round(simulateMs),
        reasonMs: Math.round(reasonMs),
        totalMs: Math.round(totalMs),
      },
      demoMode,
    };

    console.log(`\n✅ Pipeline complete in ${totalMs.toFixed(0)}ms`);
    console.log(`${'═'.repeat(60)}\n`);

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ Pipeline failed: ${message}\n`);

    const errorResponse: ApiError = {
      error: 'Simulation pipeline failed',
      details: message,
    };
    res.status(500).json(errorResponse);
  }
});

// In-memory simulations fallback store
const inMemorySimulations: any[] = [];

// ── GET /api/simulations ──
scenarioRouter.get('/simulations', async (req: Request, res: Response): Promise<void> => {
  try {
    const snapshot = await db.collection('simulations').orderBy('timestamp', 'desc').limit(20).get();
    const list: any[] = [];
    snapshot.forEach((doc: any) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    res.json(list);
  } catch (error: any) {
    console.warn('Firestore failed to fetch, returning mock in-memory simulations:', error.message);
    res.json(inMemorySimulations.slice(0, 20));
  }
});

// ── POST /api/simulations ──
scenarioRouter.post('/simulations', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, result, confidence, actionPlan } = req.body;
    if (!query || !result) {
      res.status(400).json({ error: 'Missing query or result in body' });
      return;
    }
    const record = {
      query,
      result,
      confidence: confidence ?? 0.5,
      timestamp: new Date().toISOString(),
      actionPlan: actionPlan ?? [],
    };
    try {
      const docRef = await db.collection('simulations').add(record);
      res.json({ id: docRef.id, ...record });
    } catch (dbErr: any) {
      console.warn('Firestore failed to save, saving to in-memory store:', dbErr.message);
      const mockId = `mock-sim-${Date.now()}`;
      const savedRecord = { id: mockId, ...record };
      inMemorySimulations.unshift(savedRecord);
      res.json(savedRecord);
    }
  } catch (error: any) {
    console.error('Failed to save simulation:', error.message);
    res.status(500).json({ error: 'Failed to persist simulation run', details: error.message });
  }
});

