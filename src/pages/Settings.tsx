import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function Settings() {
  const [densityLimit, setDensityLimit] = useState(4.0);
  const [noiseLimit, setNoiseLimit] = useState(90);
  const [autoRouting, setAutoRouting] = useState(true);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-50">System Settings</h1>
        <p className="text-xs text-zinc-400">Configure thresholds, analytics thresholds, and AI auto-response policies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core settings form */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Alert Threshold Parameters</h3>
            <p className="text-[10px] text-zinc-500">Configure trigger thresholds for automated security & operational dispatches.</p>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Critical Crowd Density Threshold (people / sqm)
              </label>
              <div className="flex gap-4 items-center">
                <input 
                  type="range" 
                  min="2.0" 
                  max="6.0" 
                  step="0.5" 
                  value={densityLimit} 
                  onChange={(e) => setDensityLimit(parseFloat(e.target.value))}
                  className="flex-grow accent-purple-500 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-zinc-200 w-10 text-right">
                  {densityLimit}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Critical Noise Limit Threshold (dB)
              </label>
              <div className="flex gap-4 items-center">
                <input 
                  type="range" 
                  min="70" 
                  max="110" 
                  step="5" 
                  value={noiseLimit} 
                  onChange={(e) => setNoiseLimit(parseInt(e.target.value))}
                  className="flex-grow accent-purple-500 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-zinc-200 w-10 text-right">
                  {noiseLimit}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-850 pt-4 mt-2">
              <div>
                <div className="text-xs font-semibold text-zinc-200">AI Automated Routing Decisions</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Allow system to update digital signs automatically upon bottleneck detection.</div>
              </div>
              <input 
                type="checkbox" 
                checked={autoRouting} 
                onChange={() => setAutoRouting(!autoRouting)}
                className="h-4.5 w-4.5 rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <button 
              type="submit" 
              className="mt-2 self-start rounded border border-transparent bg-zinc-50 hover:opacity-90 px-3.5 py-1.5 font-medium text-black text-xs transition-opacity"
            >
              Save Thresholds
            </button>
          </form>

          {successMsg && (
            <div className="flex gap-2.5 rounded border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400 font-semibold mt-2 animate-pulse-opacity">
              <CheckCircle size={16} />
              <span>Configurations updated and synced to all operating sensors.</span>
            </div>
          )}
        </div>

        {/* Diagnostics card */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">System Diagnostics</h3>
            <p className="text-[10px] text-zinc-500">Connected edge systems and validation checks.</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs py-2 border-b border-zinc-850">
              <span className="text-zinc-400">CCTV Edge Neural Chips</span>
              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 font-mono text-[8px] font-medium tracking-wide uppercase">48/48 ACTIVE</span>
            </div>

            <div className="flex justify-between items-center text-xs py-2 border-b border-zinc-850">
              <span className="text-zinc-400">Ultrasonic Bin Sensors</span>
              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 font-mono text-[8px] font-medium tracking-wide uppercase">112/112 ACTIVE</span>
            </div>

            <div className="flex justify-between items-center text-xs py-2 border-b border-zinc-850">
              <span className="text-zinc-400">Grid Water Flow Meters</span>
              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 font-mono text-[8px] font-medium tracking-wide uppercase">16/16 ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
