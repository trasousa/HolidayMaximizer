import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Holiday, OptimizationSuggestion, Profile, Vacation } from '@/lib/types';
import { DEFAULT_WEEKEND, eachDate, formatLongDay, isoDate, todayISO } from '@/lib/utils/date';

interface YearCalendarProps {
  year: number;
  profiles: Profile[];
  activeProfileId: string | null;
  comparedProfileIds: string[];
  activeSuggestion: OptimizationSuggestion | null;
  selectionStart: string | null;
  onDateClick: (date: string) => void;
  showSuggestionsOverlay: boolean;
  remainingPto: number;
  weekendDays?: number[];
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** Monday-first week. */
const WEEKDAYS = [
  { label: 'M', day: 1 },
  { label: 'T', day: 2 },
  { label: 'W', day: 3 },
  { label: 'T', day: 4 },
  { label: 'F', day: 5 },
  { label: 'S', day: 6 },
  { label: 'S', day: 0 },
];

const LEGEND: { label: string; className: string }[] = [
  { label: 'National holiday', className: 'bg-rose-100 ring-1 ring-rose-300' },
  { label: 'Regional / city', className: 'bg-emerald-100 ring-1 ring-emerald-300' },
  { label: 'Custom', className: 'bg-sky-100 ring-1 ring-sky-300' },
  { label: 'Weekend', className: 'bg-slate-100' },
  { label: 'Suggested PTO', className: 'bg-amber-100 ring-1 ring-amber-300' },
  { label: 'Trip', className: 'bg-brand-600' },
];

const HOLIDAY_STYLES: Record<string, string> = {
  national: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100 font-semibold',
  regional: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100 font-semibold',
  custom: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 hover:bg-sky-100 font-semibold',
};

const indexByDate = <T,>(entries: T[], range: (entry: T) => [string, string], year: number) => {
  const map = new Map<string, T>();
  entries.forEach((entry) => {
    const [start, end] = range(entry);
    if (end < `${year}-01-01` || start > `${year}-12-31`) return;
    eachDate(start, end).forEach((date) => {
      if (!map.has(date)) map.set(date, entry);
    });
  });
  return map;
};

export const YearCalendar = ({
  year,
  profiles,
  activeProfileId,
  comparedProfileIds,
  activeSuggestion,
  selectionStart,
  onDateClick,
  showSuggestionsOverlay,
  remainingPto,
  weekendDays = DEFAULT_WEEKEND,
}: YearCalendarProps) => {
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId);
  const today = todayISO();

  const lookups = useMemo(() => {
    const holidays = new Map<string, Holiday>((activeProfile?.holidays ?? []).map((h) => [h.date, h]));
    const vacations = indexByDate<Vacation>(activeProfile?.vacations ?? [], (v) => [v.startDate, v.endDate], year);
    const overlays = new Map<string, { color: string; name: string }[]>();
    profiles
      .filter((profile) => comparedProfileIds.includes(profile.id) && profile.id !== activeProfileId)
      .forEach((profile) =>
        indexByDate(profile.vacations, (v) => [v.startDate, v.endDate], year).forEach((_, date) => {
          overlays.set(date, [...(overlays.get(date) ?? []), { color: profile.color, name: profile.name }]);
        })
      );
    const suggested = new Set(
      (activeProfile?.suggestions ?? []).filter((s) => s.costInPto <= remainingPto).flatMap((s) => s.ptoDates)
    );
    return { holidays, vacations, overlays, suggested };
  }, [activeProfile, profiles, comparedProfileIds, activeProfileId, remainingPto, year]);

  const preview = activeSuggestion
    ? { pto: new Set(activeSuggestion.ptoDates), start: activeSuggestion.breakStart, end: activeSuggestion.breakEnd }
    : null;

  const renderMonth = (monthIndex: number) => {
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
    const offset = (firstDay + 6) % 7;
    const cells: ReactNode[] = [];
    let monthHolidays = 0;
    let monthTripDays = 0;

    for (let i = 0; i < offset; i += 1) cells.push(<div key={`empty-${i}`} aria-hidden />);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = isoDate(year, monthIndex, day);
      const dow = (offset + day - 1) % 7;
      const isWeekend = weekendDays.includes(WEEKDAYS[dow].day);
      const holiday = lookups.holidays.get(dateStr);
      const vacation = lookups.vacations.get(dateStr);
      const overlays = lookups.overlays.get(dateStr) ?? [];
      const isPreviewPto = preview?.pto.has(dateStr) ?? false;
      const isInPreviewBreak = preview ? dateStr >= preview.start && dateStr <= preview.end : false;
      const isOverlaySuggested = showSuggestionsOverlay && !vacation && lookups.suggested.has(dateStr);
      const isToday = dateStr === today;
      const isPast = dateStr < today;
      const isSelectionStart = selectionStart === dateStr;

      if (holiday) monthHolidays += 1;
      if (vacation) monthTripDays += 1;

      let stateClass = 'text-slate-700 hover:bg-slate-100';
      const style: CSSProperties = {};

      if (vacation && activeProfile) {
        const category = activeProfile.categories.find((c) => c.id === vacation.type);
        stateClass = 'text-white font-semibold shadow-sm hover:brightness-110';
        style.backgroundColor = category?.color || activeProfile.color;
      } else if (isPreviewPto) {
        stateClass = 'bg-brand-600 text-white font-semibold ring-2 ring-brand-300 ring-offset-1';
      } else if (holiday) {
        stateClass = HOLIDAY_STYLES[holiday.scope ?? 'national'];
      } else if (isOverlaySuggested) {
        stateClass = 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 hover:bg-amber-100';
      } else if (isWeekend) {
        stateClass = 'bg-slate-100/70 text-slate-400 hover:bg-slate-200/70';
      }

      const titleParts = [formatLongDay(dateStr)];
      if (holiday) titleParts.push(holiday.name);
      if (vacation) titleParts.push(vacation.note || 'Trip');
      if (isOverlaySuggested) titleParts.push('Suggested PTO day');
      overlays.forEach((o) => titleParts.push(`${o.name} is off`));

      cells.push(
        <button
          key={dateStr}
          type="button"
          onClick={() => onDateClick(dateStr)}
          title={titleParts.join(' · ')}
          aria-label={titleParts.join(', ')}
          aria-pressed={isSelectionStart}
          className={`relative flex aspect-square min-h-8 items-center justify-center rounded-lg text-xs tabular-nums transition sm:text-[0.8rem]
            ${stateClass}
            ${isInPreviewBreak && !isPreviewPto && !vacation ? 'outline outline-2 outline-brand-300 -outline-offset-2' : ''}
            ${isToday ? 'ring-2 ring-slate-900 ring-offset-1' : ''}
            ${isSelectionStart ? 'z-10 scale-110 ring-2 ring-brand-600 ring-offset-2' : ''}
            ${isPast && !vacation ? 'opacity-50' : ''}`}
          style={style}
        >
          {day}
          {overlays.length > 0 && (
            <span className="absolute inset-x-1 bottom-0.5 flex gap-0.5" aria-hidden>
              {overlays.slice(0, 3).map((o, index) => (
                <span key={`${o.color}-${index}`} className="h-1 flex-1 rounded-full ring-1 ring-white" style={{ backgroundColor: o.color }} />
              ))}
            </span>
          )}
        </button>
      );
    }

    return (
      <section key={monthIndex} className="card p-3 sm:p-4" aria-label={`${MONTHS[monthIndex]} ${year}`}>
        <header className="mb-2 flex items-baseline justify-between">
          <h3 className="text-sm font-bold text-slate-900">{MONTHS[monthIndex]}</h3>
          <span className="flex gap-1.5 text-[0.65rem] font-semibold">
            {monthHolidays > 0 && <span className="text-rose-500">{monthHolidays} hol.</span>}
            {monthTripDays > 0 && <span className="text-brand-600">{monthTripDays}d trip</span>}
          </span>
        </header>
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[0.6rem] font-semibold uppercase text-slate-400">
          {WEEKDAYS.map((weekday, index) => (
            <span key={index} className={weekendDays.includes(weekday.day) ? 'text-slate-300' : ''}>
              {weekday.label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </section>
    );
  };

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.7rem] text-slate-500" aria-label="Legend">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ${item.className}`} aria-hidden />
            {item.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-2 ring-slate-900" aria-hidden />
          Today
        </li>
      </ul>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{MONTHS.map((_, monthIndex) => renderMonth(monthIndex))}</div>
    </div>
  );
};

export default YearCalendar;
