/**
 * StadiumOS AI — Reasoning Layer (Step 3)
 *
 * Takes SIMULATION OUTPUT and produces an explainable action plan
 * with computed confidence scores.
 */

import type {
  SimulationResult,
  ReasoningOutput,
  ConfidenceBreakdown,
  Alternative,
} from '../../src/types/scenarioSimulator.js';

export function computeConfidence(simulation: SimulationResult): ConfidenceBreakdown {
  const W_RECENCY = 0.3;
  const W_MAGNITUDE = 0.4;
  const W_SIMILARITY = 0.3;

  const dataAgeMinutes = 2;
  const dataRecencyScore = Math.max(0, Math.min(1, 1 - dataAgeMinutes / 60));

  const maxUtilization = Math.max(
    ...simulation.crowdRedistribution.map(r => r.capacityUtilization),
  );
  const disruptionMagnitude = Math.max(0, Math.min(1, (maxUtilization - 0.8) / 1.2));

  const historicalSimilarityMap: Record<string, number> = {
    gate_closure: 0.92,
    medical_emergency: 0.85,
    weather_event: 0.70,
    vip_arrival: 0.80,
    equipment_failure: 0.65,
    crowd_surge: 0.55,
    power_outage: 0.50,
    security_threat: 0.40,
  };
  const historicalSimilarityScore =
    historicalSimilarityMap[simulation.scenario.trigger] ?? 0.5;

  const composite =
    W_RECENCY * dataRecencyScore +
    W_MAGNITUDE * (1 - disruptionMagnitude) +
    W_SIMILARITY * historicalSimilarityScore;

  return {
    dataRecencyScore: round3(dataRecencyScore),
    magnitudeScore: round3(disruptionMagnitude),
    historicalSimilarityScore,
    composite: round3(Math.max(0, Math.min(1, composite))),
  };
}

export const REASONER_PROMPT_TEMPLATE = `You are an expert FIFA World Cup stadium operations advisor. You have received SIMULATION DATA from a deterministic crowd flow model. Your job is to interpret these results and create an actionable response plan.

IMPORTANT RULES:
1. Your reasoning MUST cite specific numbers from the simulation data (wait times, utilization percentages, people counts)
2. Return ONLY a valid JSON object — no markdown, no code fences, no explanation outside JSON
3. The action_plan should be ordered by priority (most urgent first)
4. Each alternative must include a concrete tradeoff

Return this exact JSON structure:
{
  "action_plan": string[],        // 4-6 prioritized action items
  "reasoning": string,            // 2-3 sentences citing specific simulation values
  "risk_level": "low"|"medium"|"high",
  "alternatives": [               // 2-3 alternatives
    { "action": string, "tradeoff": string }
  ]
}

Here is the simulation data to interpret:
`;

export async function reasonWithGemini(
  simulation: SimulationResult,
  confidence: ConfidenceBreakdown,
  apiKey: string,
): Promise<ReasoningOutput> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');

  const genAI = new GoogleGenerativeAI(apiKey);

  const reasoningOutputSchema = {
    type: 'object',
    properties: {
      action_plan: {
        type: 'array',
        items: { type: 'string' },
        description: '4-6 prioritized action items ordered by urgency.'
      },
      reasoning: {
        type: 'string',
        description: '2-3 sentences interpreting the simulation results and citing specific metrics.'
      },
      risk_level: {
        type: 'string',
        description: 'Operational risk assessment. One of: low, medium, high'
      },
      alternatives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'Contingency plan action item.' },
            tradeoff: { type: 'string', description: 'Tradeoff associated with this action.' }
          },
          required: ['action', 'tradeoff']
        }
      }
    },
    required: ['action_plan', 'reasoning', 'risk_level', 'alternatives']
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 800,
      responseMimeType: 'application/json',
      responseSchema: reasoningOutputSchema as any,
    },
  });

  const simulationSummary = buildSimulationSummary(simulation, confidence);

  const result = await model.generateContent(REASONER_PROMPT_TEMPLATE + simulationSummary);
  const responseText = result.response.text().trim();

  try {
    const parsed = JSON.parse(responseText);
    return {
      action_plan: parsed.action_plan ?? [],
      confidence: confidence.composite,
      confidenceBreakdown: confidence,
      reasoning: parsed.reasoning ?? '',
      risk_level: parsed.risk_level ?? 'medium',
      alternatives: parsed.alternatives ?? [],
    };
  } catch {
    console.error('Failed to parse Gemini reasoning response:', responseText);
    return generateDemoReasoning(simulation, confidence);
  }
}

export function generateDemoReasoning(
  simulation: SimulationResult,
  confidence: ConfidenceBreakdown,
): ReasoningOutput {
  const { scenario, crowdRedistribution, waitTimeChanges, transportImpact, staffingGaps } = simulation;

  const peakGate = crowdRedistribution.reduce(
    (max, r) => (r.capacityUtilization > max.capacityUtilization ? r : max),
    crowdRedistribution[0],
  );

  const maxWaitChange = waitTimeChanges.reduce(
    (max, w) => (w.deltaMinutes > max.deltaMinutes ? w : max),
    waitTimeChanges[0],
  );

  const riskLevel = peakGate.capacityUtilization > 1.1
    ? 'high'
    : peakGate.capacityUtilization > 0.9
      ? 'medium'
      : 'low';

  const activeGaps = staffingGaps.filter(s => s.gap > 0);
  const totalGap = activeGaps.reduce((sum, s) => sum + s.gap, 0);

  const confidencePercent = Math.round(confidence.composite * 100);
  const confidenceExplanation = `System confidence is at ${confidencePercent}% as standard response procedures align with ${scenario.trigger.replace(/_/g, ' ')} events, despite local high-utilization surge risks introducing some prediction variance at ${peakGate.gateName}.`;

  const reasoning = [
    `Closing ${simulation.affectedGateName} (current load: ${simulation.beforeState.gates.find(g => g.id === simulation.affectedGateId)?.currentLoad} people/min) redirects crowd to ${crowdRedistribution.length} adjacent gates.`,
    `${peakGate.gateName} faces the highest impact, reaching ${(peakGate.capacityUtilization * 100).toFixed(1)}% capacity utilization (${peakGate.newTotalLoad} people/min vs ${peakGate.originalLoad} baseline).`,
    `Maximum wait time increase of +${maxWaitChange.deltaMinutes} min occurs at ${maxWaitChange.gateName} (${maxWaitChange.originalWaitMinutes} → ${maxWaitChange.newWaitMinutes} min). ${totalGap} additional volunteers are needed across affected gates.`,
    confidenceExplanation,
  ].join(' ');

  const actionPlan: string[] = [];

  actionPlan.push(
    `IMMEDIATE: Deploy crowd control team to ${simulation.affectedGateName} to manage the ${scenario.trigger.replace('_', ' ')} and redirect incoming foot traffic.`
  );

  if (activeGaps.length > 0) {
    actionPlan.push(
      `URGENT: Reassign ${totalGap} volunteers to reinforcement positions — ${activeGaps.map(s => `${s.gap} to ${s.gateName}`).join(', ')}.`
    );
  }

  actionPlan.push(
    `WITHIN 2 MIN: Activate digital signage at ${simulation.affectedGateName} directing fans to ${crowdRedistribution.map(r => r.gateName).join(' and ')}. Update the stadium app with real-time wait times.`
  );

  if (transportImpact.estimatedAdditionalShuttlesNeeded > 0) {
    actionPlan.push(
      `WITHIN 5 MIN: Dispatch ${transportImpact.estimatedAdditionalShuttlesNeeded} additional shuttle(s) to absorb ${transportImpact.shuttleLoadDelta} displaced fans seeking transport alternatives.`
    );
  }

  actionPlan.push(
    `ONGOING: Monitor ${peakGate.gateName} closely — at ${(peakGate.capacityUtilization * 100).toFixed(0)}% utilization, it ${peakGate.capacityUtilization > 0.9 ? 'is at risk of overload' : 'has limited surge capacity'}. Prepare contingency to throttle if wait exceeds ${Math.ceil(maxWaitChange.newWaitMinutes + 2)} min.`
  );

  actionPlan.push(
    `WITHIN ${scenario.time_horizon_minutes} MIN: Brief operations command on scenario resolution. If ${simulation.affectedGateName} cannot reopen within ${scenario.time_horizon_minutes} minutes, escalate to activate secondary redistribution to non-adjacent gates.`
  );

  const alternatives: Alternative[] = [
    {
      action: `Open emergency exit near ${simulation.affectedGateName} as a temporary one-way entry point`,
      tradeoff: `Reduces security screening coverage by ~15% at that entry — requires 2 additional security personnel and bag-check station.`,
    },
    {
      action: `Temporarily close ${peakGate.gateName} to create a controlled two-gate redistribution across 4 gates instead of 2`,
      tradeoff: `Spreads load more evenly but closes another entry point, reducing total stadium throughput by ${Math.round(peakGate.originalLoad / 8.75 * 10) / 10}% during the redistribution window.`,
    },
    {
      action: `Delay match kickoff by 5 minutes to extend the ingress window`,
      tradeoff: `Requires FIFA coordinator approval. Eliminates time pressure but has broadcast schedule implications and may cause confusion for seated fans.`,
    },
  ];

  return {
    action_plan: actionPlan,
    confidence: confidence.composite,
    confidenceBreakdown: confidence,
    reasoning,
    risk_level: riskLevel,
    alternatives,
  };
}

function buildSimulationSummary(
  simulation: SimulationResult,
  confidence: ConfidenceBreakdown,
): string {
  const lines: string[] = [
    `SCENARIO: ${simulation.scenario.trigger} at ${simulation.affectedGateName}`,
    `SEVERITY: ${simulation.scenario.severity}`,
    `TIME HORIZON: ${simulation.scenario.time_horizon_minutes} minutes`,
    ``,
    `CROWD REDISTRIBUTION:`,
    ...simulation.crowdRedistribution.map(r =>
      `  ${r.gateName}: ${r.originalLoad} → ${r.newTotalLoad} people/min (${(r.capacityUtilization * 100).toFixed(1)}% capacity, +${r.redirectedLoad} redirected)`
    ),
    ``,
    `WAIT TIME CHANGES:`,
    ...simulation.waitTimeChanges.filter(w => w.deltaMinutes > 0).map(w =>
      `  ${w.gateName}: ${w.originalWaitMinutes} → ${w.newWaitMinutes} min (+${w.deltaMinutes} min)`
    ),
    ``,
    `TRANSPORT IMPACT:`,
    `  Shuttle demand increase: ${simulation.transportImpact.shuttleLoadDelta} people`,
    `  Additional shuttles needed: ${simulation.transportImpact.estimatedAdditionalShuttlesNeeded}`,
    `  Parking utilization: ${(simulation.transportImpact.newParkingUtilization * 100).toFixed(1)}%`,
    ``,
    `STAFFING GAPS:`,
    ...simulation.staffingGaps.map(s =>
      `  ${s.gateName}: ${s.currentVolunteers} assigned, ${s.requiredVolunteers} needed (gap: ${s.gap})`
    ),
    ``,
    `OVERLOADED GATES (>90%): ${simulation.overloadedGates.length > 0 ? simulation.overloadedGates.join(', ') : 'None'}`,
    `PEAK LOAD GATE: ${simulation.peakLoadGateId}`,
    `CONFIDENCE SCORE: ${confidence.composite} (recency: ${confidence.dataRecencyScore}, magnitude: ${confidence.magnitudeScore}, historical: ${confidence.historicalSimilarityScore})`,
  ];

  return lines.join('\n');
}

export async function generateReasoning(
  simulation: SimulationResult,
  apiKey?: string,
): Promise<ReasoningOutput> {
  const confidence = computeConfidence(simulation);

  if (apiKey) {
    try {
      return await reasonWithGemini(simulation, confidence, apiKey);
    } catch (error) {
      console.warn('⚠ Gemini reasoning failed, falling back to demo mode:', error);
      return generateDemoReasoning(simulation, confidence);
    }
  }

  console.log('ℹ No GEMINI_API_KEY set — using demo reasoner');
  return generateDemoReasoning(simulation, confidence);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
