import { Profile, Holiday, Vacation } from "../types";

export interface ExportOptions {
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  includeCommuteDetails: boolean;
}

const formatDateToICS = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const formatDateValue = (date: Date): string => {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

// Helper: Add days to a Date object
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Helper: Format Date to YYYY-MM-DD
const toDateStr = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const generateICSFile = (profile: Profile, options: ExportOptions): void => {
  let events: string[] = [];
  const NOW = formatDateToICS(new Date());

  profile.vacations.forEach((vacation, index) => {
    let currentStart = new Date(vacation.startDate);
    const end = new Date(vacation.endDate);
    
    // We will collect blocks of valid days
    // A block is defined by a start date and an end date
    const blocks: {start: Date, end: Date}[] = [];
    
    let blockStart: Date | null = null;
    let lastValidDate: Date | null = null;

    // Iterate through every day of the vacation range
    const loopEnd = addDays(end, 1); // Loop until strictly after end
    
    for (let d = new Date(currentStart); d < loopEnd; d = addDays(d, 1)) {
        const dateStr = toDateStr(d);
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = profile.holidays.some(h => h.date === dateStr);
        
        let shouldExclude = false;
        
        // Logic: 
        // If option is checked, we exclude.
        if (options.excludeWeekends && isWeekend) shouldExclude = true;
        if (options.excludeHolidays && isHoliday) shouldExclude = true;

        if (!shouldExclude) {
            // It is a valid vacation day
            if (!blockStart) {
                blockStart = new Date(d);
            }
            lastValidDate = new Date(d);
        } else {
            // It is an excluded day. Close current block if exists.
            if (blockStart && lastValidDate) {
                blocks.push({ start: blockStart, end: lastValidDate });
                blockStart = null;
                lastValidDate = null;
            }
        }
    }

    // Close final block if open
    if (blockStart && lastValidDate) {
        blocks.push({ start: blockStart, end: lastValidDate });
    }

    // Generate Events for Blocks
    blocks.forEach((block, bIdx) => {
        // ICS End dates are exclusive (day after) for all-day events
        const icsStart = formatDateValue(block.start);
        const icsEnd = formatDateValue(addDays(block.end, 1)); 

        let description = vacation.note || `Vacation ${index + 1}`;
        if (options.includeCommuteDetails && vacation.commuteHours > 0) {
            description += `\n\nTotal Commute Saved for trip: ${vacation.commuteHours} hours`;
        }
        
        // If we split the event, maybe add (Part X) to title?
        // Let's keep title simple to avoid clutter
        const title = vacation.note ? vacation.note : `Vacation`;

        const event = [
            'BEGIN:VEVENT',
            `UID:${vacation.id}-${bIdx}@holidaymaximizer.app`,
            `DTSTAMP:${NOW}`,
            `DTSTART;VALUE=DATE:${icsStart}`,
            `DTEND;VALUE=DATE:${icsEnd}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            'STATUS:CONFIRMED',
            'TRANSP:OPAQUE', // OPAQUE = Busy, TRANSPARENT = Free
            'END:VEVENT'
        ].join('\r\n');
        
        events.push(event);
    });
  });

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HolidayMaximizer//Vacation Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');

  // Trigger Download
  const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${profile.name}_Vacations_${profile.vacations[0]?.startDate.split('-')[0] || 'Plan'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};