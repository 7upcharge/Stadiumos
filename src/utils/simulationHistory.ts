/**
 * Simulation History Store
 *
 * Client-side in-memory store for past simulation runs.
 * Designed as a drop-in replacement target for Firestore `Simulations` collection.
 *
 * Fields match the Firestore schema specified in requirements:
 *   query, result, confidence, timestamp, actionPlan
 */

import type { PipelineResponse } from '../types/scenarioSimulator';

export interface SimulationRecord {
  id: string;
  query: string;
  result: PipelineResponse;
  confidence: number;
  timestamp: string;
  actionPlan: string[];
}

let simulations: SimulationRecord[] = [];

export function addSimulation(record: Omit<SimulationRecord, 'id' | 'timestamp'>): SimulationRecord {
  const entry: SimulationRecord = {
    ...record,
    id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  simulations.unshift(entry);
  return entry;
}

export function getSimulations(): SimulationRecord[] {
  return [...simulations];
}

export function clearSimulations(): void {
  simulations = [];
}
