import { Holiday } from '@/lib/types';
import { CalendarFold } from 'lucide-react';

interface HolidayListProps {
  holidays: Holiday[];
  year: number;
  onSelect: (holiday: Holiday) => void;
}

export const HolidayList = ({ holidays, year, onSelect }: HolidayListProps) => {
  if (holidays.length === 0) {
    return (
      <div className="text-sm text-slate-500">Run an analysis to see the {year} holiday calendar.</div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scroll-area">
      {holidays.map((holiday) => (
        <button
          key={holiday.date}
          onClick={() => onSelect(holiday)}
          className="w-full rounded-2xl border border-transparent bg-white/70 px-3 py-2 text-left transition hover:border-brand-200"
        >
          <p className="text-sm font-semibold text-slate-900">{holiday.name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <CalendarFold size={12} />
            {holiday.date}
          </p>
        </button>
      ))}
    </div>
  );
};

export default HolidayList;
