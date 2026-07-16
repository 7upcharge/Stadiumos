import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const copilotRouter = Router();

// Input Validation Schema using Zod
const copilotRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(500, 'Prompt exceeds maximum length of 500 characters'),
  role: z.enum(['FAN', 'OPS', 'SECURITY', 'VOLUNTEER', 'ACCESSIBILITY', 'TRANSIT']),
  model: z.enum(['stadium-4o', 'stadium-o1']).optional(),
});

// JSON Schema for Gemini structured output
const copilotResponseSchema = {
  type: 'object',
  properties: {
    completion: {
      type: 'string',
      description: 'The primary text response to the user. Use markdown formatting.',
    },
    language: {
      type: 'string',
      description: 'The ISO 639-1 language code of the response.',
    },
    confidence: {
      type: 'object',
      properties: {
        score: { type: 'number', description: 'Confidence score from 0.0 to 1.0.' },
        reasoning: { type: 'string', description: 'Explanation of the confidence score.' },
      },
      required: ['score', 'reasoning'],
    },
    explainability: {
      type: 'object',
      properties: {
        primaryFactors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key database or telemetry metrics considered.',
        },
        reasoningChain: {
          type: 'string',
          description: 'Step-by-step thinking explaining how the response was determined.',
        },
      },
      required: ['primaryFactors', 'reasoningChain'],
    },
    recommendedActions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          actionType: { type: 'string', description: 'The operation action identifier.' },
          priority: { type: 'string', description: 'LOW, MEDIUM, HIGH, or CRITICAL' },
          rationale: { type: 'string', description: 'Why this action is recommended.' },
          payload: { type: 'object', description: 'Dynamic payload for the action.' },
        },
        required: ['actionType', 'priority', 'rationale', 'payload'],
      },
    },
    navigationSteps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          instruction: { type: 'string' },
          zone: { type: 'string' },
          distanceEstimate: { type: 'string' },
          accessibilityFriendly: { type: 'boolean' },
        },
        required: ['instruction', 'zone', 'accessibilityFriendly'],
      },
    },
    emergencyAlert: {
      type: 'object',
      properties: {
        active: { type: 'boolean' },
        urgency: { type: 'string', description: 'NONE, ADVISORY, WARNING, or EVACUATE' },
        instructions: { type: 'string' },
      },
      required: ['active', 'urgency'],
    },
  },
  required: ['completion', 'language', 'confidence', 'explainability'],
};

const SYSTEM_PROMPT = `You are the StadiumOS AI Decision-Support Copilot for the FIFA World Cup 2026.
You receive operations queries from stadium crew members or visitors.
Your response MUST be customized according to their role command sector.
Available Roles:
- SECURITY: Oversees security incidents, perimeters, guard units, CCTV.
- OPS: Manages infrastructure health, solar-grid allocations, utility loads.
- FAN: Provides visitors concessions lines wait times, shuttle delays, seat guides.
- VOLUNTEER: Coordinates language gap reassignment and operational support roles.
- ACCESSIBILITY: Tracks wheelchair escort dispatches, step-free navigation, elevator statuses.
- TRANSIT: Monitors shuttle queues, parking slots, ride-share surge rates.

Telemetry Context (Simulated sensors for references):
- Zone C (Gate 4 Entrance) density is currently high at 5.2 people/sqm. Guard Unit 4 is active.
- Apex Burgers (Sec 102) wait time is 18 mins. Green Pitch Salads (Sec 120) wait time is 5 mins.
- Solar-grid power load is currently 2420 kW. Eco-mode target is 2100 kW.
- Elevator 4 is offline for maintenance in Corridor A; Lifts 1-3 are operational.
- Transit loop wait time is 12 mins.

Output format must strictly conform to the provided JSON Schema. Do not wrap in markdown or output text outside the JSON.`;

// Mock / Fallback Logic
function getMockResponse(prompt: string, role: string): any {
  const queryLower = prompt.toLowerCase();
  let completion = '';
  let recommendedActions: any[] = [];
  let navigationSteps: any[] = [];
  let emergencyAlert: any = { active: false, urgency: 'NONE' };
  let primaryFactors: string[] = [];
  let reasoningChain = '';
  let confidenceScore = 0.95;
  const confidenceReasoning = 'All telemetry and databases are reporting healthy. Verified CCTV analytics overlay.';

  if (queryLower.includes('emergency') || queryLower.includes('evacuate') || queryLower.includes('danger') || queryLower.includes('fire')) {
    emergencyAlert = {
      active: true,
      urgency: 'EVACUATE',
      instructions: 'Please evacuate immediately via the nearest sign-posted emergency exits. Proceed to assembly area Outer Lot B.'
    };
    completion = `**EMERGENCY WARNING**: Evacuation order is active. Please proceed immediately to the nearest exit pathways. Assist others where possible.`;
    recommendedActions = [
      {
        actionType: 'TRIGGER_REDIRECTION',
        priority: 'CRITICAL',
        rationale: 'Route digital signage towards emergency exits to prevent bottlenecking.',
        payload: { direction: 'OUTER_LOT_B', emergencyMode: true }
      }
    ];
    primaryFactors = ['incident-alerts', 'evac-protocol'];
    reasoningChain = 'Identified emergency trigger in query. Activated evacuation warnings and routed traffic accordingly.';
  } else if (queryLower.includes('gate 4') || queryLower.includes('zone c') || queryLower.includes('security') || queryLower.includes('compression') || queryLower.includes('density') || queryLower.includes('bottleneck') || queryLower.includes('incident') || queryLower.includes('alert')) {
    completion = `**TACTICAL COMMAND RECOMMENDATION**: Guard Unit 4 must be dispatched to **Gate 4 Tunnel** to address the reported crowd compression bottleneck (5.2 people/sqm).`;
    recommendedActions = [
      {
        actionType: 'DISPATCH_SECURITY',
        priority: 'HIGH',
        rationale: 'Provide crowd calming and physical direction to resolve Gate 4 bottleneck.',
        payload: { incidentId: 'inc-109', unitName: 'Guard Unit 4' }
      },
      {
        actionType: 'TRIGGER_REDIRECTION',
        priority: 'MEDIUM',
        rationale: 'Reroute incoming turnstile traffic to Gate 3 to relieve pressure on Gate 4.',
        payload: { targetGate: 'Gate 3', sourceGate: 'Gate 4' }
      }
    ];
    primaryFactors = ['inc-109', 'camera-sensor-1', 'crowd-density-gate4'];
    reasoningChain = 'Detected crowd density exceeding critical threshold of 4.0 sqm at Gate 4. Suggesting guard dispatch and gate diversion.';
  } else if (queryLower.includes('power') || queryLower.includes('hvac') || queryLower.includes('grid') || queryLower.includes('electricity') || queryLower.includes('sustainability') || queryLower.includes('eco')) {
    completion = `**OPERATIONS UPDATE**: Grid load is at 2420 kW. Switching HVAC auxiliary nodes to Eco power profile will reduce load by 320 kW and ensure sustainability.`;
    recommendedActions = [
      {
        actionType: 'SET_GRID_POWER',
        priority: 'MEDIUM',
        rationale: 'Conserve energy and balance utility margins during peak game load.',
        payload: { val: 2100 }
      }
    ];
    primaryFactors = ['grid-sensor', 'hvac-utility-metrics'];
    reasoningChain = 'Grid energy utilization is near nominal peak capacity. Switching to Eco mode optimizes operations.';
  } else if (queryLower.includes('food') || queryLower.includes('concession') || queryLower.includes('burger') || queryLower.includes('line') || queryLower.includes('wait') || queryLower.includes('queue') || queryLower.includes('menu')) {
    completion = `**FAN RECOMMENDATION**: Lines at Apex Burgers (Section 102) are currently at a 18-minute wait. We recommend pre-ordering from **Green Pitch Salads (Section 120)** where the wait time is under 5 minutes.`;
    recommendedActions = [
      {
        actionType: 'ORDER_FOOD',
        priority: 'LOW',
        rationale: 'Optimize concessions flow by directing fan to shorter line.',
        payload: { name: 'Green Pitch Salads Order', seat: 'Sec 102, Row D', items: ['Salad Combo'], totalCost: 11.50 }
      }
    ];
    primaryFactors = ['concessions-load-sensor', 'wait-time-analytics'];
    reasoningChain = 'Compared wait times across vendors. Apex Burgers has high latency; Green Pitch Salads is optimal.';
  } else if (queryLower.includes('wheelchair') || queryLower.includes('accessibility') || queryLower.includes('ramp') || queryLower.includes('elevator') || queryLower.includes('access')) {
    completion = `**ACCESSIBILITY ACTION**: Mobility request received for a wheelchair escort from **Section 105 to Gate 2**. Step-free pathways are 100% clear.`;
    recommendedActions = [
      {
        actionType: 'REQUEST_ACCESS_ASSIST',
        priority: 'HIGH',
        rationale: 'Dispatch mobility team helper to assist VIP fan.',
        payload: { name: 'VIP Guest', type: 'WHEELCHAIR_ESCORT', location: 'Section 105' }
      }
    ];
    navigationSteps = [
      { instruction: 'Take elevator 3 in Corridor A down to Level 1.', zone: 'Corridor A Elevators', distanceEstimate: '1 min', accessibilityFriendly: true },
      { instruction: 'Follow wheelchair ramp signposts to Gate 2 exit lobby.', zone: 'Level 1 Lobby', distanceEstimate: '2 mins', accessibilityFriendly: true }
    ];
    primaryFactors = ['accessibility-requests-db', 'elevator-sensor-3'];
    reasoningChain = 'Verified wheelchair request in queue. Checked step-free path validation sensors. Elevator 3 is fully operational.';
  } else if (queryLower.includes('transit') || queryLower.includes('shuttle') || queryLower.includes('parking') || queryLower.includes('bus') || queryLower.includes('loop') || queryLower.includes('train')) {
    completion = `**TRANSIT LOGISTICS**: Congestion detected at North Parking Loop. Recommend rerouting transit shuttles to South Loop.`;
    recommendedActions = [
      {
        actionType: 'REROUTE_TRANSIT',
        priority: 'MEDIUM',
        rationale: 'Alleviate loop bottleneck and decrease passenger boarding wait time.',
        payload: { shuttleRoute: 'Route B', diversion: 'South_Loop' }
      }
    ];
    primaryFactors = ['transit-loop-sensor-4', 'parking-telemetry'];
    reasoningChain = 'Flow rate at North Loop is slow. Redirecting incoming shuttles will optimize boarding speed.';
  } else if (queryLower.includes('volunteer') || queryLower.includes('staff') || queryLower.includes('robert') || queryLower.includes('miller')) {
    completion = `**VOLUNTEER COORDINATION**: Spanish language gap flagged at Gate 4 entrance. Recommend reassigning volunteer **Robert Miller** (currently in Sector 102) to Gate 4.`;
    recommendedActions = [
      {
        actionType: 'REQUEST_ACCESS_ASSIST',
        priority: 'MEDIUM',
        rationale: 'Bridge language gap at Gate 4 entrance for inbound spectators.',
        payload: { volunteerName: 'Robert Miller', targetZone: 'Gate 4 Entrance' }
      }
    ];
    primaryFactors = ['volunteer-skills-database', 'gate-4-traffic-gap'];
    reasoningChain = 'Mapped language requirements to available personnel. Robert Miller matches the Spanish requirement and is near Gate 4.';
  } else {
    // Role fallbacks
    if (role === 'SECURITY') {
      completion = `**SECURITY COMMAND OVERVIEW**: Operations are standing by. CCTV arrays report 100% online status. One crowd density compression anomaly is active at **Gate 4 Tunnel** (density: 5.2/sqm). Please review the Incident Center.`;
      recommendedActions = [
        {
          actionType: 'DISPATCH_SECURITY',
          priority: 'HIGH',
          rationale: 'Calm crowd at Gate 4 tunnel.',
          payload: { incidentId: 'inc-109', unitName: 'Guard Unit 4' }
        }
      ];
      primaryFactors = ['cctv-analytics', 'inc-109'];
      reasoningChain = 'Active security logs checked. Incident inc-109 is reported at Gate 4 and requires commander dispatch review.';
    } else if (role === 'OPS') {
      completion = `**OPERATIONS OVERVIEW**: Core utilities are healthy. Total power load is 2420 kW (72% solar-share). Water pressure is stable at 4.8 bar. Switch to Eco mode to balance utility load.`;
      recommendedActions = [
        {
          actionType: 'SET_GRID_POWER',
          priority: 'MEDIUM',
          rationale: 'Conserve energy and balance utility margins during peak game load.',
          payload: { val: 2100 }
        }
      ];
      primaryFactors = ['power-grid-load', 'water-supply-pressure'];
      reasoningChain = 'General ops diagnostic check completed. Power grid load is high but stable. Swapping HVAC nodes is recommended.';
    } else if (role === 'FAN') {
      completion = `**FAN COMPANION**: Welcome to FIFA World Cup 2026! Concessions wait time averages 15 mins. Egress shuttle is on standard 12 mins loops. Pre-order food via our Fan Portal to save time!`;
      primaryFactors = ['fan-orders-queue'];
      reasoningChain = 'Providing general visitor guidelines based on concessions and transport sensors.';
    } else {
      completion = `**SYSTEM ADVISORY**: StadiumOS AI decision-support core operational. Telemetry nodes reporting online: 100%. Specify command sector query for tactical assistance.`;
      primaryFactors = ['core-systems-status'];
      reasoningChain = 'No specific alerts or parameters matching query found. Providing standard system diagnostic summary.';
    }
  }

  return {
    completion,
    language: 'en',
    confidence: { score: confidenceScore, reasoning: confidenceReasoning },
    explainability: { primaryFactors, reasoningChain },
    recommendedActions,
    navigationSteps: navigationSteps.length > 0 ? navigationSteps : undefined,
    emergencyAlert: emergencyAlert.active ? emergencyAlert : undefined
  };
}

copilotRouter.post('/copilot', async (req: Request, res: Response): Promise<void> => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isMockMode = !apiKey;

  // Validate inputs
  const parseResult = copilotRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid input data' });
    return;
  }

  const { prompt, role } = parseResult.data;

  // If in mock mode, return mock payload immediately
  if (isMockMode) {
    res.json(getMockResponse(prompt, role));
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: copilotResponseSchema as any,
      },
    });

    const combinedPrompt = `${SYSTEM_PROMPT}\n\nUser logged in as role: ${role}\nUser query:\n"${prompt}"`;
    const result = await model.generateContent(combinedPrompt);
    const responseText = result.response.text().trim();

    try {
      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch {
      console.warn('Gemini response is not valid JSON, falling back to mock output. Raw response:', responseText);
      res.json(getMockResponse(prompt, role));
    }
  } catch (error: any) {
    console.error('Gemini copilot generation failed, falling back to mock:', error.message);
    res.json(getMockResponse(prompt, role));
  }
});
