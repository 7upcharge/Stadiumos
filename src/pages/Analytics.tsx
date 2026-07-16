import { TrendingDown, Leaf, Droplet } from 'lucide-react';
import type { TelemetryState } from '../types/telemetry';
import StatsCard from '../components/common/StatsCard';
import ChartPlaceholder from '../components/common/ChartPlaceholder';

interface AnalyticsProps {
  telemetryState: TelemetryState;
}

export default function Analytics({ telemetryState }: AnalyticsProps) {
  const sustain = telemetryState.sustainability || {};

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-50">Analytics HQ</h1>
        <p className="text-xs text-zinc-400">Egress traffic distributions, carbon footprint tracking, and resources summaries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Carbon Saved Actual" 
          value={`-${sustain.carbonFootprintActual}%`} 
          subtext={`Target reduction: -${sustain.carbonFootprintTarget}%`}
          badgeText="Performing"
          badgeStatus="success"
          icon={TrendingDown}
        />
        <StatsCard 
          title="Recycled Water Volume" 
          value={`${sustain.greywaterRecycledLiters.toLocaleString()} L`} 
          subtext="Recycled greywater volume"
          badgeText="Active"
          badgeStatus="success"
          icon={Droplet}
        />
        <StatsCard 
          title="Solar Generation Share" 
          value={`${sustain.greenEnergyShare}%`} 
          subtext="Total grid percentage supported"
          badgeText="Green"
          badgeStatus="success"
          icon={Leaf}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transit loading stats */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Egress Dispatch Distribution</h3>
            <p className="text-[10px] text-zinc-500">Passenger transit load patterns by transit type.</p>
          </div>

          <ChartPlaceholder type="bar" height={150} />
        </div>

        {/* Waste fill levels */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Waste Bin Fill Telemetry</h3>
            <p className="text-[10px] text-zinc-500">Ultrasonic fill-levels for eco-friendly collection management.</p>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">Organic Compost Bin</span>
                <span className="text-zinc-500 font-semibold">{sustain.compostBinFill}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-900">
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${sustain.compostBinFill}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">Recycling Bin (Paper & Plastics)</span>
                <span className="text-zinc-500 font-semibold">{sustain.recycleBinFill}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-900">
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${sustain.recycleBinFill}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">General Landfill Waste</span>
                <span className="text-zinc-500 font-semibold">{sustain.landfillBinFill}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-900">
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${sustain.landfillBinFill}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
