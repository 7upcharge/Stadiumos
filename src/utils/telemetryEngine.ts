import type { TelemetryState, Incident, AccessibilityRequest, FanOrder } from '../types/telemetry';

let state: TelemetryState = {
  currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  totalAttendance: 68420,
  activeGates: 12,
  activeIncidents: [
    {
      id: "inc-109",
      title: "Crowd Compression at Gate 4 Tunnel",
      severity: "CRITICAL",
      status: "REPORTED",
      zone: "Zone C (Gate 4 Entrance)",
      description: "Crowd bottleneck forming at exit. Real-time density is 5.2 people/sqm. Security dispatch required.",
      timestamp: "11:58 AM",
      aiSuggested: [
        "Open auxiliary exit gate 4B to relieve queue pressure.",
        "Reroute incoming Fan Zone traffic to Gate 3 via digital signage alerts.",
        "Dispatch Guard Unit 4 (120m away) for crowd flow management."
      ],
      assignedUnits: []
    }
  ],
  resolvedIncidents: [],
  zones: {
    "Zone A (Main Concourse)": { crowdDensity: 1.8, temp: 21.5, waterFlow: 140, lightsStatus: "NORMAL" },
    "Zone B (VIP Suites)": { crowdDensity: 0.9, temp: 20.0, waterFlow: 85, lightsStatus: "NORMAL" },
    "Zone C (Gate 4 Entrance)": { crowdDensity: 5.2, temp: 24.1, waterFlow: 220, lightsStatus: "HIGH_LOAD" },
    "Zone D (South Stands)": { crowdDensity: 2.4, temp: 22.0, waterFlow: 110, lightsStatus: "NORMAL" },
    "Zone E (Transit Hub)": { crowdDensity: 3.1, temp: 19.5, waterFlow: 50, lightsStatus: "NORMAL" }
  },
  concessions: [
    { id: "c-1", name: "Apex Burgers (Sec 102)", waitTime: 18, stockLevel: 82, salesCount: 512, foodWasteSavedKg: 42.5 },
    { id: "c-2", name: "Copa Tacos (Sec 114)", waitTime: 24, stockLevel: 45, salesCount: 689, foodWasteSavedKg: 58.0 },
    { id: "c-3", name: "Green Pitch Salads (Sec 120)", waitTime: 5, stockLevel: 95, salesCount: 142, foodWasteSavedKg: 12.0 }
  ],
  infrastructure: {
    hvacHealth: 98,
    waterSupplyPressure: 4.8,
    powerGridLoadKw: 2420,
    elevatorStatus: { "Elevator 1": "OPERATIONAL", "Elevator 2": "OPERATIONAL", "Elevator 3": "OPERATIONAL", "Elevator 4": "MAINTENANCE" }
  },
  transit: {
    shuttleWaitTime: 12,
    parkingAvailable: 428,
    uberSurge: "1.4x",
    egressRates: { lightRail: 3200, buses: 1800, rideShare: 950 }
  },
  sustainability: {
    carbonFootprintTarget: 88,
    carbonFootprintActual: 79,
    compostBinFill: 64,
    recycleBinFill: 78,
    landfillBinFill: 38,
    greywaterRecycledLiters: 14820,
    greenEnergyShare: 72
  },
  accessibilityRequests: [
    { id: "req-1", userId: "usr-42", name: "Robert Miller", type: "Wheelchair Escort", status: "PENDING", location: "Gate 4 Drop-off" }
  ],
  fanOrders: []
};

type ObserverCallback = (state: TelemetryState) => void;
let observers: ObserverCallback[] = [];

const notifyObservers = () => {
  observers.forEach(callback => callback(state));
};

// Simulation Loop running every 3 seconds
setInterval(() => {
  state.currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  state.totalAttendance += Math.floor(Math.random() * 5) - 2;

  // Fluctuations in zones
  Object.keys(state.zones).forEach(key => {
    const z = state.zones[key];
    if (key !== "Zone C (Gate 4 Entrance)" || state.activeIncidents.length === 0) {
      z.crowdDensity = Math.max(0.2, +(z.crowdDensity + (Math.random() * 0.4 - 0.2)).toFixed(1));
    }
    z.temp = +(z.temp + (Math.random() * 0.2 - 0.1)).toFixed(1);
    z.waterFlow = Math.max(10, Math.floor(z.waterFlow + (Math.random() * 10 - 5)));
  });

  // Concessions fluctuations
  state.concessions.forEach(c => {
    c.waitTime = Math.max(1, Math.floor(c.waitTime + (Math.random() * 3 - 1.5)));
    c.stockLevel = Math.max(0, Math.floor(c.stockLevel - (Math.random() * 0.8)));
    c.salesCount += Math.floor(Math.random() * 2);
  });

  // Transit updates
  state.transit.shuttleWaitTime = Math.max(2, Math.floor(state.transit.shuttleWaitTime + (Math.random() * 2 - 1)));
  state.transit.parkingAvailable = Math.max(0, Math.floor(state.transit.parkingAvailable + (Math.random() * 6 - 4)));

  // Sustainability updates
  state.sustainability.greywaterRecycledLiters += Math.floor(Math.random() * 8) + 2;
  state.sustainability.compostBinFill = Math.min(100, +(state.sustainability.compostBinFill + Math.random() * 0.2).toFixed(1));
  state.sustainability.recycleBinFill = Math.min(100, +(state.sustainability.recycleBinFill + Math.random() * 0.3).toFixed(1));
  state.sustainability.landfillBinFill = Math.min(100, +(state.sustainability.landfillBinFill + Math.random() * 0.1).toFixed(1));

  notifyObservers();
}, 3000);

export const subscribeToTelemetry = (callback: ObserverCallback) => {
  observers.push(callback);
  callback(state);
  return () => {
    observers = observers.filter(cb => cb !== callback);
  };
};

export const getTelemetryState = () => state;

export const triggerAction = (actionType: string, payload: any) => {
  switch (actionType) {
    case "DISPATCH_SECURITY": {
      const { incidentId, unitName } = payload;
      state.activeIncidents = state.activeIncidents.map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status: "DISPATCHED",
            assignedUnits: [...inc.assignedUnits, unitName]
          };
        }
        return inc;
      });
      break;
    }
    case "RESOLVE_INCIDENT": {
      const { incidentId } = payload;
      const incident = state.activeIncidents.find(inc => inc.id === incidentId);
      if (incident) {
        state.activeIncidents = state.activeIncidents.filter(inc => inc.id !== incidentId);
        state.resolvedIncidents.push({
          ...incident,
          status: "RESOLVED",
          resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        if (incidentId === "inc-109") {
          state.zones["Zone C (Gate 4 Entrance)"].crowdDensity = 1.8;
        }
      }
      break;
    }
    case "CREATE_INCIDENT": {
      const { title, severity, zone, description } = payload;
      const newInc: Incident = {
        id: `inc-${Math.floor(100 + Math.random() * 900)}`,
        title,
        severity,
        status: "REPORTED",
        zone,
        description,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiSuggested: [
          `Send local ground volunteers to secure ${zone}.`,
          `Instruct nearby security cameras to focus on site.`
        ],
        assignedUnits: []
      };
      state.activeIncidents.unshift(newInc);
      if (severity === "CRITICAL" && state.zones[zone]) {
        state.zones[zone].crowdDensity = 5.5;
      }
      break;
    }
    case "ORDER_FOOD": {
      const { name, seat, items, totalCost } = payload;
      const newOrder: FanOrder = {
        id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        seat,
        items,
        totalCost,
        status: "PREPARING",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      state.fanOrders.unshift(newOrder);

      setTimeout(() => {
        state.fanOrders = state.fanOrders.map(o => {
          if (o.id === newOrder.id) {
            return { ...o, status: "READY_FOR_PICKUP" };
          }
          return o;
        });
        notifyObservers();
      }, 20000);
      break;
    }
    case "REQUEST_ACCESS_ASSIST": {
      const { name, type, location } = payload;
      const newReq: AccessibilityRequest = {
        id: `req-${Math.floor(10 + Math.random() * 90)}`,
        userId: `usr-${Math.floor(100 + Math.random() * 900)}`,
        name,
        type,
        location,
        status: "PENDING"
      };
      state.accessibilityRequests.unshift(newReq);

      setTimeout(() => {
        state.accessibilityRequests = state.accessibilityRequests.map(r => {
          if (r.id === newReq.id) {
            return { ...r, status: "DISPATCHED" };
          }
          return r;
        });
        notifyObservers();
      }, 8000);
      break;
    }
    case "RESOLVE_ACCESS_ASSIST": {
      const { reqId } = payload;
      state.accessibilityRequests = state.accessibilityRequests.filter(r => r.id !== reqId);
      break;
    }
    case "SET_GRID_POWER": {
      const { val } = payload;
      state.infrastructure.powerGridLoadKw = val;
      break;
    }
    case "TRIGGER_REDIRECTION": {
      state.zones["Zone C (Gate 4 Entrance)"].crowdDensity = +(state.zones["Zone C (Gate 4 Entrance)"].crowdDensity * 0.6).toFixed(1);
      state.zones["Zone D (South Stands)"].crowdDensity = +(state.zones["Zone D (South Stands)"].crowdDensity + 1.2).toFixed(1);
      break;
    }
    default:
      console.warn("Unknown action trigger: ", actionType);
  }
  notifyObservers();
};
