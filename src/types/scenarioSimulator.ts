/**
 * StadiumOS AI — Scenario Simulator Type Definitions
 *
 * These types define the data contracts between all pipeline stages:
 *   Parser → Simulator → Reasoner → Frontend
 *
 * Shared between frontend and server to ensure type safety.
 */

// ═══════════════════════════════════════
// STEP 1: Parser Output
// ═══════════════════════════════════════

export interface ScenarioInput {
  trigger: string;
  location: string;
  affected_entity: string;
  time_horizon_minutes: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ═══════════════════════════════════════
// STEP 2: Simulation Types
// ═══════════════════════════════════════

export interface Position {
  x: number;
  y: number;
}

export interface GateState {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  baseWaitMinutes: number;
  position: Position;
  adjacentGateIds: string[];
  isOpen: boolean;
}

export interface StadiumState {
  gates: GateState[];
  totalCapacity: number;
  currentAttendance: number;
  maxAttendance: number;
  volunteers: number;
  shuttles: number;
  parkingUtilization: number;
}

export interface CrowdRedistribution {
  gateId: string;
  gateName: string;
  originalLoad: number;
  redirectedLoad: number;
  newTotalLoad: number;
  capacityUtilization: number;
}

export interface WaitTimeChange {
  gateId: string;
  gateName: string;
  originalWaitMinutes: number;
  newWaitMinutes: number;
  deltaMinutes: number;
}

export interface TransportImpact {
  shuttleLoadDelta: number;
  parkingLoadDelta: number;
  estimatedAdditionalShuttlesNeeded: number;
  newParkingUtilization: number;
}

export interface StaffingGap {
  gateId: string;
  gateName: string;
  currentVolunteers: number;
  requiredVolunteers: number;
  gap: number;
}

export interface SimulationResult {
  scenario: ScenarioInput;
  affectedGateId: string;
  affectedGateName: string;
  crowdRedistribution: CrowdRedistribution[];
  waitTimeChanges: WaitTimeChange[];
  transportImpact: TransportImpact;
  staffingGaps: StaffingGap[];
  beforeState: StadiumState;
  afterState: StadiumState;
  peakLoadGateId: string;
  overloadedGates: string[];
}

// ═══════════════════════════════════════
// STEP 3: Reasoning Output
// ═══════════════════════════════════════

export interface Alternative {
  action: string;
  tradeoff: string;
}

export interface ConfidenceBreakdown {
  dataRecencyScore: number;
  magnitudeScore: number;
  historicalSimilarityScore: number;
  composite: number;
}

export interface ReasoningOutput {
  action_plan: string[];
  confidence: number;
  confidenceBreakdown: ConfidenceBreakdown;
  reasoning: string;
  risk_level: 'low' | 'medium' | 'high';
  alternatives: Alternative[];
}

// ═══════════════════════════════════════
// PIPELINE RESPONSE
// ═══════════════════════════════════════

export interface PipelineResponse {
  input: { query: string };
  parsed: ScenarioInput;
  simulation: SimulationResult;
  reasoning: ReasoningOutput;
  timing: {
    parseMs: number;
    simulateMs: number;
    reasonMs: number;
    totalMs: number;
  };
  demoMode: boolean;
}

export type PipelineStage =
  | 'idle'
  | 'parsing'
  | 'simulating'
  | 'reasoning'
  | 'complete'
  | 'error';

export interface ApiError {
  error: string;
  details?: string;
  stage?: PipelineStage;
}
