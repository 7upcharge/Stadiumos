import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  subtext: string;
  badgeText?: string;
  badgeStatus?: 'default' | 'success' | 'warning' | 'error';
  icon?: LucideIcon;
  iconColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  subtext, 
  badgeText, 
  badgeStatus = 'default', 
  icon: Icon, 
  iconColor = 'text-zinc-400' 
}: StatsCardProps) {
  
  const getBadgeClasses = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
      case 'warning':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-400';
      case 'error':
        return 'border-red-500/20 bg-red-500/10 text-red-400';
      default:
        return 'border-zinc-800 bg-zinc-900 text-zinc-400';
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">{title}</span>
        {Icon && <Icon size={16} className={iconColor} />}
      </div>
      
      <div className="font-mono text-2xl font-bold tracking-tight text-zinc-50">
        {value}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className="text-[10px] text-zinc-400">{subtext}</span>
        {badgeText && (
          <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wide uppercase ${getBadgeClasses(badgeStatus)}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
