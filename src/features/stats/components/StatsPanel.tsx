import type { ReactNode } from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';

interface StatsPanelProps {
  allowance: number;
  used: number;
  commuteHours: number;
  efficiency: number;
  holidayCount: number;
}

export const StatsPanel = ({ allowance, used, commuteHours, efficiency, holidayCount }: StatsPanelProps) => {
  const remaining = allowance - used;
  const progress = allowance > 0 ? Math.min(100, (used / allowance) * 100) : 0;
  const efficiencyLabel = efficiency ? `${efficiency.toFixed(1)}x` : '—';

  return (
    <section className="glass-panel px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1 space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">PTO balance</p>
            <p className="text-3xl font-semibold text-slate-900">{remaining} days</p>
          </div>
          <p className="text-sm text-slate-500">of {allowance}</p>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${remaining < 0 ? 'bg-rose-500' : 'bg-brand-500'}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-4 text-center">
        <StatBadge label="Holidays" icon={<Calendar size={16} />} value={holidayCount} />
        <StatBadge label="Multiplier" icon={<Sparkles size={16} />} value={efficiencyLabel} />
        <StatBadge label="Commute" icon={<Clock size={16} />} value={`${commuteHours}h`} />
      </div>
    </section>
  );
};

const StatBadge = ({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) => (
  <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur px-3 py-2">
    <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
      {icon}
      <span className="uppercase tracking-[0.2em]">{label}</span>
    </div>
    <p className="text-xl font-semibold text-slate-900">{value}</p>
  </div>
);

export default StatsPanel;
