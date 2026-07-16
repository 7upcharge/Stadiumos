import { useState } from 'react';
import { 
  Bell, 
  Search, 
  Menu,
  CornerDownRight,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import type { TelemetryState } from '../../types/telemetry';

interface TopNavProps {
  currentPage: string;
  setMobileOpen: (open: boolean) => void;
  telemetryState: TelemetryState;
  onOpenCommandPalette: () => void;
}

export default function TopNav({ currentPage, setMobileOpen, telemetryState, onOpenCommandPalette }: TopNavProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageLabel = (id: string) => {
    switch (id) {
      case 'home': return 'Home Overview';
      case 'fan': return 'Fan Portal';
      case 'ops': return 'Operations Console';
      case 'security': return 'Security Dashboard';
      case 'volunteer': return 'Volunteer Center';
      case 'incidents': return 'Incident Center';
      case 'analytics': return 'Analytics HQ';
      case 'simulator': return 'Scenario Simulator';
      case 'accessibility': return 'Access Shield';
      case 'settings': return 'System Settings';
      default: return 'StadiumOS AI';
    }
  };

  const activeIncidents = telemetryState.activeIncidents || [];

  // Check for critical active incidents
  const criticalIncident = activeIncidents.find(inc => inc.severity === 'CRITICAL' || inc.severity === 'HIGH');

  // Check for high density zones (> 4.0 people/sqm)
  let highDensityZone: { name: string; density: number } | null = null;
  if (telemetryState.zones) {
    for (const [zoneName, zoneData] of Object.entries(telemetryState.zones)) {
      if (zoneData.crowdDensity > 4.0) {
        highDensityZone = { name: zoneName, density: zoneData.crowdDensity };
        break;
      }
    }
  }

  const alertActive = !!criticalIncident || !!highDensityZone;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileOpen(true)}
          className="flex items-center text-zinc-400 hover:text-zinc-50 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 font-medium text-xs text-zinc-500">
          <span>Console</span>
          <CornerDownRight size={10} className="text-zinc-600" />
          <span className="font-semibold text-zinc-200">{getPageLabel(currentPage)}</span>
        </div>
      </div>

      {/* Dynamic Warning Alert Banner in the Head */}
      {alertActive && (
        <div className="hidden md:flex items-center gap-2 rounded-full bg-red-950/40 border border-red-500/30 px-3.5 py-1.5 text-red-400 text-[10px] font-mono tracking-wide font-bold animate-pulse shadow-md shadow-red-950/20">
          <AlertTriangle size={13} className="text-red-500 animate-pulse" />
          <span>
            {criticalIncident 
              ? `ALERT: ${criticalIncident.title.toUpperCase()}`
              : `OVERCROWDING: ${highDensityZone?.name.toUpperCase()} (${highDensityZone?.density}/SQM)`
            }
          </span>
        </div>
      )}

      <div className="flex items-center gap-5">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <Wifi size={12} className="text-emerald-500 animate-pulse-opacity" />
          <span>Syncing Live</span>
        </div>

        {/* Search Command Palette Trigger */}
        <button 
          onClick={onOpenCommandPalette}
          className="relative flex items-center rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-left text-zinc-500 text-xs hover:border-zinc-700 w-[180px]"
          aria-label="Open command palette"
        >
          <Search size={12} className="mr-2 text-zinc-500" />
          <span className="flex-grow">Search...</span>
          <kbd className="pointer-events-none hidden rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400 md:inline-block">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Icon Tray */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex text-zinc-400 hover:text-zinc-50"
            aria-label={`System notifications. ${activeIncidents.length} alert(s) active.`}
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {activeIncidents.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-8 z-50 w-72 rounded-lg border border-zinc-800 bg-zinc-950 p-3 shadow-2xl">
              <div className="mb-2 flex justify-between border-b border-zinc-800 pb-2 font-semibold text-xs">
                <span>System Warnings</span>
                <span className="text-zinc-500">({activeIncidents.length})</span>
              </div>
              
              {activeIncidents.length === 0 ? (
                <div className="py-2 text-center text-zinc-500 text-[10px]">
                  No warnings active.
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {activeIncidents.map(inc => (
                    <div key={inc.id} className="border-b border-zinc-900 pb-2 text-[10px] last:border-b-0">
                      <div className={`font-semibold ${inc.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`}>
                        {inc.title}
                      </div>
                      <div className="mt-0.5 text-zinc-400">{inc.zone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
