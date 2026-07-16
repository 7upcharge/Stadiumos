/**
 * StadiumOS AI — API Layer
 *
 * POST /api/scenario-simulate
 *
 * Orchestrates the full pipeline: Parse → Simulate → Reason
 */

import { Router, type Request, type Response } from 'express';
import { parseQuery } from '../parser/queryParser.js';
import { runSimulation } from '../simulator/simulationCore.js';
import { generateReasoning } from '../reasoner/reasoningLayer.js';
import type { PipelineResponse, ApiError } from '../../src/types/scenarioSimulator.js';
import { db } from '../config/firebase.js';

export const scenarioRouter = Router();

function validateInput(body: Record<string, unknown>): string | null {
  if (!body || typeof body.query !== 'string') {
    return 'Request body must include a "query" field of type string.';
  }

  const query = body.query.trim();

  if (query.length === 0) {
    return 'Query cannot be empty.';
  }

  if (query.length > 500) {
    return 'Query exceeds maximum length of 500 characters.';
  }

  return null;
}

scenarioRouter.post('/scenario-simulate', async (req: Request, res: Response): Promise<void> => {
  const apiKey = process.env.GEMINI_API_KEY;
  const demoMode = !apiKey;

  const validationError = validateInput(req.body);
  if (validationError) {
    const errorResponse: ApiError = {
      error: validationError,
      stage: 'parsing',
    };
    res.status(400).json(errorResponse);
    return;
  }

  const query = (req.body.query as string).trim();
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
    const simulation = runSimulation(parsed, req.body.beforeState as any);
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
    console.error('Failed to get simulations:', error.message);
    res.status(500).json({ error: 'Failed to retrieve simulation history', details: error.message });
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
    const docRef = await db.collection('simulations').add(record);
    res.json({ id: docRef.id, ...record });
  } catch (error: any) {
    console.error('Failed to save simulation:', error.message);
    res.status(500).json({ error: 'Failed to persist simulation run', details: error.message });
  }
});

