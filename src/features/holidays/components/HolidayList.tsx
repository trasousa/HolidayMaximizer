import { useState } from 'react';
import { nanoid } from 'nanoid';
import { AlertTriangle, Loader2, Plus, RefreshCw, Repeat, Trash2 } from 'lucide-react';
import { CustomHoliday, Holiday, HolidaySource } from '@/lib/types';
import { formatLongDay, isWeekendDay } from '@/lib/utils/date';

interface HolidayListProps {
  holidays: Holiday[];
  year: number;
  weekendDays: number[];
  onSelect: (holiday: Holiday) => void;
  isLoading: boolean;
  error?: string;
  meta?: { source: HolidaySource; fetchedAt: number; warning?: string };
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  customHolidays: CustomHoliday[];
  onChangeCustomHolidays: (holidays: CustomHoliday[]) => Promise<unknown>;
  regionLabel: string;
}

const SOURCE_LABEL: Record<HolidaySource, { name: string; url: string }> = {
  openholidays: { name: 'OpenHolidays API', url: 'https://www.openholidaysapi.org' },
  nager: { name: 'Nager.Date', url: 'https://date.nager.at' },
};

const SCOPE_CHIP: Record<string, { label: string; className: string }> = {
  national: { label: 'National', className: 'bg-rose-50 text-rose-600' },
  regional: { label: 'Regional', className: 'bg-emerald-50 text-emerald-700' },
  custom: { label: 'Custom', className: 'bg-sky-50 text-sky-700' },
};

export const HolidayList = ({
  holidays,
  year,
  weekendDays,
  onSelect,
  isLoading,
  error,
  meta,
  onRefresh,
  isRefreshing,
  customHolidays,
  onChangeCustomHolidays,
  regionLabel,
}: HolidayListProps) => {
  const [isAdding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ date: '', name: '', recurring: true });

  const addCustom = async () => {
    if (!draft.date || !draft.name.trim()) return;
    await onChangeCustomHolidays([...customHolidays, { id: nanoid(), date: draft.date, name: draft.name.trim(), recurring: draft.recurring }]);
    setDraft({ date: '', name: '', recurring: true });
    setAdding(false);
  };

  const removeCustom = (holiday: Holiday) => {
    const suffix = holiday.date.slice(4);
    const match = customHolidays.find((c) => c.name === holiday.name && (c.recurring ? c.date.slice(4) === suffix : c.date === holiday.date));
    if (match) onChangeCustomHolidays(customHolidays.filter((c) => c.id !== match.id));
  };

  const onWorkdays = holidays.filter((h) => !isWeekendDay(h.date, weekendDays)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Public holidays {year}</p>
          <p className="text-lg font-bold text-slate-900">
            {holidays.length} days · {onWorkdays} on workdays
          </p>
          <p className="text-xs text-slate-500">For {regionLabel}</p>
        </div>
        <button onClick={onRefresh} disabled={isRefreshing} className="icon-btn" title="Check for updated holidays" aria-label="Refresh holidays">
          {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      {meta && (
        <p className="text-[0.7rem] text-slate-400">
          Source:{' '}
          <a href={SOURCE_LABEL[meta.source].url} target="_blank" rel="noreferrer" className="font-medium text-slate-500 underline underline-offset-2">
            {SOURCE_LABEL[meta.source].name}
          </a>{' '}
          · updated {new Date(meta.fetchedAt).toLocaleDateString()} · refreshed weekly
        </p>
      )}

      {(error || meta?.warning) && (
        <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {error ? `Could not load holidays: ${error}` : meta?.warning}
        </p>
      )}

      {isAdding ? (
        <div className="space-y-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold text-slate-600">Add a municipal, company or personal day off</p>
          <div className="grid grid-cols-[auto,1fr] gap-2">
            <input type="date" className="input" value={draft.date} min={`${year}-01-01`} max={`${year}-12-31`} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} aria-label="Date" />
            <input className="input" placeholder="e.g. Santo António" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} aria-label="Name" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={draft.recurring} onChange={(e) => setDraft((d) => ({ ...d, recurring: e.target.checked }))} />
            Repeats every year on this date
          </label>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={addCustom} disabled={!draft.date || !draft.name.trim()}>
              Add holiday
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-secondary w-full border-dashed" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add local holiday
        </button>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-brand-500" />
        </div>
      ) : holidays.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">No holidays found for {year}.</p>
      ) : (
        <ul className="space-y-1.5">
          {holidays.map((holiday) => {
            const chip = SCOPE_CHIP[holiday.scope ?? 'national'];
            const weekend = isWeekendDay(holiday.date, weekendDays);
            const isRecurringCustom = holiday.scope === 'custom' && customHolidays.some((c) => c.recurring && c.name === holiday.name);
            return (
              <li key={holiday.date} className="group flex items-center gap-2">
                <button onClick={() => onSelect(holiday)} className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ring-1 ring-slate-100 transition hover:bg-slate-50 hover:ring-slate-200">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{holiday.name}</p>
                    <p className={`text-xs ${weekend ? 'text-slate-400' : 'text-slate-500'}`}>
                      {formatLongDay(holiday.date)}
                      {weekend && ' · weekend'}
                    </p>
                  </div>
                  <span className={`chip shrink-0 ${chip.className}`}>
                    {isRecurringCustom && <Repeat size={10} />}
                    {chip.label}
                  </span>
                </button>
                {holiday.scope === 'custom' && (
                  <button onClick={() => removeCustom(holiday)} className="icon-btn h-8 w-8 hover:text-rose-600" aria-label={`Remove ${holiday.name}`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default HolidayList;
