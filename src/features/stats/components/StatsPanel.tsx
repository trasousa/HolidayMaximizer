import type { ReactNode } from 'react';
import { Calendar, Clock, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';

interface StatsPanelProps {
  allowance: number;
  used: number;
  commuteHours: number;
  efficiency: number;
  holidayCount: number;
  topTrips?: any[];
  isProjection?: boolean;
}

export const StatsPanel = ({ allowance, used, commuteHours, efficiency, holidayCount, topTrips = [], isProjection = false }: StatsPanelProps) => {
  const remaining = allowance - used;
  const progress = allowance > 0 ? Math.min(100, (used / allowance) * 100) : 0;
  const efficiencyLabel = efficiency ? `${efficiency.toFixed(1)}x` : '—';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
      <section className={`glass-panel px-6 py-6 flex flex-col gap-8 transition-all duration-500 bg-gradient-to-br from-white via-white to-brand-50 shadow-xl border-white/60 ${isProjection ? 'ring-2 ring-amber-400 ring-offset-2 scale-[1.01]' : ''}`}>
        <div className="flex-1 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-slate-400">PTO balance</p>
                {isProjection && (
                  <span className="bg-amber-100 text-amber-700 text-[0.55rem] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                    PROJECTION
                  </span>
                )}
              </div>
              <p className={`text-4xl font-bold ${remaining < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {remaining} <span className="text-xl font-medium text-slate-400">days left</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-slate-400">Allowance</p>
              <p className="text-xl font-semibold text-slate-600">{allowance}</p>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isProjection ? 'opacity-80' : ''}`}
              style={{
                width: `${progress}%`,
                background: remaining < 0 ? 'linear-gradient(90deg,#fb7185,#f43f5e)' : 'linear-gradient(90deg,#8b5cf6,#3b82f6)',
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatBadge label="Holidays" icon={<Calendar size={18} />} value={holidayCount} color="text-rose-500" />
          <StatBadge label="Multiplier" icon={<Sparkles size={18} />} value={efficiencyLabel} color="text-amber-500" isProjection={isProjection} />
          <StatBadge label="Commute" icon={<Clock size={18} />} value={`${commuteHours}h`} color="text-emerald-500" />
        </div>
      </section>

      <section className="glass-panel p-6 bg-white/80 shadow-xl border-white/60">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Top Impact Trips</h3>
          </div>
          <span className="text-[0.65rem] font-bold text-slate-400 uppercase">By PTO Days</span>
        </header>
        <div className="space-y-3">
          {topTrips.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">No trips recorded yet</div>
          ) : (
            topTrips.map((trip, idx) => (
              <div key={trip.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 text-[0.65rem] font-bold text-white">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{trip.note || 'Untitled'}</p>
                    <p className="text-[0.6rem] text-slate-400 font-medium">{trip.totalDays} total days</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-brand-600">{trip.businessDays}d</p>
                  <p className="text-[0.55rem] text-slate-400 uppercase tracking-tighter">PTO used</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const StatBadge = ({ label, value, icon, color, isProjection = false }: { label: string; value: string | number; icon: ReactNode; color: string; isProjection?: boolean }) => (
  <div className={`group rounded-2xl border border-white/60 bg-white/50 px-3 py-3 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${isProjection && label === 'Multiplier' ? 'bg-amber-50 border-amber-200' : ''}`}>
    <div className={`flex items-center justify-center gap-2 ${color} mb-1`}>
      {icon}
      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    </div>
    <p className={`text-2xl font-bold text-slate-900 text-center ${isProjection && label === 'Multiplier' ? 'text-amber-700' : ''}`}>{value}</p>
  </div>
);

export default StatsPanel;
