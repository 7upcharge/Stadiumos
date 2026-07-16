import { useState } from 'react';
import { Award, CheckSquare, Users, BookOpen } from 'lucide-react';
import StatsCard from '../components/common/StatsCard';

interface TaskItem {
  id: string;
  title: string;
  desc: string;
  checked: boolean;
}

export default function VolunteerDashboard() {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 'v-1', title: 'Verify ticket scans at gate 2', desc: 'Assist ticket marshals with scanning failures.', checked: true },
    { id: 'v-2', title: 'Distribute accessibility guides', desc: 'Deliver guides to accessibility centers in Section 102.', checked: false },
    { id: 'v-3', title: 'Inspect pathway lighting in South Tunnel', desc: 'Confirm standard lighting is completely operational.', checked: false }
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) return { ...t, checked: !t.checked };
      return t;
    }));
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-50">Volunteer Center</h1>
        <p className="text-xs text-zinc-400">Shift coordination, checklist routines, and field reporting guides</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          title="Active Volunteers" 
          value="340 / 340" 
          subtext="Full sector rosters online"
          badgeText="Sufficient"
          badgeStatus="success"
          icon={Users}
        />
        <StatsCard 
          title="Tasks Completed" 
          value={`${tasks.filter(t => t.checked).length} / ${tasks.length}`} 
          subtext="Updates synced to HQ"
          badgeText="Active Check"
          badgeStatus="default"
          icon={CheckSquare}
        />
        <StatsCard 
          title="Avg Checkpoint Rating" 
          value="4.8 ★" 
          subtext="Visitor feedback scores"
          badgeText="Outstanding"
          badgeStatus="success"
          icon={Award}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic task checklist */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Your Current Duty Checklists</h3>
            <p className="text-[10px] text-zinc-500">Complete checklists to update the main operations center.</p>
          </div>

          <div className="flex flex-col gap-3">
            {tasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => toggleTask(task.id)}
                className={`
                  rounded-md border p-3.5 flex items-start gap-3 cursor-pointer select-none transition-all duration-150
                  ${task.checked ? 'border-purple-500/20 bg-purple-500/5' : 'border-zinc-850 bg-zinc-900/10 hover:border-zinc-700'}
                `}
              >
                <input 
                  type="checkbox" 
                  checked={task.checked} 
                  onChange={() => {}} // handled by parent click
                  className="mt-1 h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  onClick={(e) => e.stopPropagation()} // prevent double trigger
                />
                <div className="flex flex-col gap-0.5">
                  <span className={`text-xs font-semibold ${task.checked ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                    {task.title}
                  </span>
                  <span className="text-[10px] text-zinc-500">{task.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volunteer guides */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Operating Guidelines RAG Docs</h3>
            <p className="text-[10px] text-zinc-500">Reference manuals provided to AI assistant models.</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded border border-zinc-850 p-3 flex gap-3 items-start bg-zinc-900/10 hover:border-zinc-750 transition-colors">
              <BookOpen size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-zinc-200">Emergency Crowd Release Protocol</div>
                <div className="text-[10px] text-zinc-500 mt-1">Step-by-step gate release priority rules for evacuation events.</div>
              </div>
            </div>

            <div className="rounded border border-zinc-850 p-3 flex gap-3 items-start bg-zinc-900/10 hover:border-zinc-750 transition-colors">
              <BookOpen size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-zinc-200">Ticketing Support & Language Aids</div>
                <div className="text-[10px] text-zinc-500 mt-1">Language card translations to aid non-English speaking visitors.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
