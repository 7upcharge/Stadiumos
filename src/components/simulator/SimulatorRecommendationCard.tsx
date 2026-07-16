/**
 * SimulatorRecommendationCard — AI-generated action plan display
 *
 * Shows confidence score, risk level, reasoning, action plan,
 * and expandable alternatives. Restyled for the main app's zinc design system.
 */

import { useState } from 'react';
import type { ReasoningOutput, SimulationResult, ConfidenceBreakdown } from '../../types/scenarioSimulator';

interface Props {
  reasoning: ReasoningOutput;
  simulation: SimulationResult;
}

function ConfidenceMeter({ confidence, breakdown }: { confidence: number; breakdown: ConfidenceBreakdown }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - confidence);

  const color = confidence >= 0.75
    ? '#10b981'
    : confidence >= 0.5
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div 
      className="flex flex-col items-center"
      role="progressbar"
      aria-valuenow={Math.round(confidence * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Simulation confidence level"
    >
      <div className="relative">
        <svg width="96" height="96" className="sim-confidence-ring">
          <circle cx="48" cy="48" r={radius} className="sim-confidence-ring-bg" strokeWidth="6" />
          <circle
            cx="48" cy="48" r={radius}
            className="sim-confidence-ring-fill"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'rotate(0deg)' }}>
          <span className="text-xl font-bold" style={{ color }}>
            {Math.round(confidence * 100)}%
          </span>
          <span className="text-[8px] text-zinc-400 font-semibold font-mono">CONFIDENCE</span>
        </div>
      </div>

      <div className="mt-2 space-y-1 w-full">
        <BreakdownBar label="Data Recency" value={breakdown.dataRecencyScore} />
        <BreakdownBar label="Surge Margins" value={1 - breakdown.magnitudeScore} />
        <BreakdownBar label="Historical" value={breakdown.historicalSimilarityScore} />
      </div>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="text-zinc-500 w-16 text-right">{label}</span>
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500/60 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${value * 100}%`, transitionDelay: '0.5s' }}
        />
      </div>
      <span className="text-zinc-500 w-8">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export default function SimulatorRecommendationCard({ reasoning, simulation }: Props) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  const riskBadgeClass =
    reasoning.risk_level === 'high' ? 'sim-badge-high' :
    reasoning.risk_level === 'medium' ? 'sim-badge-medium' : 'sim-badge-low';

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-5">
      {/* Header: Title + Risk Badge */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Recommendation
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            Scenario: {simulation.scenario.trigger.replace(/_/g, ' ')} at {simulation.affectedGateName}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${riskBadgeClass}`}>
          {reasoning.risk_level} risk
        </span>
      </div>

      {/* Confidence Meter + Stats */}
      <div className="grid grid-cols-[auto_1fr] gap-5 items-start">
        <ConfidenceMeter confidence={reasoning.confidence} breakdown={reasoning.confidenceBreakdown} />

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <SimStatCard
              label="Peak Gate"
              value={simulation.crowdRedistribution.find(
                r => r.gateId === simulation.peakLoadGateId
              )?.gateName.replace(/\s*\(.*\)/, '') ?? 'N/A'}
              sub={`${((simulation.crowdRedistribution.find(r => r.gateId === simulation.peakLoadGateId)?.capacityUtilization ?? 0) * 100).toFixed(0)}% util.`}
              accent
            />
            <SimStatCard
              label="Staff Gap"
              value={`+${simulation.staffingGaps.reduce((s, g) => s + g.gap, 0)}`}
              sub="volunteers needed"
            />
            <SimStatCard
              label="Max Wait Δ"
              value={`+${Math.max(...simulation.waitTimeChanges.map(w => w.deltaMinutes)).toFixed(1)} min`}
              sub="increase"
            />
            <SimStatCard
              label="Shuttles"
              value={`+${simulation.transportImpact.estimatedAdditionalShuttlesNeeded}`}
              sub="buses needed"
            />
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3.5">
        <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5 font-mono">
          Analysis
        </p>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {reasoning.reasoning}
        </p>
      </div>

      {/* Action Plan */}
      <div>
        <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2.5 font-mono">
          Action Plan
        </p>
        <div className="space-y-2">
          {reasoning.action_plan.map((action, i) => (
            <div key={i} className="flex gap-3 group">
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                {i + 1}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed pt-0.5">
                {action}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Alternatives (expandable) */}
      {reasoning.alternatives.length > 0 && (
        <div>
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center gap-2 text-[10px] font-semibold text-zinc-400 hover:text-cyan-400 transition-colors uppercase tracking-wider font-mono"
            aria-expanded={showAlternatives}
          >
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${showAlternatives ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showAlternatives ? 'Hide' : 'Show'} Alternatives ({reasoning.alternatives.length})
          </button>

          {showAlternatives && (
            <div className="mt-3 space-y-2.5 sim-expand-in">
              {reasoning.alternatives.map((alt, i) => (
                <div key={i} className="bg-zinc-900/30 border border-zinc-800/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-amber-400 font-bold mt-0.5 font-mono">ALT {i + 1}</span>
                    <div>
                      <p className="text-xs text-zinc-300">{alt.action}</p>
                      <p className="text-[10px] text-amber-400/70 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Tradeoff: {alt.tradeoff}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SimStatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/30 rounded-lg p-2">
      <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">{label}</p>
      <p className={`text-sm font-bold ${accent ? 'text-cyan-400' : 'text-zinc-200'}`}>{value}</p>
      <p className="text-[9px] text-zinc-500">{sub}</p>
    </div>
  );
}
