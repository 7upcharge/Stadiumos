import { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import AIRecommendationList from './components/ai/AIRecommendationList';
import CommandPalette from './components/common/CommandPalette';
import { subscribeToTelemetry } from './utils/telemetryEngine';
import type { TelemetryState } from './types/telemetry';

// Import Pages
import Home from './pages/Home';
import FanPortal from './pages/FanPortal';
import OpsDashboard from './pages/OpsDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import IncidentCenter from './pages/IncidentCenter';
import Analytics from './pages/Analytics';
import ScenarioSimulator from './pages/ScenarioSimulator';
import AccessibilityCenter from './pages/AccessibilityCenter';
import Settings from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [telemetryState, setTelemetryState] = useState<TelemetryState | null>(null);

  // Subscribe to simulated telemetry update events
  useEffect(() => {
    const unsubscribe = subscribeToTelemetry((newState) => {
      setTelemetryState({ ...newState });
    });
    return unsubscribe;
  }, []);

  // Keyboard shortcut listener for Command Palette (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!telemetryState) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 font-mono text-zinc-500 text-xs">
        BOOTING STADIUMOS CORE CONTROLLERS...
      </div>
    );
  }

  // Render active page view
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home telemetryState={telemetryState} />;
      case 'fan':
        return <FanPortal telemetryState={telemetryState} />;
      case 'ops':
        return <OpsDashboard telemetryState={telemetryState} />;
      case 'security':
        return <SecurityDashboard telemetryState={telemetryState} />;
      case 'volunteer':
        return <VolunteerDashboard />;
      case 'incidents':
        return <IncidentCenter telemetryState={telemetryState} />;
      case 'analytics':
        return <Analytics telemetryState={telemetryState} />;
      case 'simulator':
        return <ScenarioSimulator telemetryState={telemetryState} />;
      case 'accessibility':
        return <AccessibilityCenter telemetryState={telemetryState} />;
      case 'settings':
        return <Settings />;
      default:
        return <Home telemetryState={telemetryState} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      {/* Sidebar navigation */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main content viewport */}
      <div className="flex flex-grow flex-col min-w-0 h-screen overflow-y-auto">
        <TopNav 
          currentPage={currentPage} 
          setMobileOpen={setMobileOpen} 
          telemetryState={telemetryState}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="flex-grow p-6">
          {/* Split grid: Page Content + Contextual AI Sidebar Panel */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-grow w-full min-w-0">
              {renderPage()}
            </div>
            
            {/* Context-aware AI recommendations list */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
              <AIRecommendationList currentPage={currentPage} telemetryState={telemetryState} />
            </div>
          </div>
        </main>
      </div>

      {/* Accessible command palette modal */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
