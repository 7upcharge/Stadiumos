import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, Navigation, Shield, Sliders } from 'lucide-react';
import { triggerAction } from '../../utils/telemetryEngine';

interface CommandItem {
  id: string;
  name: string;
  category: 'Pages' | 'Quick Actions';
  icon: any;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentPage: (page: string) => void;
}

export default function CommandPalette({ isOpen, onClose, setCurrentPage }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    { id: 'nav-home', name: 'Go to Home Overview', category: 'Pages', icon: Navigation, action: () => setCurrentPage('home') },
    { id: 'nav-fan', name: 'Go to Fan Portal', category: 'Pages', icon: Navigation, action: () => setCurrentPage('fan') },
    { id: 'nav-ops', name: 'Go to Operations Console', category: 'Pages', icon: Navigation, action: () => setCurrentPage('ops') },
    { id: 'nav-security', name: 'Go to Security Dashboard', category: 'Pages', icon: Navigation, action: () => setCurrentPage('security') },
    { id: 'nav-volunteer', name: 'Go to Volunteer Center', category: 'Pages', icon: Navigation, action: () => setCurrentPage('volunteer') },
    { id: 'nav-incidents', name: 'Go to Incident Center', category: 'Pages', icon: Navigation, action: () => setCurrentPage('incidents') },
    { id: 'nav-analytics', name: 'Go to Analytics HQ', category: 'Pages', icon: Navigation, action: () => setCurrentPage('analytics') },
    { id: 'nav-accessibility', name: 'Go to Access Shield', category: 'Pages', icon: Navigation, action: () => setCurrentPage('accessibility') },
    { id: 'nav-simulator', name: 'Go to Scenario Simulator', category: 'Pages', icon: Navigation, action: () => setCurrentPage('simulator') },
    { id: 'nav-settings', name: 'Go to Settings', category: 'Pages', icon: Navigation, action: () => setCurrentPage('settings') },
    
    { id: 'act-redirect', name: 'Trigger Dynamic Gate Redirection', category: 'Quick Actions', icon: Shield, action: () => triggerAction('TRIGGER_REDIRECTION', {}) },
    { id: 'act-eco', name: 'Apply Eco Power Mode (2100 kW)', category: 'Quick Actions', icon: Sliders, action: () => triggerAction('SET_GRID_POWER', { val: 2100 }) },
    { id: 'act-dispatch', name: 'Dispatch Guard Unit 4 to Gate 4', category: 'Quick Actions', icon: Terminal, action: () => triggerAction('DISPATCH_SECURITY', { incidentId: 'inc-109', unitName: 'Guard Unit 4' }) },
    { id: 'act-resolve', name: 'Resolve Gate 4 Crowd Incident', category: 'Quick Actions', icon: Shield, action: () => triggerAction('RESOLVE_INCIDENT', { incidentId: 'inc-109' }) },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(search.toLowerCase()) || 
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[activeIndex]) {
          filteredCommands[activeIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands]);

  // Close when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/70 p-4 pt-[15vh] backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-lg overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <div className="flex items-center border-b border-zinc-800 px-4 py-3">
          <Search size={16} className="mr-3 text-zinc-500" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Type a command or search..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveIndex(0);
            }}
            className="w-full bg-transparent text-sm text-zinc-50 placeholder-zinc-500 outline-none"
          />
          <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">ESC</span>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs font-mono">
              No matching commands found
            </div>
          ) : (
            <div>
              {/* Group by category */}
              {['Pages', 'Quick Actions'].map(category => {
                const categoryCmds = filteredCommands.filter(c => c.category === category);
                if (categoryCmds.length === 0) return null;

                return (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="px-3 py-1.5 font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
                      {category}
                    </div>
                    <ul className="list-none flex flex-col gap-0.5">
                      {categoryCmds.map(cmd => {
                        const globalIndex = filteredCommands.indexOf(cmd);
                        const Icon = cmd.icon;
                        const isSelected = activeIndex === globalIndex;
                        return (
                          <li key={cmd.id}>
                            <button
                              onClick={() => {
                                cmd.action();
                                onClose();
                              }}
                              className={`
                                flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs transition-colors
                                ${isSelected ? 'bg-zinc-900 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'}
                              `}
                            >
                              <Icon size={14} className={isSelected ? 'text-purple-400' : 'text-zinc-500'} />
                              <span className="flex-grow">{cmd.name}</span>
                              {isSelected && (
                                <span className="font-mono text-[9px] text-zinc-500">⏎ Select</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
