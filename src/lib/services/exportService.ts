import { Profile } from '@/lib/types';

export interface ExportOptions {
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  includeCommuteDetails: boolean;
}

const formatDateToICS = (date: Date): string => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

const formatDateValue = (date: Date): string => date.toISOString().split('T')[0].replace(/-/g, '');

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const toDateStr = (date: Date) => date.toISOString().split('T')[0];

export const generateICSFile = (profile: Profile, options: ExportOptions): void => {
  const events: string[] = [];
  const NOW = formatDateToICS(new Date());

  profile.vacations.forEach((vacation, index) => {
    const blocks: { start: Date; end: Date }[] = [];
    const start = new Date(vacation.startDate);
    const end = new Date(vacation.endDate);

    let blockStart: Date | null = null;
    let lastValid: Date | null = null;
    for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
      const dateStr = toDateStr(cursor);
      const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;
      const isHoliday = profile.holidays.some((holiday) => holiday.date === dateStr);
      const shouldExclude = (options.excludeWeekends && isWeekend) || (options.excludeHolidays && isHoliday);

      if (shouldExclude) {
        if (blockStart && lastValid) {
          blocks.push({ start: blockStart, end: lastValid });
          blockStart = null;
          lastValid = null;
        }
        continue;
      }

      if (!blockStart) {
        blockStart = new Date(cursor);
      }
      lastValid = new Date(cursor);
    }

    if (blockStart && lastValid) {
      blocks.push({ start: blockStart, end: lastValid });
    }

    blocks.forEach((block, idx) => {
      const icsStart = formatDateValue(block.start);
      const icsEnd = formatDateValue(addDays(block.end, 1));
      let description = vacation.note || `Vacation ${index + 1}`;
      if (options.includeCommuteDetails && vacation.commuteHours) {
        description += `\n\nCommute hours saved: ${vacation.commuteHours}`;
      }
      const title = vacation.note ?? 'Vacation';
      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${vacation.id}-${idx}@holidaymaximizer`,
          `DTSTAMP:${NOW}`,
          `DTSTART;VALUE=DATE:${icsStart}`,
          `DTEND;VALUE=DATE:${icsEnd}`,
          `SUMMARY:${title}`,
          `DESCRIPTION:${description}`,
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
          'END:VEVENT',
        ].join('\r\n')
      );
    });
  });

  const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HolidayMaximizer//Planner//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...events, 'END:VCALENDAR'].join('\r\n');

  const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const year = profile.vacations[0]?.startDate?.split('-')[0] ?? 'plan';
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${profile.name}_vacations_${year}.ics`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
