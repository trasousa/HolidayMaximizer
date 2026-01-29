import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { Holiday } from '@/lib/types';

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const countBusinessDays = (start: string, end: string, holidays: Holiday[]): number => {
  const holidaySet = new Set(holidays.map((holiday) => holiday.date));
  const range = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
  return range.filter((date) => !isWeekend(date) && !holidaySet.has(format(date, 'yyyy-MM-dd'))).length;
};

export const countTotalDays = (start: string, end: string): number => {
  const range = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
  return range.length;
};

export const formatShortRange = (start: string, end: string) => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d')}`;
};
