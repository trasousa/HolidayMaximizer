import { Holiday, OptimizationSuggestion, UserSettings } from '@/lib/types';
import { addDaysISO, DEFAULT_WEEKEND, diffDays, formatShortRange, isWeekendDay } from '@/lib/utils/date';

export interface OptimizerInput {
  year: number;
  /** Public + custom holidays. Include the neighbouring years so breaks can span New Year. */
  holidays: Holiday[];
  settings: Pick<UserSettings, 'minPtoDays' | 'maxPtoDays' | 'minEfficiency' | 'requireHoliday'>;
  weekendDays?: number[];
  /** Days the person already has off (booked PTO). They count as free and are never re-suggested. */
  bookedDates?: Iterable<string>;
  /** No suggested break may start before this date (e.g. today). */
  earliestDate?: string;
  limit?: number;
}

/** How far a break may extend through consecutive free days (guards against huge booked blocks). */
const MAX_FREE_RUN = 60;

const score = (a: OptimizationSuggestion, b: OptimizationSuggestion) =>
  b.efficiency - a.efficiency || b.totalDaysOff - a.totalDaysOff || a.costInPto - b.costInPto || a.startDate.localeCompare(b.startDate);

const overlaps = (a: OptimizationSuggestion, b: OptimizationSuggestion) => a.breakStart <= b.breakEnd && b.breakStart <= a.breakEnd;

/**
 * Finds "bridge" opportunities: runs of working days that, once booked as PTO,
 * join weekends / holidays / existing time off into one longer break.
 *
 * Rules:
 *  - PTO days are only working days (not weekend, holiday or already booked) inside the planning year.
 *  - A break must be bounded by free days on both sides, otherwise part of the PTO is not "bridging".
 *  - `costInPto` is within [minPtoDays, maxPtoDays] and `totalDaysOff / costInPto >= minEfficiency`.
 *  - Optionally the break must contain a public holiday (otherwise it is just a long weekend extension).
 *  - Results are ranked by efficiency, then length; overlapping breaks are de-duplicated, keeping at
 *    most one longer alternative per period (e.g. "1 day → 4 days" and "4 days → 9 days").
 */
export const generateSmartSuggestions = ({
  year,
  holidays,
  settings,
  weekendDays = DEFAULT_WEEKEND,
  bookedDates = [],
  earliestDate,
  limit = 15,
}: OptimizerInput): OptimizationSuggestion[] => {
  const holidaySet = new Set(holidays.map((h) => h.date));
  const offSet = new Set([...holidaySet, ...bookedDates]);
  const isFree = (date: string) => isWeekendDay(date, weekendDays) || offSet.has(date);

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const from = earliestDate && earliestDate > yearStart ? earliestDate : yearStart;
  const minPto = Math.max(1, settings.minPtoDays);
  const maxPto = Math.max(minPto, settings.maxPtoDays);
  const requireHoliday = settings.requireHoliday ?? true;

  const extend = (date: string, step: 1 | -1) => {
    let edge = date;
    for (let i = 0; i < MAX_FREE_RUN && isFree(addDaysISO(edge, step)); i += 1) edge = addDaysISO(edge, step);
    return edge;
  };

  const candidates: OptimizationSuggestion[] = [];

  for (let start = from; start <= yearEnd; start = addDaysISO(start, 1)) {
    if (isFree(start) || !isFree(addDaysISO(start, -1))) continue;

    const breakStart = extend(start, -1);
    if (breakStart < from) continue;

    const ptoDates: string[] = [];
    for (let end = start; end <= yearEnd; end = addDaysISO(end, 1)) {
      if (isFree(end)) continue;
      ptoDates.push(end);
      if (ptoDates.length > maxPto) break;

      const next = addDaysISO(end, 1);
      if (!isFree(next) || ptoDates.length < minPto) continue;

      const breakEnd = extend(end, 1);
      const totalDaysOff = diffDays(breakStart, breakEnd) + 1;
      const efficiency = totalDaysOff / ptoDates.length;
      if (efficiency < settings.minEfficiency) continue;

      const holidayDates: string[] = [];
      for (let day = breakStart; day <= breakEnd; day = addDaysISO(day, 1)) {
        if (holidaySet.has(day)) holidayDates.push(day);
      }
      if (requireHoliday && holidayDates.length === 0) continue;

      const cost = ptoDates.length;
      candidates.push({
        id: `sugg-${start}-${end}`,
        title: formatShortRange(breakStart, breakEnd),
        startDate: start,
        endDate: end,
        breakStart,
        breakEnd,
        ptoDates: [...ptoDates],
        costInPto: cost,
        totalDaysOff,
        efficiency: Math.round(efficiency * 100) / 100,
        description: `Book ${cost} PTO day${cost > 1 ? 's' : ''} → ${totalDaysOff} days off in a row`,
        usesHoliday: holidayDates.length > 0,
        holidayDates,
      });
    }
  }

  const picked: OptimizationSuggestion[] = [];
  const hasAlternative = new Set<string>();
  for (const candidate of candidates.sort(score)) {
    if (picked.length >= limit) break;
    const clashes = picked.filter((p) => overlaps(p, candidate));
    if (clashes.length === 0) {
      picked.push(candidate);
      continue;
    }
    const [base] = clashes;
    if (clashes.length === 1 && !hasAlternative.has(base.id) && candidate.totalDaysOff > base.totalDaysOff) {
      hasAlternative.add(base.id);
      hasAlternative.add(candidate.id);
      picked.push(candidate);
    }
  }
  return picked;
};
