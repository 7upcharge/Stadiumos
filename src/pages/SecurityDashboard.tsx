import { useState } from 'react';
import { ShieldAlert, Video, Eye, EyeOff, Radio } from 'lucide-react';
import type { TelemetryState } from '../types/telemetry';
import StatsCard from '../components/common/StatsCard';

interface SecurityDashboardProps {
  telemetryState: TelemetryState;
}

export default function SecurityDashboard({ telemetryState }: SecurityDashboardProps) {
  const [selectedCamera, setSelectedCamera] = useState('Camera 1 (Gate 4 Tunnel)');
  const [cctvState, setCctvState] = useState(true);

  const activeIncidents = telemetryState.activeIncidents || [];
  const zones = telemetryState.zones || {};
  const currentDensity = zones["Zone C (Gate 4 Entrance)"]?.crowdDensity || 1.8;

  const cameras = [
    { id: 'cam-1', name: 'Camera 1 (Gate 4 Tunnel)', zone: 'Zone C (Gate 4 Entrance)', status: currentDensity >= 4.0 ? 'ANOMALY' : 'CLEAR' },
    { id: 'cam-2', name: 'Camera 2 (VIP Suites Corridor)', zone: 'Zone B (VIP Suites)', status: 'CLEAR' },
    { id: 'cam-3', name: 'Camera 3 (South Aisle Entrance)', zone: 'Zone D (South Stands)', status: 'CLEAR' },
    { id: 'cam-4', name: 'Camera 4 (Transit Loop Outer)', zone: 'Zone E (Transit Hub)', status: 'CLEAR' }
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-50">Security Command</h1>
        <p className="text-xs text-zinc-400">CCTV surveillance feeds, perimeter sensors, and threat classification</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Active Security Incidents" 
          value={activeIncidents.length.toString()} 
          subtext="Monitoring team dispatched"
          badgeText="Live Feed"
          badgeStatus={activeIncidents.length > 0 ? "error" : "success"}
          icon={ShieldAlert}
        />
        <StatsCard 
          title="CCTV Cameras Online" 
          value="184 / 184" 
          subtext="Edge analytics connected"
          badgeText="99.9% uptime"
          badgeStatus="success"
          icon={Video}
        />
        <StatsCard 
          title="Gate Status" 
          value="All Cleared" 
          subtext="Turnstile diagnostics healthy"
          badgeText="Optimal"
          badgeStatus="success"
          icon={Radio}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CCTV preview panel */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-zinc-200">CCTV Core Live Feed Preview</h3>
              <p className="text-[10px] text-zinc-500">Currently viewing: {selectedCamera}</p>
            </div>
            <button 
              onClick={() => setCctvState(!cctvState)}
              className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-medium text-[11px] text-zinc-50 hover:bg-zinc-850 transition-colors"
            >
              {cctvState ? <EyeOff size={12} /> : <Eye size={12} />}
              {cctvState ? 'Disable Analytics Overlay' : 'Enable Analytics Overlay'}
            </button>
          </div>

          <div className="h-60 bg-zinc-950 border border-zinc-850 rounded-md relative flex items-center justify-center overflow-hidden">
            {cctvState ? (
              <div className="w-full h-full flex flex-col p-4 justify-between">
                <div className="flex justify-between font-mono text-[9px] text-zinc-400 bg-black/60 p-1.5 rounded">
                  <span>FPS: 30.00 | LOSS: 0% | ANALYTICS: ACTIVE</span>
                  <span className="text-emerald-500 animate-pulse-opacity font-bold">● RECORDING</span>
                </div>

                <div className="margin-auto flex flex-col items-center gap-2">
                  {selectedCamera === 'Camera 1 (Gate 4 Tunnel)' && currentDensity >= 4.0 ? (
                    <div className="bg-red-500/10 border-2 border-red-500 p-4 rounded-md text-center max-w-[280px] animate-pulse-opacity">
                      <div className="text-red-500 font-bold text-xs tracking-wider">CROWD ANOMALY DETECTED</div>
                      <div className="text-[10px] text-zinc-100 mt-1">Density {currentDensity} people/sqm exceeds standard capacity ceiling.</div>
                    </div>
                  ) : (
                    <div className="text-zinc-500 text-xs text-center leading-normal">
                      [CAMERA STREAM NOMINAL]<br />
                      No motion bottlenecks identified.
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-mono text-[9px] text-zinc-400 bg-black/60 p-1.5 rounded">
                  <span>LOCATION: {selectedCamera.toUpperCase()}</span>
                  <span>SYSTEM OVERLAY v1.2</span>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-xs font-mono">surveillance stream offline</div>
            )}
          </div>
        </div>

        {/* Selected Cameras menu */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Camera Network Selection</h3>
            <p className="text-[10px] text-zinc-500">Choose CCTV nodes to inspect.</p>
          </div>

          <div className="flex flex-col gap-2">
            {cameras.map(cam => {
              const isSelected = selectedCamera === cam.name;
              const hasAnomaly = cam.status === 'ANOMALY';
              return (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam.name)}
                  className={`
                    w-full rounded-md border p-3 text-left transition-colors flex justify-between items-center
                    ${isSelected ? 'bg-zinc-900 border-zinc-600 text-zinc-50' : 'bg-transparent border-zinc-850 text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100'}
                  `}
                >
                  <div>
                    <div className="font-semibold text-xs">{cam.name}</div>
                    <div className="text-[10px] text-zinc-500">{cam.zone}</div>
                  </div>
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wide uppercase ${hasAnomaly ? 'border-red-500/20 bg-red-500/10 text-red-400 animate-pulse-opacity' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>
                    {cam.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
