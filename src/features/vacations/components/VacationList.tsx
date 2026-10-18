import { Trash2, Pencil } from 'lucide-react';
import { Vacation, Holiday, VacationCategory } from '@/lib/types';
import { clampToYear, countBusinessDays, countTotalDays, formatShortRange } from '@/lib/utils/date';
import { isPtoVacation } from '@/lib/services/statsService';

interface VacationListProps {
  vacations: Vacation[];
  categories: VacationCategory[];
  holidays: Holiday[];
  weekendDays: number[];
  year: number;
  onRemove: (vacation: Vacation) => void;
  onEdit: (vacation: Vacation) => void;
}

export const VacationList = ({ vacations, categories, holidays, weekendDays, year, onRemove, onEdit }: VacationListProps) => {
  const inYear = vacations.filter((v) => clampToYear(v.startDate, v.endDate, year));
  if (inYear.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No trips planned for {year} yet.</p>;
  }
  const holidaySet = new Set(holidays.map((h) => h.date));

  return (
    <ul className="space-y-2">
      {inYear.map((vacation) => {
        const category = categories.find((c) => c.id === vacation.type);
        const [from, to] = clampToYear(vacation.startDate, vacation.endDate, year)!;
        const businessDays = countBusinessDays(from, to, holidaySet, weekendDays);
        const chargesPto = isPtoVacation(vacation, categories);
        return (
          <li key={vacation.id} className="group flex items-center gap-3 rounded-xl p-3 ring-1 ring-slate-100 transition hover:ring-slate-200">
            <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: category?.color ?? '#7c3aed' }} aria-hidden />
            <button className="min-w-0 flex-1 text-left" onClick={() => onEdit(vacation)}>
              <p className="truncate text-sm font-semibold text-slate-900">{vacation.note || 'Untitled trip'}</p>
              <p className="text-xs text-slate-500">
                {formatShortRange(vacation.startDate, vacation.endDate)} · {countTotalDays(vacation.startDate, vacation.endDate)} {countTotalDays(vacation.startDate, vacation.endDate) === 1 ? 'day' : 'days'} · {category?.name ?? vacation.type}
              </p>
              <p className="mt-1 flex gap-1.5">
                <span className={`chip ${chargesPto ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {chargesPto ? `${businessDays} PTO` : 'No PTO'}
                </span>
                {vacation.commuteHours > 0 && <span className="chip bg-emerald-50 text-emerald-700">{vacation.commuteHours}h commute</span>}
              </p>
            </button>
            <div className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button className="icon-btn h-8 w-8" onClick={() => onEdit(vacation)} aria-label="Edit trip">
                <Pencil size={14} />
              </button>
              <button className="icon-btn h-8 w-8 hover:text-rose-600" onClick={() => onRemove(vacation)} aria-label="Remove trip">
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default VacationList;
