import { Trash2, Edit2 } from 'lucide-react';
import { Vacation, Holiday } from '@/lib/types';
import { countBusinessDays, formatShortRange } from '@/lib/utils/date';

interface VacationListProps {
  vacations: Vacation[];
  holidays: Holiday[];
  onRemove: (vacationId: string) => void;
  onEdit: (vacation: Vacation) => void;
}

export const VacationList = ({ vacations, holidays, onRemove, onEdit }: VacationListProps) => {
  if (vacations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-slate-500 text-sm">
        No trips planned yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
      {vacations.map((vacation) => {
        const businessDays = countBusinessDays(vacation.startDate, vacation.endDate, holidays);
        return (
          <article key={vacation.id} className="group rounded-2xl border border-slate-100 bg-white/80 p-4 transition hover:border-brand-200 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">{vacation.type}</p>
                <p className="text-lg font-semibold text-slate-900">{vacation.note || 'Untitled trip'}</p>
                <p className="text-sm text-slate-500">{formatShortRange(vacation.startDate, vacation.endDate)}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button className="text-slate-400 hover:text-brand-500" onClick={() => onEdit(vacation)} aria-label="Edit trip">
                  <Edit2 size={18} />
                </button>
                <button className="text-slate-400 hover:text-rose-500" onClick={() => onRemove(vacation.id)} aria-label="Remove trip">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-slate-500">
              <span className="px-3 py-1 rounded-full bg-slate-900/5 font-semibold text-slate-700">{businessDays} PTO days</span>
              {vacation.commuteHours > 0 && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">{vacation.commuteHours}h commute time</span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default VacationList;
