import { addDays, format, isWeekend } from 'date-fns';
import { Holiday, OptimizationSuggestion, UserSettings } from '@/lib/types';

const formatISODate = (date: Date) => format(date, 'yyyy-MM-dd');

const isHoliday = (date: Date, holidaySet: Set<string>) => holidaySet.has(formatISODate(date));

const isFreeDay = (date: Date, holidaySet: Set<string>) => isWeekend(date) || isHoliday(date, holidaySet);

export const generateSmartSuggestions = (settings: UserSettings, holidays: Holiday[]): OptimizationSuggestion[] => {
  const holidaySet = new Set(holidays.map((holiday) => holiday.date));
  const startOfYear = new Date(Date.UTC(settings.year, 0, 1));
  const endOfYear = new Date(Date.UTC(settings.year, 11, 31));

  const suggestions: OptimizationSuggestion[] = [];
  const seen = new Set<string>();

  for (let cursor = new Date(startOfYear); cursor <= endOfYear; cursor = addDays(cursor, 1)) {
    if (!isFreeDay(cursor, holidaySet)) continue;

    let blockEnd = new Date(cursor);
    while (true) {
      const next = addDays(blockEnd, 1);
      if (next.getUTCFullYear() !== settings.year || !isFreeDay(next, holidaySet)) break;
      blockEnd = next;
    }

    let gapStart = addDays(blockEnd, 1);
    let gapEnd = new Date(gapStart);
    let gapDays = 0;
    let foundNextFree = false;

    while (gapDays <= settings.maxPtoDays && gapEnd <= endOfYear) {
      if (isFreeDay(gapEnd, holidaySet)) {
        foundNextFree = true;
        break;
      }
      gapDays += 1;
      gapEnd = addDays(gapEnd, 1);
    }

    if (!foundNextFree || gapDays < settings.minPtoDays) {
      cursor = blockEnd;
      continue;
    }

    let totalBlockEnd = new Date(gapEnd);
    while (true) {
      const next = addDays(totalBlockEnd, 1);
      if (next.getUTCFullYear() !== settings.year || !isFreeDay(next, holidaySet)) break;
      totalBlockEnd = next;
    }

    const totalDuration = Math.round((totalBlockEnd.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const efficiency = totalDuration / gapDays;

    if (efficiency < settings.minEfficiency) {
      cursor = totalBlockEnd;
      continue;
    }

    const startDate = formatISODate(gapStart);
    const endDate = formatISODate(addDays(gapEnd, -1));

    if (seen.has(startDate)) {
      cursor = totalBlockEnd;
      continue;
    }

    seen.add(startDate);
    const readableTitle = `${format(new Date(startDate), 'MMM d')} – ${format(new Date(endDate), 'MMM d')}`;

    suggestions.push({
      id: `sugg-${startDate}-${gapDays}`,
      title: readableTitle,
      startDate,
      endDate,
      costInPto: gapDays,
      totalDaysOff: totalDuration,
      description: `Swap ${gapDays} PTO day${gapDays > 1 ? 's' : ''} for ${totalDuration} days off in a row.`,
    });

    cursor = totalBlockEnd;
  }

  return suggestions.sort((a, b) => b.totalDaysOff - a.totalDaysOff).slice(0, 12);
};
