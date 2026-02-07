import { Holiday } from '@/lib/types';
import { CalendarFold, ChevronRight } from 'lucide-react';

interface HolidayListProps {
  holidays: Holiday[];
  year: number;
  onSelect: (holiday: Holiday) => void;
}

export const HolidayList = ({ holidays, year, onSelect }: HolidayListProps) => {
  if (holidays.length === 0) {
    return (
      <div className="text-center py-10 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-500 text-xs italic">
        Run an analysis to see the {year} holiday calendar.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-2 scroll-area">
      {holidays.map((holiday) => (
        <button
          key={holiday.date}
          onClick={() => onSelect(holiday)}
          className="group w-full rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left transition hover:border-brand-300 hover:shadow-md hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors line-clamp-1">{holiday.name}</span>
            <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[0.55rem] font-black uppercase tracking-widest ${holiday.scope === 'regional' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
              {holiday.scope === 'regional' ? 'Regional' : 'National'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] text-slate-400 font-bold flex items-center gap-1.5">
              <CalendarFold size={12} className="text-slate-300" />
              {holiday.date}
            </p>
            <ChevronRight size={14} className="text-slate-200 group-hover:text-brand-400 transition-colors" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default HolidayList;
