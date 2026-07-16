export interface Incident {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'DISPATCHED' | 'RESOLVED';
  zone: string;
  description: string;
  timestamp: string;
  aiSuggested: string[];
  assignedUnits: string[];
  resolvedAt?: string;
}

export interface ZoneData {
  crowdDensity: number;
  temp: number;
  waterFlow: number;
  lightsStatus: string;
}

export interface Concession {
  id: string;
  name: string;
  waitTime: number;
  stockLevel: number;
  salesCount: number;
  foodWasteSavedKg: number;
}

export interface Infrastructure {
  hvacHealth: number;
  waterSupplyPressure: number;
  powerGridLoadKw: number;
  elevatorStatus: Record<string, 'OPERATIONAL' | 'MAINTENANCE'>;
}

export interface TransitData {
  shuttleWaitTime: number;
  parkingAvailable: number;
  uberSurge: string;
  egressRates: {
    lightRail: number;
    buses: number;
    rideShare: number;
  };
}

export interface SustainabilityData {
  carbonFootprintTarget: number;
  carbonFootprintActual: number;
  compostBinFill: number;
  recycleBinFill: number;
  landfillBinFill: number;
  greywaterRecycledLiters: number;
  greenEnergyShare: number;
}

export interface AccessibilityRequest {
  id: string;
  userId: string;
  name: string;
  type: string;
  status: 'PENDING' | 'DISPATCHED';
  location: string;
}

export interface FanOrder {
  id: string;
  name: string;
  seat: string;
  items: string[];
  totalCost: number;
  status: 'PREPARING' | 'READY_FOR_PICKUP';
  timestamp: string;
}

export interface TelemetryState {
  currentTime: string;
  totalAttendance: number;
  activeGates: number;
  activeIncidents: Incident[];
  resolvedIncidents: Incident[];
  zones: Record<string, ZoneData>;
  concessions: Concession[];
  infrastructure: Infrastructure;
  transit: TransitData;
  sustainability: SustainabilityData;
  accessibilityRequests: AccessibilityRequest[];
  fanOrders: FanOrder[];
}
