import { Holiday, OptimizationSuggestion, Vacation, VacationCategory } from '@/lib/types';
import { addDaysISO, clampToYear, DEFAULT_WEEKEND, eachDate, isWeekendDay } from '@/lib/utils/date';

export interface TripStat extends Vacation {
  businessDays: number;
  totalDays: number;
}

export interface PlanStats {
  /** Working days consumed from the allowance in the planning year. */
  used: number;
  /** Calendar days off in a row, including the weekends/holidays the PTO is attached to. */
  total: number;
  /** total / used ("1 PTO day buys N days off"). */
  efficiency: number;
  commute: number;
  topTrips: TripStat[];
  /** Dates (in the year) already taken off with a PTO category. */
  bookedDates: Set<string>;
  isProjection: boolean;
}

interface StatsInput {
  year: number;
  vacations: Vacation[];
  categories: VacationCategory[];
  holidays: Holiday[];
  weekendDays?: number[];
  preview?: OptimizationSuggestion | null;
}

export const isPtoVacation = (vacation: Vacation, categories: VacationCategory[]) => {
  const category = categories.find((c) => c.id === vacation.type);
  return category ? category.isPto : vacation.type === 'PTO';
};

/** Dates of a vacation that fall in the given year. */
const datesInYear = (vacation: Vacation, year: number) => {
  const range = clampToYear(vacation.startDate, vacation.endDate, year);
  return range ? eachDate(range[0], range[1]) : [];
};

/**
 * Allowance maths for one profile and year.
 * Overlapping trips are counted once, trips in other years are ignored, and only working days
 * (not weekends or public holidays) are charged against the allowance.
 */
export const computePlanStats = ({ year, vacations, categories, holidays, weekendDays = DEFAULT_WEEKEND, preview }: StatsInput): PlanStats => {
  const holidaySet = new Set(holidays.map((h) => h.date));
  const isWorkday = (date: string) => !isWeekendDay(date, weekendDays) && !holidaySet.has(date);

  const bookedDates = new Set<string>();
  vacations.filter((v) => isPtoVacation(v, categories)).forEach((v) => datesInYear(v, year).forEach((d) => bookedDates.add(d)));

  const offDates = new Set(bookedDates);
  preview?.ptoDates.forEach((d) => offDates.add(d));

  const ptoDates = [...offDates].filter(isWorkday);
  const used = ptoDates.length;

  // A break = booked days plus the free days glued to them on either side.
  const breakDays = new Set<string>();
  const isOff = (date: string) => offDates.has(date) || !isWorkday(date);
  offDates.forEach((date) => {
    breakDays.add(date);
    for (let d = addDaysISO(date, -1); !offDates.has(d) && isOff(d) && !breakDays.has(d); d = addDaysISO(d, -1)) breakDays.add(d);
    for (let d = addDaysISO(date, 1); !offDates.has(d) && isOff(d) && !breakDays.has(d); d = addDaysISO(d, 1)) breakDays.add(d);
  });
  // Only count breaks that actually consume PTO (a booked weekend alone is not a break).
  const total = used > 0 ? breakDays.size : 0;

  const topTrips = vacations
    .map((v) => {
      const dates = datesInYear(v, year);
      return { ...v, businessDays: dates.filter(isWorkday).length, totalDays: dates.length };
    })
    .filter((trip) => trip.totalDays > 0)
    .sort((a, b) => b.businessDays - a.businessDays || b.totalDays - a.totalDays)
    .slice(0, 5);

  return {
    used,
    total,
    efficiency: used ? total / used : 0,
    commute: vacations.filter((v) => datesInYear(v, year).length > 0).reduce((sum, v) => sum + (v.commuteHours || 0), 0),
    topTrips,
    bookedDates,
    isProjection: Boolean(preview),
  };
};
