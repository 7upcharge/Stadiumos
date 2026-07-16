/**
 * ScenarioSimulator — Integrated dashboard page
 *
 * Accepts a natural-language what-if question, calls the API,
 * animates pipeline stages, and displays results.
 *
 * Integrated into the main app shell with shared telemetryState,
 * same design tokens, and simulation history persistence.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TelemetryState } from '../types/telemetry';
import type { PipelineResponse, PipelineStage } from '../types/scenarioSimulator';
import SimulatorPipelineProgress from '../components/simulator/SimulatorPipelineProgress';
import StadiumDensityView from '../components/common/StadiumDensityView';
import SimulatorRecommendationCard from '../components/simulator/SimulatorRecommendationCard';
import type { SimulationRecord } from '../utils/simulationHistory';
import { Clock, FlaskConical, History, Zap } from 'lucide-react';

interface ScenarioSimulatorProps {
  telemetryState: TelemetryState;
}

const EXAMPLE_QUERIES = [
  'What happens if Gate 3 closes due to a medical emergency in the next 10 minutes?',
  'Simulate a security threat forcing Gate 1 closure for 30 minutes',
  'What if a sudden rainstorm forces Gate 7 to close during halftime?',
  'Gate 5 has a power outage — what happens in 20 minutes?',
  'What if we need to close Gate 6 for a VIP arrival for 15 minutes?',
];

export default function ScenarioSimulator({ telemetryState }: ScenarioSimulatorProps) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [result, setResult] = useState<PipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SimulationRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    fetch('/api/simulations')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setHistory(data))
      .catch(err => console.error('Failed to load simulation history:', err));
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const handleSubmit = useCallback(async (submittedQuery?: string) => {
    const q = (submittedQuery ?? query).trim();
    if (!q) return;

    clearTimers();
    setResult(null);
    setError(null);

    setStage('parsing');

    timersRef.current.push(
      setTimeout(() => setStage('simulating'), 900),
      setTimeout(() => setStage('reasoning'), 1900),
    );

    try {
      const response = await fetch('/api/scenario-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data: PipelineResponse = await response.json();

      clearTimers();

      setStage('reasoning');
      await sleep(400);

      setResult(data);
      setStage('complete');

      // Store in history
      try {
        const historyRes = await fetch('/api/simulations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            result: data,
            confidence: data.reasoning.confidence,
            actionPlan: data.reasoning.action_plan,
          }),
        });
        if (historyRes.ok) {
          const newRecord = await historyRes.json();
          setHistory(prev => [newRecord, ...prev]);
        }
      } catch (err) {
        console.error('Failed to persist simulation run:', err);
      }
    } catch (e) {
      clearTimers();
      setError(e instanceof Error ? e.message : 'An error occurred');
      setStage('error');
    }
  }, [query, clearTimers]);

  const handleExampleClick = useCallback((example: string) => {
    setQuery(example);
    handleSubmit(example);
  }, [handleSubmit]);

  const isRunning = stage !== 'idle' && stage !== 'complete' && stage !== 'error';

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-50 flex items-center gap-2">
          <FlaskConical size={20} className="text-cyan-400" />
          Scenario Simulator
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Ask a what-if question about stadium operations. The AI runs a real simulation
          pipeline — parsing, computing crowd flow, and generating an actionable plan.
        </p>
      </div>

      {/* Live Telemetry Context */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Live Attendance</p>
          <p className="text-lg font-bold text-zinc-50">{telemetryState.totalAttendance.toLocaleString()}</p>
          <p className="text-[9px] text-zinc-500">Currently in venue</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Active Gates</p>
          <p className="text-lg font-bold text-zinc-50">{telemetryState.activeGates}</p>
          <p className="text-[9px] text-zinc-500">Operational</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Active Incidents</p>
          <p className="text-lg font-bold text-zinc-50">{telemetryState.activeIncidents.length}</p>
          <p className="text-[9px] text-zinc-500">Requiring attention</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Shuttle Wait</p>
          <p className="text-lg font-bold text-zinc-50">{telemetryState.transit.shuttleWaitTime} min</p>
          <p className="text-[9px] text-zinc-500">Current average</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-4">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What happens if Gate 3 closes due to a medical emergency?"
            className="flex-1 px-4 py-3 text-sm rounded-md border border-zinc-800 bg-zinc-900 text-zinc-50 placeholder-zinc-500 outline-none focus:border-zinc-700 transition-colors"
            disabled={isRunning}
          />
          <button
            type="submit"
            disabled={isRunning || !query.trim()}
            className="rounded-md bg-gradient-to-r from-cyan-600 to-cyan-700 px-5 py-3 text-sm font-semibold text-white hover:from-cyan-500 hover:to-cyan-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running
              </>
            ) : (
              <>
                <Zap size={14} />
                Simulate
              </>
            )}
          </button>
        </form>

        {/* Example queries */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider self-center mr-1 font-mono">
            Try:
          </span>
          {EXAMPLE_QUERIES.map((example, i) => (
            <button
              key={i}
              onClick={() => handleExampleClick(example)}
              disabled={isRunning}
              className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:-translate-y-px transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {example.length > 50 ? example.slice(0, 50) + '…' : example}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline Progress */}
      {stage !== 'idle' && stage !== 'error' && (
        <SimulatorPipelineProgress stage={stage} />
      )}

      {/* Error State */}
      {stage === 'error' && error && (
        <div className="rounded-lg border border-red-500/30 bg-zinc-950 p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-400">Pipeline Error</p>
              <p className="text-xs text-zinc-400 mt-1">{error}</p>
              <button
                onClick={() => { setStage('idle'); setError(null); }}
                className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {stage === 'complete' && result && (
        <div className="space-y-6">
          {/* Demo mode badge */}
          {result.demoMode && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-400/80">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Demo mode — using local simulation engine. Set GEMINI_API_KEY for live AI parsing & reasoning.
            </div>
          )}

          {/* Timing bar */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500 font-mono">
            <span>Pipeline completed in <strong className="text-cyan-400">{result.timing.totalMs}ms</strong></span>
            <span className="text-zinc-700">|</span>
            <span>Parse: {result.timing.parseMs}ms</span>
            <span>Simulate: {result.timing.simulateMs}ms</span>
            <span>Reason: {result.timing.reasonMs}ms</span>
          </div>

          {/* Parsed scenario badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <ParsedBadge label="Trigger" value={result.parsed.trigger.replace(/_/g, ' ')} />
            <ParsedBadge label="Location" value={result.parsed.location} />
            <ParsedBadge label="Severity" value={result.parsed.severity} />
            <ParsedBadge label="Horizon" value={`${result.parsed.time_horizon_minutes} min`} />
          </div>

          {/* Stadium Map + Recommendation */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
            <StadiumDensityView
              beforeState={result.simulation.beforeState}
              afterState={result.simulation.afterState}
              affectedGateId={result.simulation.affectedGateId}
            />
            <SimulatorRecommendationCard
              reasoning={result.reasoning}
              simulation={result.simulation}
            />
          </div>
        </div>
      )}

      {/* Past Simulations History */}
      {history.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors w-full"
          >
            <History size={14} className="text-zinc-500" />
            <span>Past Simulations ({history.length})</span>
            <svg
              className={`w-3 h-3 ml-auto transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHistory && (
            <div className="mt-4 space-y-2">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start gap-3 border border-zinc-800/50 rounded-lg p-3 hover:border-zinc-700 transition-colors cursor-pointer"
                  onClick={() => {
                    setQuery(record.query);
                    setResult(record.result);
                    setStage('complete');
                  }}
                >
                  <Clock size={12} className="text-zinc-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-300 truncate">{record.query}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        record.confidence >= 0.75 ? 'text-emerald-400' :
                        record.confidence >= 0.5 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {Math.round(record.confidence * 100)}% conf.
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {record.actionPlan.length} actions
                      </span>
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

function ParsedBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-800/30 rounded-full px-3 py-1">
      <span className="text-[9px] text-zinc-500 uppercase font-mono">{label}:</span>
      <span className="text-[11px] text-cyan-400 font-medium capitalize">{value}</span>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
