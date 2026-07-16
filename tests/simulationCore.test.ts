import { describe, it, expect } from 'vitest';
import { 
  runSimulation, 
  redistributeCrowd, 
  computeWaitTimes, 
  computeTransportImpact, 
  computeStaffingGap,
  getDefaultStadiumState
} from '../server/simulator/simulationCore.js';

describe('Simulation Engine Unit Tests', () => {
  it('should fetch the default stadium state correctly', () => {
    const state = getDefaultStadiumState();
    expect(state.gates).toHaveLength(8);
    expect(state.volunteers).toBe(420);
    expect(state.totalCapacity).toBe(82500);
  });

  it('should redistribute crowd correctly when a gate closes', () => {
    const state = getDefaultStadiumState();
    // Close Gate 3 and redistribute its current load (92 people/min) to Gate 2 and Gate 4
    const redirections = redistributeCrowd('gate-3', state);
    expect(redirections).toHaveLength(2); // adjacent: gate-2 and gate-4

    const g2 = redirections.find(r => r.gateId === 'gate-2');
    const g4 = redirections.find(r => r.gateId === 'gate-4');

    expect(g2).toBeDefined();
    expect(g4).toBeDefined();

    // Verify redirected load matches proportion of adjacent capacities
    // Total adjacent capacity = 100 (gate-2) + 95 (gate-4) = 195
    // gate-2 share = 100/195 * 92 = 47.17 => ~47.2
    // gate-4 share = 95/195 * 92 = 44.82 => ~44.8
    expect(g2!.redirectedLoad).toBeCloseTo(47.2, 1);
    expect(g4!.redirectedLoad).toBeCloseTo(44.8, 1);
    expect(g2!.newTotalLoad).toBeCloseTo(72 + 47.2, 1);
    expect(g4!.newTotalLoad).toBeCloseTo(58 + 44.8, 1);
  });

  it('should compute wait time changes based on redirected load ratio', () => {
    const state = getDefaultStadiumState();
    const redirections = redistributeCrowd('gate-3', state);
    const waitTimes = computeWaitTimes(redirections, state);

    // Gate 2 original wait was 3.5 mins, capacity 100
    // redirected load is ~47.2
    // wait time increases by: 3.5 * (1 + 47.2/100) = 5.15 => ~5.2 mins
    const g2Wait = waitTimes.find(w => w.gateId === 'gate-2');
    expect(g2Wait).toBeDefined();
    expect(g2Wait!.originalWaitMinutes).toBe(3.5);
    expect(g2Wait!.newWaitMinutes).toBeCloseTo(5.2, 1);
    expect(g2Wait!.deltaMinutes).toBeCloseTo(1.7, 1);
  });

  it('should compute transport impacts accurately', () => {
    const state = getDefaultStadiumState();
    const redirections = redistributeCrowd('gate-3', state);
    const transport = computeTransportImpact(redirections, state);

    // Total load redirected = 92
    // shuttleLoadDelta = 92 * 0.15 = 13.8 => 14
    // parkingLoadDelta = 92 * 0.08 = 7.36 => 7
    // additional shuttles = ceil(14 / 45) = 1
    // new parking util = (0.76 * 12000 + 7) / 12000 = 0.7605 => 0.761
    expect(transport.shuttleLoadDelta).toBe(14);
    expect(transport.parkingLoadDelta).toBe(7);
    expect(transport.estimatedAdditionalShuttlesNeeded).toBe(1);
    expect(transport.newParkingUtilization).toBeCloseTo(0.761, 3);
  });

  it('should compute staffing gaps based on volunteer density scale', () => {
    const state = getDefaultStadiumState();
    const redirections = redistributeCrowd('gate-3', state);
    const staffing = computeStaffingGap(redirections, state);

    // Total load across open gates before closing gate-3 = 597
    // Gate 2 assigned volunteers = 420 * (72 / 625) = 48
    // Gate 2 new load = 72 + 47.2 = 119.2
    // Gate 2 required volunteers = ceil(119.2 * (420 / 625)) = 81
    // Gate 2 gap = 81 - 48 = 33
    const g2Staff = staffing.find(s => s.gateId === 'gate-2');
    expect(g2Staff).toBeDefined();
    expect(g2Staff!.currentVolunteers).toBe(48);
    expect(g2Staff!.requiredVolunteers).toBe(81);
    expect(g2Staff!.gap).toBe(33);
  });

  it('should run simulation end-to-end and shut down the affected gate', () => {
    const simulation = runSimulation({
      trigger: 'medical_emergency',
      location: 'gate-3',
      affected_entity: 'gate',
      time_horizon_minutes: 15,
      severity: 'high'
    });

    expect(simulation.affectedGateId).toBe('gate-3');
    expect(simulation.affectedGateName).toBe('Gate 3 (East)');

    // Verify Gate 3 is closed in afterState and load is 0
    const gate3After = simulation.afterState.gates.find(g => g.id === 'gate-3');
    expect(gate3After!.isOpen).toBe(false);
    expect(gate3After!.currentLoad).toBe(0);

    // Verify other gates absorbed the load
    const gate2After = simulation.afterState.gates.find(g => g.id === 'gate-2');
    expect(gate2After!.currentLoad).toBe(72 + 47.2); // ~119.2
  });
});
