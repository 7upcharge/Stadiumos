import { Shield, Users, Zap, Clock } from 'lucide-react';
import type { TelemetryState } from '../types/telemetry';
import StatsCard from '../components/common/StatsCard';
import ChartPlaceholder from '../components/common/ChartPlaceholder';

interface HomeProps {
  telemetryState: TelemetryState;
}

export default function Home({ telemetryState }: HomeProps) {
  const activeIncidents = telemetryState.activeIncidents || [];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-5 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-50">StadiumOS AI Core</h1>
          <p className="text-xs text-zinc-400">FIFA World Cup 2026 Stadium Operations Console</p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
          <Clock size={12} />
          <span>Last Sync: {telemetryState.currentTime}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Crowd Attendance" 
          value={telemetryState.totalAttendance.toLocaleString()} 
          subtext="98.2% arena occupancy"
          badgeText="Peak"
          badgeStatus="success"
          icon={Users}
          iconColor="text-blue-400"
        />
        <StatsCard 
          title="Active System Alerts" 
          value={activeIncidents.length.toString()} 
          subtext={activeIncidents.length > 0 ? "Action recommended" : "Perimeter clean"}
          badgeText={activeIncidents.length > 0 ? "Action" : "Optimal"}
          badgeStatus={activeIncidents.length > 0 ? "error" : "success"}
          icon={Shield}
          iconColor="text-purple-400"
        />
        <StatsCard 
          title="Grid Power Utilization" 
          value={`${telemetryState.infrastructure.powerGridLoadKw} kW`} 
          subtext={`${telemetryState.sustainability.greenEnergyShare}% solar powered`}
          badgeText="Active"
          badgeStatus="default"
          icon={Zap}
          iconColor="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap & Grid Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="text-xs font-semibold text-zinc-200">Egress Crowd Heatmap</h3>
            <p className="text-[10px] text-zinc-500 mb-4">Real-time gate clearance telemetry grids.</p>
            <ChartPlaceholder type="heatmap" />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="text-xs font-semibold text-zinc-200 mb-4">Active Sector Load Indicators</h3>
            <div className="flex flex-col gap-2">
              {Object.keys(telemetryState.zones).map(zoneName => {
                const z = telemetryState.zones[zoneName];
                const isHigh = z.crowdDensity >= 4.0;
                return (
                  <div key={zoneName} className="flex justify-between items-center text-xs p-3 bg-zinc-900/30 border border-zinc-850 rounded-md">
                    <span className="font-medium text-zinc-300">{zoneName}</span>
                    <div className="flex gap-4 items-center">
                      <span className="text-zinc-500 text-[11px]">Density: {z.crowdDensity}/sqm</span>
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wide uppercase ${isHigh ? 'border border-red-500/20 bg-red-500/10 text-red-400' : 'border border-zinc-800 bg-zinc-900 text-zinc-400'}`}>
                        {isHigh ? 'OVERFLOW' : 'NORMAL'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Operating Timeline */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Operating Command Timeline</h3>
            <p className="text-[10px] text-zinc-500">Latest actions registered on host system.</p>
          </div>

          <div className="flex flex-col gap-4 relative">
            {activeIncidents.map(inc => (
              <div key={inc.id} className="flex gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] mt-1.5 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <div className="font-semibold text-zinc-100">Alert Raised: {inc.title}</div>
                  <div className="text-zinc-400 text-[11px]">Location: {inc.zone}</div>
                  <span className="font-mono text-[9px] text-zinc-500">{inc.timestamp}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-zinc-800 mt-1.5 flex-shrink-0" />
              <div className="flex flex-col gap-0.5">
                <div className="font-medium text-zinc-200">Concession Apex Burgers pre-ordering opened</div>
                <div className="text-zinc-400 text-[11px]">Inventory status updated.</div>
                <span className="font-mono text-[9px] text-zinc-500">10:15 AM</span>
              </div>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-zinc-800 mt-1.5 flex-shrink-0" />
              <div className="flex flex-col gap-0.5">
                <div className="font-medium text-zinc-200">Sensory baseline established</div>
                <div className="text-zinc-400 text-[11px]">All decibel devices reporting online.</div>
                <span className="font-mono text-[9px] text-zinc-500">08:00 AM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
