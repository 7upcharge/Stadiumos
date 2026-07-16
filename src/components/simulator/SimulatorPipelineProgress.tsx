/**
 * SimulatorPipelineProgress — Visual pipeline stage indicator
 *
 * Shows the three-stage reasoning pipeline:
 *   Parse → Simulate → Reason
 *
 * Restyled to match the main app's zinc design system.
 */

import type { PipelineStage } from '../../types/scenarioSimulator';

interface Props {
  stage: PipelineStage;
}

const STAGES = [
  {
    id: 'parsing' as const,
    label: 'Parse Query',
    sublabel: 'NL → Structured Scenario',
    icon: '📝',
  },
  {
    id: 'simulating' as const,
    label: 'Simulate',
    sublabel: 'Deterministic Crowd Model',
    icon: '🔬',
  },
  {
    id: 'reasoning' as const,
    label: 'Reason',
    sublabel: 'Action Plan Generation',
    icon: '🧠',
  },
] as const;

const STAGE_ORDER: Record<string, number> = {
  idle: -1,
  parsing: 0,
  simulating: 1,
  reasoning: 2,
  complete: 3,
  error: -1,
};

export default function SimulatorPipelineProgress({ stage }: Props) {
  const currentIndex = STAGE_ORDER[stage] ?? -1;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-widest font-mono">
          Pipeline Active
        </span>
      </div>

      {/* Stages */}
      <div className="flex items-center gap-0">
        {STAGES.map((s, i) => {
          const isDone = currentIndex > i || stage === 'complete';
          const isActive = currentIndex === i && stage !== 'complete';

          return (
            <div key={s.id} className="flex items-center flex-1">
              {/* Stage node */}
              <div className="flex flex-col items-center flex-1">
                {/* Circle indicator */}
                <div
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-lg
                    transition-all duration-500 relative
                    ${isDone
                      ? 'bg-emerald-500/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : isActive
                        ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-lg shadow-cyan-500/20 sim-glow-pulse'
                        : 'bg-zinc-900 border-2 border-zinc-800 opacity-40'
                    }
                  `}
                >
                  {isDone ? (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{s.icon}</span>
                  )}

                  {isActive && (
                    <div className="absolute inset-0 rounded-xl border-2 border-cyan-400/50 animate-ping" />
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p className={`text-xs font-semibold transition-colors duration-300 ${
                    isDone ? 'text-emerald-400' : isActive ? 'text-cyan-400' : 'text-zinc-500'
                  }`}>
                    {s.label}
                  </p>
                  <p className={`text-[10px] mt-0.5 transition-colors duration-300 ${
                    isActive ? 'text-cyan-400/70' : 'text-zinc-600'
                  }`}>
                    {s.sublabel}
                  </p>
                </div>

                {/* Active loading dots */}
                {isActive && (
                  <div className="flex gap-1 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 sim-loading-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 sim-loading-dot" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 sim-loading-dot" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
              </div>

              {/* Connector line between stages */}
              {i < STAGES.length - 1 && (
                <div className="flex-shrink-0 w-12 h-0.5 -mt-8 mx-1 relative overflow-hidden rounded-full">
                  <div className={`absolute inset-0 transition-colors duration-500 ${
                    currentIndex > i || stage === 'complete' ? 'bg-emerald-500/50' : 'bg-zinc-800'
                  }`} />
                  {currentIndex === i && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-transparent sim-progress-bar" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
