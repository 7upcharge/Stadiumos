import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import type { TelemetryState } from '../types/telemetry';
import StatsCard from '../components/common/StatsCard';
import { triggerAction } from '../utils/telemetryEngine';

interface IncidentCenterProps {
  telemetryState: TelemetryState;
}

export default function IncidentCenter({ telemetryState }: IncidentCenterProps) {
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportZone, setReportZone] = useState('Zone A (Main Concourse)');
  const [reportSeverity, setReportSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const activeIncidents = telemetryState.activeIncidents || [];
  const resolvedIncidents = telemetryState.resolvedIncidents || [];

  const handleReport = (e: FormEvent) => {
    e.preventDefault();
    if (!reportTitle) return;
    triggerAction("CREATE_INCIDENT", {
      title: reportTitle,
      severity: reportSeverity,
      zone: reportZone,
      description: reportDesc
    });
    setReportTitle('');
    setReportDesc('');
  };

  const handleDispatch = (id: string) => {
    triggerAction("DISPATCH_SECURITY", {
      incidentId: id,
      unitName: "Guard Unit 4"
    });
  };

  const handleResolve = (id: string) => {
    triggerAction("RESOLVE_INCIDENT", {
      incidentId: id
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-50">Incident Center</h1>
        <p className="text-xs text-zinc-400">Security logging, dispatch operations, and crisis resolution telemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Active Alerts" 
          value={activeIncidents.length.toString()} 
          subtext="Requires supervision"
          badgeText={activeIncidents.length > 0 ? "Dispatching" : "Cleared"}
          badgeStatus={activeIncidents.length > 0 ? "error" : "success"}
          icon={AlertTriangle}
        />
        <StatsCard 
          title="Resolved Alerts" 
          value={resolvedIncidents.length.toString()} 
          subtext="Closed in current shift"
          badgeText="Archived"
          badgeStatus="default"
          icon={Check}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents listing */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Active Logs ({activeIncidents.length})</h3>
            <p className="text-[10px] text-zinc-500">Emergency channels logging security anomalies.</p>
          </div>

          {activeIncidents.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs font-mono">
              All perimeters report secure. No active incidents.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeIncidents.map(inc => (
                <div key={inc.id} className="rounded border border-zinc-850 bg-zinc-900/10 p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-xs ${inc.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`}>
                      [{inc.severity}] {inc.title}
                    </span>
                    <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wide uppercase ${inc.status === 'DISPATCHED' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}>
                      {inc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">{inc.description}</p>
                  <div className="text-[10px] text-zinc-500">
                    Zone: {inc.zone} | Time: {inc.timestamp}
                  </div>

                  {inc.assignedUnits.length > 0 && (
                    <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                      Deployed: {inc.assignedUnits.join(', ')}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    {inc.status === 'REPORTED' && (
                      <button 
                        onClick={() => handleDispatch(inc.id)}
                        className="rounded border border-transparent bg-purple-600 hover:bg-purple-500 px-2.5 py-1 font-medium text-[11px] text-white transition-colors"
                      >
                        Dispatch Guard Unit 4
                      </button>
                    )}
                    <button 
                      onClick={() => handleResolve(inc.id)}
                      className="rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1 font-medium text-[11px] text-zinc-50 transition-colors"
                    >
                      Resolve Alert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Log incident form */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Log Manual Incident</h3>
            <p className="text-[10px] text-zinc-500">Send alert message to security network channels.</p>
          </div>

          <form onSubmit={handleReport} className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Incident Title (e.g. Broken gate lock)" 
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 outline-none focus:border-zinc-600"
              required
            />
            <textarea 
              placeholder="Incident description..." 
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 outline-none focus:border-zinc-600 min-h-[80px]"
            />
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={reportZone} 
                onChange={(e) => setReportZone(e.target.value)}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-50 outline-none cursor-pointer"
              >
                <option value="Zone A (Main Concourse)">Zone A (North)</option>
                <option value="Zone B (VIP Suites)">Zone B (West)</option>
                <option value="Zone C (Gate 4 Entrance)">Zone C (East)</option>
                <option value="Zone D (South Stands)">Zone D (South)</option>
                <option value="Zone E (Transit Hub)">Zone E (Transit)</option>
              </select>
              <select 
                value={reportSeverity} 
                onChange={(e) => setReportSeverity(e.target.value as any)}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-50 outline-none cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <button 
              type="submit" 
              className="mt-2 w-full rounded border border-transparent bg-zinc-50 hover:opacity-90 px-3 py-1.5 font-medium text-black text-xs transition-opacity"
            >
              File Emergency Log
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
