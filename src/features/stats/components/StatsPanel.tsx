import type { ReactNode } from 'react';
import { CalendarHeart, Clock, Plane, Sparkles, TrendingUp } from 'lucide-react';
import type { TripStat } from '@/lib/services/statsService';
import { formatShortRange } from '@/lib/utils/date';

interface StatsPanelProps {
  allowance: number;
  used: number;
  totalDaysOff: number;
  commuteHours: number;
  efficiency: number;
  holidayCount: number;
  workdayHolidayCount: number;
  topTrips?: TripStat[];
  isProjection?: boolean;
  year: number;
}

export const StatsPanel = ({
  allowance,
  used,
  totalDaysOff,
  commuteHours,
  efficiency,
  holidayCount,
  workdayHolidayCount,
  topTrips = [],
  isProjection = false,
  year,
}: StatsPanelProps) => {
  const remaining = allowance - used;
  const progress = allowance > 0 ? Math.min(100, (used / allowance) * 100) : 0;
  const efficiencyLabel = efficiency ? `${efficiency.toFixed(1)}×` : '—';

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr,340px]">
      <section className={`card p-5 transition ${isProjection ? 'ring-2 ring-amber-400' : ''}`} aria-live="polite">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="eyebrow">PTO balance {year}</p>
              {isProjection && <span className="chip bg-amber-100 text-amber-800">Preview</span>}
            </div>
            <p className={`mt-1 text-4xl font-extrabold tracking-tight tabular-nums ${remaining < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {remaining}
              <span className="ml-2 text-base font-medium text-slate-400">of {allowance} days left</span>
            </p>
          </div>
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{used}</span> PTO {used === 1 ? "day" : "days"} booked
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={allowance}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: remaining < 0 ? 'linear-gradient(90deg,#fb7185,#e11d48)' : 'linear-gradient(90deg,#8b5cf6,#0ea5e9)',
            }}
          />
        </div>
        {remaining < 0 && <p className="mt-2 text-xs font-medium text-rose-600">You are {Math.abs(remaining)} days over your allowance.</p>}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={<Plane size={16} />} tone="text-brand-600 bg-brand-50" label="Days off" value={totalDaysOff} hint="incl. weekends & holidays" />
          <StatTile icon={<Sparkles size={16} />} tone="text-amber-600 bg-amber-50" label="Multiplier" value={efficiencyLabel} hint="days off per PTO day" highlight={isProjection} />
          <StatTile icon={<CalendarHeart size={16} />} tone="text-rose-600 bg-rose-50" label="Holidays" value={holidayCount} hint={`${workdayHolidayCount} on workdays`} />
          <StatTile icon={<Clock size={16} />} tone="text-emerald-600 bg-emerald-50" label="Commute" value={`${commuteHours}h`} hint="logged this year" />
        </div>
      </section>

      <section className="card p-5">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <TrendingUp size={16} className="text-brand-500" /> Biggest trips
          </h3>
          <span className="eyebrow">PTO used</span>
        </header>
        {topTrips.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No trips in {year} yet. Pick a suggestion or click the calendar.</p>
        ) : (
          <ol className="space-y-1">
            {topTrips.map((trip, idx) => (
              <li key={trip.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[0.65rem] font-bold text-white">{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{trip.note || 'Untitled trip'}</p>
                    <p className="text-xs text-slate-400">
                      {formatShortRange(trip.startDate, trip.endDate)} · {trip.totalDays} {trip.totalDays === 1 ? "day" : "days"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-brand-600">{trip.businessDays}d</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};

const StatTile = ({ label, value, hint, icon, tone, highlight = false }: { label: string; value: string | number; hint: string; icon: ReactNode; tone: string; highlight?: boolean }) => (
  <div className={`rounded-xl p-3 ring-1 transition ${highlight ? 'bg-amber-50 ring-amber-200' : 'bg-slate-50/60 ring-slate-100'}`}>
    <div className="flex items-center gap-2">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
    </div>
    <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    <p className="text-[0.68rem] text-slate-400">{hint}</p>
  </div>
);

export default StatsPanel;
