import type { CSSProperties, ReactNode } from 'react';
import { OptimizationSuggestion, Profile } from '@/lib/types';

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
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
}: YearCalendarProps) => {
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId);
  const affordableSuggestions = activeProfile?.suggestions.filter((suggestion) => suggestion.costInPto <= remainingPto) ?? [];
  const affordableActiveSuggestion = activeSuggestion && activeSuggestion.costInPto <= remainingPto ? activeSuggestion : null;

  const renderMonth = (monthIndex: number) => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const cells: ReactNode[] = [];

    for (let i = 0; i < offset; i += 1) {
      cells.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(year, monthIndex, day);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const isHoliday = activeProfile?.holidays.some((holiday) => holiday.date === dateStr);
      const activeVacation = activeProfile?.vacations.some((vacation) => dateStr >= vacation.startDate && dateStr <= vacation.endDate);

      const overlayVacations = profiles
        .filter((profile) => comparedProfileIds.includes(profile.id))
        .flatMap((profile) =>
          profile.vacations
            .filter((vacation) => dateStr >= vacation.startDate && dateStr <= vacation.endDate)
            .map((vacation) => profile.color)
        );

      const isSuggested = Boolean(
        affordableActiveSuggestion &&
          dateStr >= affordableActiveSuggestion.startDate &&
          dateStr <= affordableActiveSuggestion.endDate
      );
      const overlaySuggested =
        showSuggestionsOverlay &&
        !activeVacation &&
        affordableSuggestions.some((suggestion) => dateStr >= suggestion.startDate && dateStr <= suggestion.endDate);

      const isSelectionStart = selectionStart === dateStr;

      let baseClasses = 'rounded-xl border text-sm flex items-center justify-center relative focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition shadow-sm';
      let borderClass = 'border-slate-100';
      let textClass = 'text-slate-700';
      let backgroundClass = 'bg-white/80 hover:bg-white';
      const dynamicStyle: CSSProperties = {};

      if (activeVacation && activeProfile) {
        backgroundClass = '';
        textClass = 'text-white font-semibold';
        borderClass = 'border-transparent';
        dynamicStyle.backgroundColor = activeProfile.color;
      } else if (isSuggested) {
        backgroundClass = 'bg-brand-50';
        borderClass = 'border-brand-200';
        textClass = 'text-brand-700 font-semibold';
      } else if (overlaySuggested) {
        backgroundClass = 'bg-amber-50';
        borderClass = 'border-amber-100';
        textClass = 'text-amber-700';
      } else if (isHoliday) {
        backgroundClass = 'bg-rose-50';
        borderClass = 'border-rose-200';
        textClass = 'text-rose-600 font-semibold';
      } else if (isWeekend) {
        backgroundClass = 'bg-slate-50';
        textClass = 'text-slate-400';
      }

      const selectionRing = isSelectionStart ? 'ring-2 ring-slate-900' : '';

      cells.push(
        <button
          key={dateStr}
          type="button"
          onClick={() => onDateClick(dateStr)}
          className={`${baseClasses} ${borderClass} ${textClass} ${backgroundClass} ${selectionRing} min-h-10`}
          style={dynamicStyle}
          aria-pressed={isSelectionStart}
        >
          {day}
          {overlayVacations.length > 0 && !activeVacation && (
            <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
              {overlayVacations.slice(0, 3).map((color, index) => (
                <span key={`${color}-${index}`} className="flex-1 h-1 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              ))}
            </div>
          )}
          <span className="sr-only">{new Date(dateStr).toDateString()}</span>
        </button>
      );
    }

    return (
      <section key={monthIndex} className="rounded-3xl border border-slate-100 bg-white p-4 space-y-2 shadow-sm" aria-label={MONTHS[monthIndex]}>
        <header className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{MONTHS[monthIndex]}</h3>
          <span className="text-xs text-slate-400">{year}</span>
        </header>
        <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1" role="grid">
          {cells}
        </div>
      </section>
    );
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {MONTHS.map((_, monthIndex) => renderMonth(monthIndex))}
    </div>
  );
};

export default YearCalendar;
