import { useState } from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface ChartPlaceholderProps {
  type?: 'bar' | 'heatmap' | 'line';
  data?: ChartData[];
  height?: number;
}

export default function ChartPlaceholder({ type = 'bar', data = [], height = 140 }: ChartPlaceholderProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Render Bar Chart
  const renderBarChart = () => {
    const chartData = data.length > 0 ? data : [
      { label: '08:00', value: 40 },
      { label: '09:00', value: 65 },
      { label: '10:00', value: 85 },
      { label: '11:00', value: 50 },
      { label: '12:00', value: 95 },
      { label: '13:00', value: 70 },
      { label: '14:00', value: 60 },
      { label: '15:00', value: 80 }
    ];

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-1.5 pt-4" style={{ height: `${height}px` }}>
          {chartData.map((d, index) => (
            <div 
              key={index} 
              className={`flex-grow rounded-sm cursor-pointer relative transition-all duration-200 ${hoveredIndex === index ? 'bg-zinc-50' : 'bg-zinc-800 hover:bg-zinc-600'}`}
              style={{ height: `${d.value}%` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === index && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-50 pointer-events-none whitespace-nowrap z-10">
                  {d.value}%
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between font-mono text-[9px] text-zinc-500">
          {chartData.map((d, i) => (
            <span key={i} className="flex-grow text-center">{d.label}</span>
          ))}
        </div>
      </div>
    );
  };

  // 2. Render Heatmap Placeholder (Grid style)
  const renderHeatmap = () => {
    const cells = Array.from({ length: 96 }, (_, i) => {
      const val = Math.sin(i / 5) * 2 + Math.cos(i / 10) * 2;
      let level = 0;
      if (val > 2.5) level = 4;
      else if (val > 1.2) level = 3;
      else if (val > 0) level = 2;
      else if (val > -1.2) level = 1;
      return { id: i, level };
    });

    const getCellColor = (level: number) => {
      switch (level) {
        case 4: return 'bg-purple-500/95';
        case 3: return 'bg-purple-600/70';
        case 2: return 'bg-purple-800/40';
        case 1: return 'bg-purple-950/30';
        default: return 'bg-zinc-900';
      }
    };

    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-24 gap-[3px] mt-3">
          {cells.map(c => (
            <div 
              key={c.id} 
              className={`aspect-square rounded-[1px] hover:outline hover:outline-zinc-400 transition-all cursor-pointer ${getCellColor(c.level)}`}
              title={`Cell ${c.id}: Level ${c.level}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span>Gate Egress Peak (08:00)</span>
          <div className="flex gap-1.5 items-center">
            <span>Low</span>
            <div className="h-2 w-2 rounded-[1px] bg-zinc-900" />
            <div className="h-2 w-2 rounded-[1px] bg-purple-950/30" />
            <div className="h-2 w-2 rounded-[1px] bg-purple-800/40" />
            <div className="h-2 w-2 rounded-[1px] bg-purple-600/70" />
            <div className="h-2 w-2 rounded-[1px] bg-purple-500/95" />
            <span>Critical</span>
          </div>
        </div>
      </div>
    );
  };

  // 3. Render Trend Line SVG Chart
  const renderLineChart = () => {
    return (
      <div className="flex flex-col gap-3">
        <div style={{ height: `${height}px` }} className="w-full relative">
          <svg className="w-full h-full overflow-visible">
            {/* Grid lines */}
            <line x1="0" y1="20" x2="100%" y2="20" stroke="#27272a" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="60" x2="100%" y2="60" stroke="#27272a" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="100%" y2="100" stroke="#27272a" strokeWidth="0.5" strokeDasharray="4 4" />
            
            {/* Draw spline curve */}
            <path
              d="M0,90 Q50,20 100,50 T200,80 T300,30 T400,60"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              style={{ vectorEffect: 'non-scaling-stroke' }}
            />
            {/* Live indicator dot */}
            <circle cx="95%" cy="40" r="4" fill="#a855f7" />
            <circle cx="95%" cy="40" r="8" fill="none" stroke="#a855f7" strokeWidth="1" className="animate-pulse-opacity" />
          </svg>
        </div>
        <div className="flex justify-between font-mono text-[9px] text-zinc-500">
          <span>09:00</span>
          <span>11:00</span>
          <span>13:00</span>
          <span>15:00</span>
        </div>
      </div>
    );
  };

  switch (type) {
    case 'bar': return renderBarChart();
    case 'heatmap': return renderHeatmap();
    case 'line': return renderLineChart();
    default: return renderBarChart();
  }
}
