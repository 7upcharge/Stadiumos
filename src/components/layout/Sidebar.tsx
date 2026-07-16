
import { 
  Home, 
  Users, 
  Activity, 
  Shield, 
  UserCheck, 
  AlertTriangle, 
  BarChart3, 
  FlaskConical,
  Accessibility, 
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navItems = [
  { id: 'home', name: 'Home Overview', icon: Home },
  { id: 'fan', name: 'Fan Portal', icon: Users },
  { id: 'ops', name: 'Operations Console', icon: Activity },
  { id: 'security', name: 'Security Dashboard', icon: Shield },
  { id: 'volunteer', name: 'Volunteer Center', icon: UserCheck },
  { id: 'incidents', name: 'Incident Center', icon: AlertTriangle },
  { id: 'analytics', name: 'Analytics HQ', icon: BarChart3 },
  { id: 'simulator', name: 'Scenario Simulator', icon: FlaskConical },
  { id: 'accessibility', name: 'Access Shield', icon: Accessibility },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, setCurrentPage, mobileOpen, setMobileOpen }: SidebarProps) {
  return (
    <aside 
      className={`
        fixed top-0 bottom-0 left-0 z-50 flex w-[240px] flex-col border-r border-zinc-800 bg-zinc-950 p-5 
        transition-all duration-300 md:sticky md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:flex'}
      `} 
      aria-label="Main Navigation"
    >
      <div className="mb-5 flex items-center gap-2 border-b border-zinc-800 pb-5">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded bg-zinc-50 font-bold text-black text-xs">S</div>
        <div>
          <div className="font-semibold text-zinc-50 text-sm tracking-tight">StadiumOS AI</div>
        </div>
        <div className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">v1.2</div>
        
        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-zinc-400 hover:text-zinc-50"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-grow">
        <ul className="flex flex-col gap-1 list-none">
          <li className="mb-2 px-3 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Operating Console
          </li>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setCurrentPage(item.id);
                    setMobileOpen(false);
                  }}
                  className={`
                    flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-medium text-xs transition-colors
                    ${isActive 
                      ? 'border border-zinc-700 bg-zinc-900 text-zinc-50 shadow' 
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50'}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={14} />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-zinc-800 pt-3 text-[10px] text-zinc-500">
        <p>FIFA 2026 World Cup</p>
        <p>Host Stadium OS</p>
      </div>
    </aside>
  );
}
