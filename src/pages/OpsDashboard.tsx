import { Activity, Thermometer, BatteryCharging } from 'lucide-react';
import type { TelemetryState } from '../types/telemetry';
import StatsCard from '../components/common/StatsCard';
import ChartPlaceholder from '../components/common/ChartPlaceholder';
import { triggerAction } from '../utils/telemetryEngine';

interface OpsDashboardProps {
  telemetryState: TelemetryState;
}

export default function OpsDashboard({ telemetryState }: OpsDashboardProps) {
  const infra = telemetryState.infrastructure || {};

  const handleAdjustPower = (newVal: number) => {
    triggerAction("SET_GRID_POWER", { val: newVal });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-50">Operations Console</h1>
        <p className="text-xs text-zinc-400">Stadium facilities, IoT health monitors, and energy allocation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="HVAC Systems Health" 
          value={`${infra.hvacHealth}%`} 
          subtext="Cooling cycles operational"
          badgeText="Optimal"
          badgeStatus="success"
          icon={Thermometer}
        />
        <StatsCard 
          title="Water Main Pressure" 
          value={`${infra.waterSupplyPressure} Bar`} 
          subtext="Core supply flow normal"
          badgeText="Stable"
          badgeStatus="success"
          icon={Activity}
        />
        <StatsCard 
          title="Host Grid Load" 
          value={`${infra.powerGridLoadKw} kW`} 
          subtext="Solar grid matching demand"
          badgeText="Sufficient"
          badgeStatus="default"
          icon={BatteryCharging}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Energy allocation controls */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Power Grid Load Allocation</h3>
            <p className="text-[10px] text-zinc-500">Dynamically throttle auxiliary services load factors.</p>
          </div>
          
          <div className="flex flex-col gap-3 mt-2">
            <div className="rounded border border-zinc-850 p-3 flex justify-between items-center bg-zinc-900/10 hover:border-zinc-700 transition-colors">
              <div>
                <div className="font-semibold text-xs text-zinc-200">Eco Mode (Throttle Auxiliary Grid)</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Reduce dynamic lighting & HVAC load to 2100 kW.</div>
              </div>
              <button 
                onClick={() => handleAdjustPower(2100)}
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1 font-medium text-xs text-zinc-50 hover:bg-zinc-850 transition-colors"
              >
                Set 2100 kW
              </button>
            </div>

            <div className="rounded border border-zinc-850 p-3 flex justify-between items-center bg-zinc-900/10 hover:border-zinc-700 transition-colors">
              <div>
                <div className="font-semibold text-xs text-zinc-200">Normal Mode (Baseline Power Grid)</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Full operational capabilities at 2420 kW.</div>
              </div>
              <button 
                onClick={() => handleAdjustPower(2420)}
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1 font-medium text-xs text-zinc-50 hover:bg-zinc-850 transition-colors"
              >
                Set 2420 kW
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-semibold text-zinc-200 mb-2">Grid Consumptions</h4>
            <ChartPlaceholder type="bar" />
          </div>
        </div>

        {/* Elevators Status listing */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Facilities Diagnoses</h3>
            <p className="text-[10px] text-zinc-500">Core vertical logistics and transit state monitors.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-850 font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2 px-2">Vertical Asset</th>
                  <th className="py-2 px-2">Diagnostic Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {Object.keys(infra.elevatorStatus || {}).map(name => {
                  const status = infra.elevatorStatus[name];
                  return (
                    <tr key={name} className="hover:bg-zinc-900/10">
                      <td className="py-3 px-2 font-semibold text-zinc-300">{name}</td>
                      <td className="py-3 px-2">
                        <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wide uppercase ${status === 'OPERATIONAL' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
