/**
 * StadiumDensityView — Reusable before/after stadium crowd density visualization
 *
 * This is the single swap-point component. When a real stadium map is built
 * later, only this component needs to be replaced — no other code changes required.
 *
 * Renders a simplified top-down stadium view with 8 gate zones.
 * Shows crowd density shift through color-coded gates:
 *   Green → Yellow → Orange → Red (by capacity utilization)
 */

import type { StadiumState, GateState } from '../../types/scenarioSimulator';

interface StadiumDensityViewProps {
  beforeState: StadiumState;
  afterState: StadiumState;
  affectedGateId: string;
}

function getHeatColor(utilization: number, isOpen: boolean): string {
  if (!isOpen) return '#3f3f46';       // zinc-700
  if (utilization > 1.0) return '#ef4444';
  if (utilization > 0.9) return '#f97316';
  if (utilization > 0.7) return '#eab308';
  if (utilization > 0.5) return '#22c55e';
  return '#10b981';
}

function getGlowColor(utilization: number, isOpen: boolean): string {
  if (!isOpen) return 'rgba(63, 63, 70, 0.3)';
  if (utilization > 1.0) return 'rgba(239, 68, 68, 0.4)';
  if (utilization > 0.9) return 'rgba(249, 115, 22, 0.3)';
  if (utilization > 0.7) return 'rgba(234, 179, 8, 0.2)';
  return 'rgba(16, 185, 129, 0.2)';
}

function GateNode({
  gate,
  isAffected,
  showLabel,
}: {
  gate: GateState;
  isAffected: boolean;
  showLabel: boolean;
}) {
  const utilization = gate.currentLoad / gate.capacity;
  const color = getHeatColor(utilization, gate.isOpen);
  const glow = getGlowColor(utilization, gate.isOpen);
  const radius = gate.isOpen ? 18 + Math.min(utilization * 8, 12) : 14;

  return (
    <g>
      <circle
        cx={gate.position.x}
        cy={gate.position.y}
        r={radius + 8}
        fill={glow}
        className="transition-all duration-700"
      />

      {isAffected && !gate.isOpen && (
        <circle
          cx={gate.position.x}
          cy={gate.position.y}
          r={radius + 4}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          opacity="0.6"
        >
          <animate attributeName="r" from={String(radius + 4)} to={String(radius + 20)} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      <circle
        cx={gate.position.x}
        cy={gate.position.y}
        r={radius}
        fill={color}
        stroke={isAffected && !gate.isOpen ? '#ef4444' : 'rgba(255,255,255,0.15)'}
        strokeWidth={isAffected ? 2.5 : 1}
        className="transition-all duration-700"
      />

      {!gate.isOpen && (
        <g>
          <line
            x1={gate.position.x - 6} y1={gate.position.y - 6}
            x2={gate.position.x + 6} y2={gate.position.y + 6}
            stroke="white" strokeWidth="2.5" strokeLinecap="round"
          />
          <line
            x1={gate.position.x + 6} y1={gate.position.y - 6}
            x2={gate.position.x - 6} y2={gate.position.y + 6}
            stroke="white" strokeWidth="2.5" strokeLinecap="round"
          />
        </g>
      )}

      {showLabel && (
        <>
          <text
            x={gate.position.x}
            y={gate.position.y + radius + 16}
            textAnchor="middle"
            className="text-[9px] font-bold fill-zinc-300"
          >
            {gate.name.replace(/\s*\(.*\)/, '')}
          </text>
          {gate.isOpen && (
            <text
              x={gate.position.x}
              y={gate.position.y + radius + 27}
              textAnchor="middle"
              className="text-[8px] fill-zinc-500"
            >
              {gate.currentLoad}/{gate.capacity} · {(utilization * 100).toFixed(0)}%
            </text>
          )}
          {!gate.isOpen && (
            <text
              x={gate.position.x}
              y={gate.position.y + radius + 27}
              textAnchor="middle"
              className="text-[8px] fill-red-400 font-semibold"
            >
              CLOSED
            </text>
          )}
        </>
      )}
    </g>
  );
}

function StadiumOutline() {
  return (
    <g>
      <ellipse
        cx="300" cy="300" rx="260" ry="240"
        fill="none"
        stroke="rgba(63, 63, 70, 0.4)"
        strokeWidth="2"
        strokeDasharray="8 4"
      />
      <ellipse
        cx="300" cy="300" rx="200" ry="180"
        fill="rgba(9, 9, 11, 0.4)"
        stroke="rgba(63, 63, 70, 0.25)"
        strokeWidth="1"
      />
      <ellipse
        cx="300" cy="300" rx="100" ry="80"
        fill="rgba(16, 185, 129, 0.08)"
        stroke="rgba(16, 185, 129, 0.2)"
        strokeWidth="1"
      />
      <line
        x1="200" y1="300" x2="400" y2="300"
        stroke="rgba(16, 185, 129, 0.15)"
        strokeWidth="0.5"
      />
      <ellipse
        cx="300" cy="300" rx="20" ry="16"
        fill="none"
        stroke="rgba(16, 185, 129, 0.15)"
        strokeWidth="0.5"
      />
      <text x="300" y="304" textAnchor="middle" className="text-[9px] fill-emerald-800 font-medium">
        PITCH
      </text>
    </g>
  );
}

export default function StadiumDensityView({ beforeState, afterState, affectedGateId }: StadiumDensityViewProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="text-xs font-semibold text-zinc-200 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Crowd Density Map
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Before */}
        <div>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Before</span>
          </div>
          <div className="border border-zinc-800 rounded-xl p-2 bg-zinc-950/50">
            <svg viewBox="0 0 600 600" className="w-full">
              <StadiumOutline />
              {beforeState.gates.map(gate => (
                <GateNode
                  key={gate.id}
                  gate={gate}
                  isAffected={gate.id === affectedGateId}
                  showLabel={true}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* After */}
        <div>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">After Simulation</span>
          </div>
          <div className="border border-cyan-900/40 rounded-xl p-2 bg-cyan-950/10">
            <svg viewBox="0 0 600 600" className="w-full">
              <StadiumOutline />
              {afterState.gates.map(gate => (
                <GateNode
                  key={gate.id}
                  gate={gate}
                  isAffected={gate.id === affectedGateId}
                  showLabel={true}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>&lt;70%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>70-90%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>90-100%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>&gt;100%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-zinc-600" />
          <span>Closed</span>
        </div>
      </div>
    </div>
  );
}
