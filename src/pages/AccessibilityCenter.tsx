import { useState } from 'react';
import type { FormEvent } from 'react';
import { Accessibility, Volume2, Moon, Compass } from 'lucide-react';
import type { TelemetryState } from '../types/telemetry';
import StatsCard from '../components/common/StatsCard';
import { triggerAction } from '../utils/telemetryEngine';

interface AccessibilityCenterProps {
  telemetryState: TelemetryState;
}

export default function AccessibilityCenter({ telemetryState }: AccessibilityCenterProps) {
  const [userName, setUserName] = useState('');
  const [assistType, setAssistType] = useState('Wheelchair Escort');
  const [assistLoc, setAssistLoc] = useState('Gate 2 Entry');

  const requests = telemetryState.accessibilityRequests || [];

  const handleBook = (e: FormEvent) => {
    e.preventDefault();
    triggerAction("REQUEST_ACCESS_ASSIST", {
      name: userName || "Visitor",
      type: assistType,
      location: assistLoc
    });
    setUserName('');
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-50">Access Shield</h1>
        <p className="text-xs text-zinc-400">Sensory meters, step-free navigation channels, and accessibility escorts logs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Sensory Decibels Peak" 
          value="94 dB" 
          subtext="Peak recorded in Sec 104"
          badgeText="Alert"
          badgeStatus="warning"
          icon={Volume2}
        />
        <StatsCard 
          title="Quiet Rooms Available" 
          value="4 Rooms" 
          subtext="Fully staffed by medical leads"
          badgeText="Optimal"
          badgeStatus="success"
          icon={Moon}
        />
        <StatsCard 
          title="Active Assistance Requests" 
          value={requests.length.toString()} 
          subtext="Wheelchair & golf-cart transit"
          badgeText="Live Monitor"
          badgeStatus="default"
          icon={Accessibility}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adaptive navigation options */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-purple-400" />
            <h3 className="text-xs font-semibold text-zinc-200">Active Adaptive Navigation Routes</h3>
          </div>
          <p className="text-[10px] text-zinc-500">
            Automatically avoids high-occupancy bottlenecks and stairs.
          </p>

          <div className="border-l-2 border-zinc-800 pl-4 ml-2 flex flex-col gap-4">
            <div>
              <div className="text-xs font-semibold text-zinc-300">Step-Free Corridor Entrance 2</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Widened ramp pathways active. Escorts positioned at threshold.</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-300">North Lift System (Elevator 1-3)</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Fully operational. Elevator 4 bypassed due to mechanical service check.</div>
            </div>
          </div>
        </div>

        {/* Request assistance escort form */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Request Mobility Escort</h3>
            <p className="text-[10px] text-zinc-500">Book a volunteer golf-cart helper or sign language support.</p>
          </div>

          <form onSubmit={handleBook} className="flex flex-col gap-3">
            <label htmlFor="passenger-name" className="sr-only">Passenger name</label>
            <input 
              id="passenger-name"
              type="text" 
              placeholder="Passenger name..." 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 outline-none focus:border-zinc-600"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="assist-type" className="sr-only">Assistance type</label>
                <select 
                  id="assist-type"
                  value={assistType} 
                  onChange={(e) => setAssistType(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-50 outline-none cursor-pointer"
                >
                  <option value="Wheelchair Escort">Wheelchair Escort</option>
                  <option value="Sensory Pack Pick-up">Sensory Pack Pick-up</option>
                  <option value="Sign Language Interpreter">ASL Interpreter</option>
                  <option value="Golf-Cart Shuttle">Golf-Cart Shuttle</option>
                </select>
              </div>
              <div>
                <label htmlFor="assist-loc" className="sr-only">Pickup location</label>
                <select 
                  id="assist-loc"
                  value={assistLoc} 
                  onChange={(e) => setAssistLoc(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-50 outline-none cursor-pointer"
                >
                  <option value="Gate 2 Entry">Gate 2 Entry</option>
                  <option value="Gate 4 Drop-off">Gate 4 Drop-off</option>
                  <option value="Section 104 Access Hub">Section 104 Access Hub</option>
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              className="mt-2 w-full rounded border border-transparent bg-zinc-50 hover:opacity-90 px-3 py-1.5 font-medium text-black text-xs transition-opacity"
            >
              Book Escort Dispatch
            </button>
          </form>

          {requests.length > 0 && (
            <div className="mt-3">
              <h4 className="text-[10px] font-semibold text-zinc-400 mb-2">Active Dispatches</h4>
              <div className="flex flex-col gap-1.5">
                {requests.map(req => (
                  <div key={req.id} className="flex justify-between items-center bg-zinc-900/10 p-2.5 rounded border border-zinc-850 text-[10px]">
                    <div className="text-zinc-300">
                      <strong>{req.name}</strong> - {req.type} ({req.location})
                    </div>
                    <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] font-medium tracking-wide uppercase ${req.status === 'DISPATCHED' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
