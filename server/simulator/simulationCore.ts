/**
 * StadiumOS AI — Deterministic Simulation Core (Step 2)
 *
 * Every computation is deterministic, typed, and testable.
 * Zero LLM calls in here.
 */

import type {
  GateState,
  StadiumState,
  ScenarioInput,
  SimulationResult,
  CrowdRedistribution,
  WaitTimeChange,
  TransportImpact,
  StaffingGap,
} from '../../src/types/scenarioSimulator.js';

const STAFF_RATIO = 25;
const SHUTTLE_DIVERSION_RATE = 0.15;
const PARKING_DIVERSION_RATE = 0.08;
const SHUTTLE_CAPACITY = 45;
const PARKING_TOTAL_CAPACITY = 12_000;

export function getDefaultStadiumState(): StadiumState {
  return {
    gates: [
      {
        id: 'gate-1', name: 'Gate 1 (North)',
        capacity: 120, currentLoad: 85, baseWaitMinutes: 4.2,
        position: { x: 300, y: 45 },
        adjacentGateIds: ['gate-8', 'gate-2'], isOpen: true,
      },
      {
        id: 'gate-2', name: 'Gate 2 (NE)',
        capacity: 100, currentLoad: 72, baseWaitMinutes: 3.5,
        position: { x: 505, y: 130 },
        adjacentGateIds: ['gate-1', 'gate-3'], isOpen: true,
      },
      {
        id: 'gate-3', name: 'Gate 3 (East)',
        capacity: 110, currentLoad: 92, baseWaitMinutes: 5.1,
        position: { x: 570, y: 300 },
        adjacentGateIds: ['gate-2', 'gate-4'], isOpen: true,
      },
      {
        id: 'gate-4', name: 'Gate 4 (SE)',
        capacity: 95, currentLoad: 58, baseWaitMinutes: 2.8,
        position: { x: 505, y: 470 },
        adjacentGateIds: ['gate-3', 'gate-5'], isOpen: true,
      },
      {
        id: 'gate-5', name: 'Gate 5 (South)',
        capacity: 130, currentLoad: 98, baseWaitMinutes: 4.6,
        position: { x: 300, y: 555 },
        adjacentGateIds: ['gate-4', 'gate-6'], isOpen: true,
      },
      {
        id: 'gate-6', name: 'Gate 6 (SW)',
        capacity: 100, currentLoad: 68, baseWaitMinutes: 3.2,
        position: { x: 95, y: 470 },
        adjacentGateIds: ['gate-5', 'gate-7'], isOpen: true,
      },
      {
        id: 'gate-7', name: 'Gate 7 (West)',
        capacity: 115, currentLoad: 88, baseWaitMinutes: 4.0,
        position: { x: 30, y: 300 },
        adjacentGateIds: ['gate-6', 'gate-8'], isOpen: true,
      },
      {
        id: 'gate-8', name: 'Gate 8 (NW)',
        capacity: 105, currentLoad: 64, baseWaitMinutes: 2.9,
        position: { x: 95, y: 130 },
        adjacentGateIds: ['gate-7', 'gate-1'], isOpen: true,
      },
    ],
    totalCapacity: 82_500,
    currentAttendance: 58_000,
    maxAttendance: 82_500,
    volunteers: 420,
    shuttles: 22,
    parkingUtilization: 0.76,
  };
}

export function redistributeCrowd(
  closedGateId: string,
  state: StadiumState,
): CrowdRedistribution[] {
  const closedGate = state.gates.find(g => g.id === closedGateId);
  if (!closedGate) {
    throw new Error(`Gate ${closedGateId} not found in stadium state`);
  }

  let adjacentGates = state.gates.filter(
    g => closedGate.adjacentGateIds.includes(g.id) && g.isOpen && g.id !== closedGateId
  );

  if (adjacentGates.length === 0) {
    // Graceful fallback to all other open gates in the stadium
    adjacentGates = state.gates.filter(g => g.isOpen && g.id !== closedGateId);
    if (adjacentGates.length === 0) {
      throw new Error(`No other open gates found for ${closedGateId}. Cannot redistribute crowd.`);
    }
  }

  const totalAdjacentCapacity = adjacentGates.reduce((sum, g) => sum + g.capacity, 0);
  const loadToRedistribute = closedGate.currentLoad;

  return adjacentGates.map(gate => {
    const redirectedLoad = loadToRedistribute * (gate.capacity / totalAdjacentCapacity);
    const newTotalLoad = gate.currentLoad + redirectedLoad;
    const capacityUtilization = newTotalLoad / gate.capacity;

    return {
      gateId: gate.id,
      gateName: gate.name,
      originalLoad: gate.currentLoad,
      redirectedLoad: Math.round(redirectedLoad * 10) / 10,
      newTotalLoad: Math.round(newTotalLoad * 10) / 10,
      capacityUtilization: Math.round(capacityUtilization * 1000) / 1000,
    };
  });
}

export function computeWaitTimes(
  redistributions: CrowdRedistribution[],
  state: StadiumState,
): WaitTimeChange[] {
  return state.gates
    .filter(g => g.isOpen)
    .map(gate => {
      const redistribution = redistributions.find(r => r.gateId === gate.id);

      if (redistribution) {
        const loadRatio = redistribution.redirectedLoad / gate.capacity;
        const newWait = gate.baseWaitMinutes * (1 + loadRatio);

        return {
          gateId: gate.id,
          gateName: gate.name,
          originalWaitMinutes: gate.baseWaitMinutes,
          newWaitMinutes: Math.round(newWait * 10) / 10,
          deltaMinutes: Math.round((newWait - gate.baseWaitMinutes) * 10) / 10,
        };
      }

      return {
        gateId: gate.id,
        gateName: gate.name,
        originalWaitMinutes: gate.baseWaitMinutes,
        newWaitMinutes: gate.baseWaitMinutes,
        deltaMinutes: 0,
      };
    });
}

export function computeTransportImpact(
  redistributions: CrowdRedistribution[],
  state: StadiumState,
): TransportImpact {
  const totalRedirected = redistributions.reduce(
    (sum, r) => sum + r.redirectedLoad, 0
  );

  const shuttleLoadDelta = Math.round(totalRedirected * SHUTTLE_DIVERSION_RATE);
  const parkingLoadDelta = Math.round(totalRedirected * PARKING_DIVERSION_RATE);
  const estimatedAdditionalShuttlesNeeded = Math.ceil(shuttleLoadDelta / SHUTTLE_CAPACITY);

  const currentParkingVehicles = state.parkingUtilization * PARKING_TOTAL_CAPACITY;
  const newParkingVehicles = currentParkingVehicles + parkingLoadDelta;
  const newParkingUtilization = Math.min(1.0, newParkingVehicles / PARKING_TOTAL_CAPACITY);

  return {
    shuttleLoadDelta,
    parkingLoadDelta,
    estimatedAdditionalShuttlesNeeded,
    newParkingUtilization: Math.round(newParkingUtilization * 1000) / 1000,
  };
}

export function computeStaffingGap(
  redistributions: CrowdRedistribution[],
  state: StadiumState,
): StaffingGap[] {
  const openGates = state.gates.filter(g => g.isOpen);
  const totalLoad = openGates.reduce((sum, g) => sum + g.currentLoad, 0);

  return redistributions
    .filter(r => r.redirectedLoad > 0)
    .map(redistribution => {
      const gate = state.gates.find(g => g.id === redistribution.gateId)!;

      const currentVolunteers = Math.round(
        state.volunteers * (gate.currentLoad / totalLoad)
      );

      // Required volunteers scales with the new load proportional to the volunteer pool density
      const requiredVolunteers = Math.ceil(
        redistribution.newTotalLoad * (state.volunteers / totalLoad)
      );

      const gap = Math.max(0, requiredVolunteers - currentVolunteers);

      return {
        gateId: gate.id,
        gateName: gate.name,
        currentVolunteers,
        requiredVolunteers,
        gap,
      };
    });
}

export function runSimulation(
  scenario: ScenarioInput,
  initialState?: StadiumState,
): SimulationResult {
  const beforeState = initialState ?? getDefaultStadiumState();

  const affectedGateId = resolveGateId(scenario.location, beforeState);
  const affectedGate = beforeState.gates.find(g => g.id === affectedGateId);
  if (!affectedGate) {
    throw new Error(`Could not resolve gate from location: "${scenario.location}"`);
  }

  const afterState: StadiumState = {
    ...beforeState,
    gates: beforeState.gates.map(g =>
      g.id === affectedGateId
        ? { ...g, isOpen: false, currentLoad: 0 }
        : { ...g }
    ),
  };

  const crowdRedistribution = redistributeCrowd(affectedGateId, beforeState);
  const waitTimeChanges = computeWaitTimes(crowdRedistribution, beforeState);
  const transportImpact = computeTransportImpact(crowdRedistribution, beforeState);
  const staffingGaps = computeStaffingGap(crowdRedistribution, beforeState);

  afterState.gates = afterState.gates.map(gate => {
    const redistribution = crowdRedistribution.find(r => r.gateId === gate.id);
    if (redistribution) {
      const waitChange = waitTimeChanges.find(w => w.gateId === gate.id);
      return {
        ...gate,
        currentLoad: redistribution.newTotalLoad,
        baseWaitMinutes: waitChange?.newWaitMinutes ?? gate.baseWaitMinutes,
      };
    }
    return gate;
  });

  const overloadedGates = crowdRedistribution
    .filter(r => r.capacityUtilization > 0.9)
    .map(r => r.gateId);

  const peakLoadGate = crowdRedistribution.reduce(
    (peak, r) => (r.capacityUtilization > peak.capacityUtilization ? r : peak),
    crowdRedistribution[0],
  );

  return {
    scenario,
    affectedGateId,
    affectedGateName: affectedGate.name,
    crowdRedistribution,
    waitTimeChanges,
    transportImpact,
    staffingGaps,
    beforeState,
    afterState,
    peakLoadGateId: peakLoadGate.gateId,
    overloadedGates,
  };
}

function resolveGateId(location: string, state: StadiumState): string {
  const normalized = location.toLowerCase().replace(/[^a-z0-9]/g, '');

  const directMatch = state.gates.find(g => g.id === location);
  if (directMatch) return directMatch.id;

  const gateNumberMatch = normalized.match(/(?:gate|g)(\d+)/);
  if (gateNumberMatch) {
    const gateId = `gate-${gateNumberMatch[1]}`;
    if (state.gates.find(g => g.id === gateId)) {
      return gateId;
    }
  }

  const directionMap: Record<string, string> = {
    north: 'gate-1', northeast: 'gate-2', ne: 'gate-2',
    east: 'gate-3', southeast: 'gate-4', se: 'gate-4',
    south: 'gate-5', southwest: 'gate-6', sw: 'gate-6',
    west: 'gate-7', northwest: 'gate-8', nw: 'gate-8',
  };
  for (const [dir, gateId] of Object.entries(directionMap)) {
    if (normalized.includes(dir)) return gateId;
  }

  console.warn(`Could not resolve location "${location}", defaulting to gate-3`);
  return 'gate-3';
}
