import { Holiday, OptimizationSuggestion, UserSettings } from "../types";

export const generateSmartSuggestions = (
  settings: UserSettings, 
  holidays: Holiday[]
): OptimizationSuggestion[] => {
  const suggestions: OptimizationSuggestion[] = [];
  const oneDay = 24 * 60 * 60 * 1000;
  
  // Helper to check if a date is a holiday or weekend
  const isHoliday = (d: Date) => {
      const dateStr = d.toISOString().split('T')[0];
      return holidays.some(h => h.date === dateStr);
  };
  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6; // 0=Sun, 6=Sat
  const isFree = (d: Date) => isWeekend(d) || isHoliday(d);

  const startOfYear = new Date(Date.UTC(settings.year, 0, 1));
  const endOfYear = new Date(Date.UTC(settings.year, 11, 31));
  
  let current = new Date(startOfYear);

  while (current < endOfYear) {
    // 1. Find the start of a free block
    if (isFree(current)) {
      
      // 2. Find the end of this current free block
      let blockEnd = new Date(current);
      while (isFree(new Date(blockEnd.getTime() + oneDay)) && blockEnd.getFullYear() === settings.year) {
        blockEnd = new Date(blockEnd.getTime() + oneDay);
      }
      
      // 3. Scan the "Gap" (potential PTO days)
      const gapStart = new Date(blockEnd.getTime() + oneDay);
      let gapEnd = new Date(gapStart);
      let gapDays = 0;
      let foundNextFree = false;
      
      // Use user setting for max search depth
      const searchLimit = settings.maxPtoDays; 

      while (gapDays <= searchLimit) {
         if (gapEnd.getFullYear() !== settings.year) break;
         
         if (isFree(gapEnd)) {
           foundNextFree = true;
           break;
         }
         gapDays++;
         gapEnd = new Date(gapEnd.getTime() + oneDay);
      }
      
      // 4. If we found a subsequent free block and the gap is valid according to settings
      if (foundNextFree && gapDays > 0 && gapDays >= settings.minPtoDays) {
         
         // 5. Calculate total duration of the combined break
         let totalEnd = new Date(gapEnd);
         while (isFree(new Date(totalEnd.getTime() + oneDay)) && totalEnd.getFullYear() === settings.year) {
            totalEnd = new Date(totalEnd.getTime() + oneDay);
         }
         
         const totalDuration = Math.round((totalEnd.getTime() - current.getTime()) / oneDay) + 1;
         const efficiency = totalDuration / gapDays; 
         
         // Apply user efficiency setting
         if (efficiency >= settings.minEfficiency) {
             const startDateStr = gapStart.toISOString().split('T')[0];
             const ptoEnd = new Date(gapEnd.getTime() - oneDay);
             const endDateStr = ptoEnd.toISOString().split('T')[0];
             
             // Deduplicate
             if (!suggestions.some(s => s.startDate === startDateStr)) {
                
                // Formatter for title: "Apr 14 - Apr 18"
                const sDate = new Date(startDateStr);
                const eDate = new Date(endDateStr);
                const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                const title = `${sDate.toLocaleDateString(undefined, dateOptions)} - ${eDate.toLocaleDateString(undefined, dateOptions)}`;

                suggestions.push({
                   id: `sug-${startDateStr}-${gapDays}`,
                   title: title,
                   startDate: startDateStr,
                   endDate: endDateStr,
                   costInPto: gapDays,
                   totalDaysOff: totalDuration,
                   description: `Use ${gapDays} day${gapDays>1?'s':''} of PTO to get ${totalDuration} consecutive days off.`
                });
             }
         }
      }
    }
    // Move forward
    current = new Date(current.getTime() + oneDay);
  }

  // Sort by highest impact (total days off)
  return suggestions.sort((a,b) => b.totalDaysOff - a.totalDaysOff).slice(0, 10);
};