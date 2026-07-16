/**
 * StadiumOS AI — Query Parser (Step 1)
 *
 * Converts natural language "what-if" questions into structured ScenarioInput.
 * Uses Gemini when API key is available, falls back to keyword-based parsing.
 */

import type { ScenarioInput } from '../../src/types/scenarioSimulator.js';

export const PARSER_PROMPT_TEMPLATE = `You are a scenario parser for a FIFA World Cup 2026 stadium operations AI system.

Your job: Convert a natural language "what-if" question into a structured JSON object that can be fed into a crowd simulation model.

Return ONLY a valid JSON object with exactly these fields — no markdown, no explanation, no code fences:
{
  "trigger": string,           // One of: "gate_closure", "medical_emergency", "weather_event", "security_threat", "power_outage", "crowd_surge", "vip_arrival", "equipment_failure"
  "location": string,          // Stadium location in format "gate-N" where N is 1-8
  "affected_entity": string,   // What is affected: "gate", "section", "parking", "concourse", "field"
  "time_horizon_minutes": number, // How many minutes to simulate forward (extract from query, default 15 if not specified)
  "severity": string           // One of: "low", "medium", "high", "critical" — infer from the situation described
}

Examples:

User: "What happens if Gate 3 closes due to a medical emergency in the next 10 minutes?"
{"trigger":"medical_emergency","location":"gate-3","affected_entity":"gate","time_horizon_minutes":10,"severity":"high"}

User: "What if there's a sudden rainstorm and Gate 7 needs to close?"
{"trigger":"weather_event","location":"gate-7","affected_entity":"gate","time_horizon_minutes":15,"severity":"medium"}

User: "Simulate a security threat at Gate 1 for the next 30 minutes"
{"trigger":"security_threat","location":"gate-1","affected_entity":"gate","time_horizon_minutes":30,"severity":"critical"}

User: "Gate 5 has a power outage, what happens in 20 minutes?"
{"trigger":"power_outage","location":"gate-5","affected_entity":"gate","time_horizon_minutes":20,"severity":"high"}

Now parse this question (return ONLY the JSON object):
`;

export async function parseWithGemini(
  query: string,
  apiKey: string,
): Promise<ScenarioInput> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 200,
    },
  });

  const result = await model.generateContent(PARSER_PROMPT_TEMPLATE + query);
  const responseText = result.response.text().trim();

  const jsonString = responseText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(jsonString);
    return validateScenarioInput(parsed);
  } catch {
    console.error('Failed to parse Gemini response as JSON:', responseText);
    throw new Error('Gemini returned invalid JSON. Raw response: ' + responseText);
  }
}

export function parseDemo(query: string): ScenarioInput {
  const q = query.toLowerCase();

  const gateMatch = q.match(/gate\s*(\d+)/i);
  const gateNumber = gateMatch ? parseInt(gateMatch[1], 10) : 3;
  const location = `gate-${Math.min(8, Math.max(1, gateNumber))}`;

  const timeMatch = q.match(/(\d+)\s*min/i);
  const nextMatch = q.match(/next\s+(\d+)/i);
  const timeHorizon = timeMatch
    ? parseInt(timeMatch[1], 10)
    : nextMatch
      ? parseInt(nextMatch[1], 10)
      : 15;

  let trigger = 'gate_closure';
  if (q.includes('medical') || q.includes('injury') || q.includes('ambulance') || q.includes('health')) {
    trigger = 'medical_emergency';
  } else if (q.includes('weather') || q.includes('rain') || q.includes('storm') || q.includes('lightning')) {
    trigger = 'weather_event';
  } else if (q.includes('security') || q.includes('threat') || q.includes('suspicious') || q.includes('bomb')) {
    trigger = 'security_threat';
  } else if (q.includes('power') || q.includes('outage') || q.includes('electrical') || q.includes('blackout')) {
    trigger = 'power_outage';
  } else if (q.includes('crowd') || q.includes('surge') || q.includes('stampede') || q.includes('crush')) {
    trigger = 'crowd_surge';
  } else if (q.includes('vip') || q.includes('president') || q.includes('dignitary') || q.includes('celebrity')) {
    trigger = 'vip_arrival';
  } else if (q.includes('equipment') || q.includes('broken') || q.includes('malfunction')) {
    trigger = 'equipment_failure';
  }

  let severity: ScenarioInput['severity'] = 'medium';
  if (trigger === 'security_threat' || q.includes('critical') || q.includes('emergency') || q.includes('urgent')) {
    severity = 'critical';
  } else if (trigger === 'medical_emergency' || q.includes('serious') || q.includes('major')) {
    severity = 'high';
  } else if (q.includes('minor') || q.includes('small') || q.includes('brief')) {
    severity = 'low';
  }

  return {
    trigger,
    location,
    affected_entity: 'gate',
    time_horizon_minutes: Math.max(1, Math.min(60, timeHorizon)),
    severity,
  };
}

function validateScenarioInput(input: Record<string, unknown>): ScenarioInput {
  const validSeverities: ScenarioInput['severity'][] = ['low', 'medium', 'high', 'critical'];
  const severity = validSeverities.includes(input.severity as ScenarioInput['severity'])
    ? (input.severity as ScenarioInput['severity'])
    : 'medium';

  return {
    trigger: String(input.trigger || 'gate_closure'),
    location: String(input.location || 'gate-3'),
    affected_entity: String(input.affected_entity || 'gate'),
    time_horizon_minutes: Math.max(1, Math.min(60, Number(input.time_horizon_minutes) || 15)),
    severity,
  };
}

export async function parseQuery(
  query: string,
  apiKey?: string,
): Promise<ScenarioInput> {
  if (apiKey) {
    try {
      return await parseWithGemini(query, apiKey);
    } catch (error) {
      console.warn('⚠ Gemini parser failed, falling back to demo parser:', error);
      return parseDemo(query);
    }
  }

  console.log('ℹ No GEMINI_API_KEY set — using demo parser');
  return parseDemo(query);
}
