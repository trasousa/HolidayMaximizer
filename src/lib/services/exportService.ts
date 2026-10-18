import { Profile } from '@/lib/types';
import { addDaysISO, DEFAULT_WEEKEND, eachDate, isWeekendDay } from '@/lib/utils/date';

export interface ExportOptions {
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  includeCommuteDetails: boolean;
}

const formatDateToICS = (date: Date): string => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

const toICSDate = (iso: string) => iso.replace(/-/g, '');

/** RFC 5545 text escaping. */
const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Split a date range into consecutive runs, skipping excluded days. */
const splitIntoBlocks = (start: string, end: string, exclude: (date: string) => boolean) => {
  const blocks: { start: string; end: string }[] = [];
  let current: { start: string; end: string } | null = null;
  for (const date of eachDate(start, end)) {
    if (exclude(date)) {
      current = null;
      continue;
    }
    if (current) current.end = date;
    else blocks.push((current = { start: date, end: date }));
  }
  return blocks;
};

export const buildICS = (profile: Profile, options: ExportOptions): string => {
  const NOW = formatDateToICS(new Date());
  const weekendDays = profile.weekendDays ?? DEFAULT_WEEKEND;
  const holidaySet = new Set(profile.holidays.map((holiday) => holiday.date));
  const categoryName = (type: string) => profile.categories.find((c) => c.id === type)?.name ?? type;

  const events = profile.vacations.flatMap((vacation) => {
    const exclude = (date: string) =>
      (options.excludeWeekends && isWeekendDay(date, weekendDays)) || (options.excludeHolidays && holidaySet.has(date));
    const title = vacation.note || categoryName(vacation.type);
    let description = `${categoryName(vacation.type)} – planned with Holiday Maximizer`;
    if (options.includeCommuteDetails && vacation.commuteHours) {
      description += `\nCommute hours: ${vacation.commuteHours}`;
    }

    return splitIntoBlocks(vacation.startDate, vacation.endDate, exclude).map((block, idx) =>
      [
        'BEGIN:VEVENT',
        `UID:${vacation.id}-${idx}@holidaymaximizer`,
        `DTSTAMP:${NOW}`,
        `DTSTART;VALUE=DATE:${toICSDate(block.start)}`,
        // DTEND is exclusive for all-day events.
        `DTEND;VALUE=DATE:${toICSDate(addDaysISO(block.end, 1))}`,
        `SUMMARY:${escapeText(title)}`,
        `DESCRIPTION:${escapeText(description)}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT',
      ].join('\r\n')
    );
  });

  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HolidayMaximizer//Planner//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...events, 'END:VCALENDAR'].join('\r\n');
};

export const generateICSFile = (profile: Profile, options: ExportOptions, year?: number): void => {
  const blob = new Blob([buildICS(profile, options)], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', `${profile.name}_vacations_${year ?? 'plan'}.ics`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
