import React from 'react';
import { Holiday, Profile, OptimizationSuggestion } from '../types';

interface YearCalendarProps {
  year: number;
  profiles: Profile[];
  activeProfileId: string;
  comparedProfileIds: string[];
  activeSuggestion: OptimizationSuggestion | null; // The specific suggestion being previewed (clicked eye)
  selectionStart: string | null;
  onDateClick: (date: string) => void;
  // New Props
  showSuggestionsOverlay: boolean; // Toggle all suggestions
  isCompactView: boolean; // At a glance view
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const YearCalendar: React.FC<YearCalendarProps> = ({ 
  year, 
  profiles, 
  activeProfileId, 
  comparedProfileIds, 
  activeSuggestion,
  selectionStart,
  onDateClick,
  showSuggestionsOverlay,
  isCompactView
}) => {
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const getDaysInMonth = (monthIndex: number, year: number) => {
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (monthIndex: number, year: number) => {
    const day = new Date(year, monthIndex, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const renderMonth = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex, year);
    const startOffset = getFirstDayOfMonth(monthIndex, year);
    const days: React.ReactNode[] = [];

    // Styling Adjustments for Compact View
    const cellHeight = isCompactView ? "h-6 text-[10px]" : "h-8 md:h-10 text-xs md:text-sm";
    const headerSize = isCompactView ? "text-sm mb-1" : "text-lg mb-3";
    const gapSize = isCompactView ? "gap-0.5" : "gap-1";

    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className={`${cellHeight} w-full`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(year, monthIndex, day);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

      // --- Data Logic ---
      const activeHoliday = activeProfile?.holidays.find(h => h.date === dateStr);
      const activeVacation = activeProfile?.vacations.find(v => dateStr >= v.startDate && dateStr <= v.endDate);
      
      const otherVacations = profiles
        .filter(p => comparedProfileIds.includes(p.id))
        .flatMap(p => p.vacations.filter(v => dateStr >= v.startDate && dateStr <= v.endDate).map(v => ({...v, color: p.color})));

      // Active Preview Logic (The specific one clicked)
      const isPreview = activeSuggestion && dateStr >= activeSuggestion.startDate && dateStr <= activeSuggestion.endDate;

      // Overlay Logic (Show all suggestions lightly)
      // Only apply if no vacation is booked
      let isSuggestionOverlay = false;
      if (showSuggestionsOverlay && !activeVacation && activeProfile) {
          isSuggestionOverlay = activeProfile.suggestions.some(s => dateStr >= s.startDate && dateStr <= s.endDate);
      }

      // Selection Logic (Start Date)
      const isSelectionStart = selectionStart === dateStr;

      // --- Styles ---
      let bgClass = "bg-white hover:bg-slate-50";
      let textClass = "text-slate-700";
      let borderClass = "border-slate-100";
      let style: React.CSSProperties = {};

      if (activeVacation && activeProfile) {
        bgClass = "text-white";
        style = { backgroundColor: activeProfile.color, borderColor: activeProfile.color };
        textClass = "text-white";
      } else if (isPreview) {
        // Active Preview (Stronger visual)
        bgClass = "bg-indigo-50";
        style = { 
            backgroundImage: `repeating-linear-gradient(45deg, ${activeProfile?.color}33, ${activeProfile?.color}33 5px, transparent 5px, transparent 10px)` 
        };
        textClass = "text-indigo-900 font-semibold";
        borderClass = "border-indigo-200 dashed";
      } else if (isSuggestionOverlay) {
        // Overlay (Very light)
        bgClass = "bg-amber-50/60";
        textClass = "text-amber-800/70";
        borderClass = "border-amber-100/50";
      } else if (activeHoliday) {
        bgClass = "bg-rose-50 hover:bg-rose-100";
        textClass = "text-rose-600 font-bold";
        borderClass = "border-rose-200";
      } else if (isWeekend) {
        bgClass = "bg-slate-50";
        textClass = "text-slate-400";
      }

      if (isSelectionStart) {
          style = { ...style, ring: '2px solid black' };
          bgClass += " ring-2 ring-slate-800 ring-offset-1 z-10";
      }

      days.push(
        <div
          key={dateStr}
          onClick={() => onDateClick(dateStr)}
          style={style}
          title={`${activeHoliday ? activeHoliday.name : ''} ${otherVacations.length > 0 ? `(${otherVacations.length} overlap)` : ''}`}
          className={`
            relative ${cellHeight} w-full flex items-center justify-center 
            cursor-pointer transition-all rounded-md border ${borderClass} ${bgClass} ${textClass}
          `}
        >
          {day}
          
          {/* Overlays for other users */}
          {otherVacations.length > 0 && !activeVacation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-full h-full flex flex-col justify-end pb-1 gap-0.5 px-1">
                    {otherVacations.map((ov, idx) => (
                        <div 
                           key={idx} 
                           className="w-full h-0.5 rounded-full shadow-sm" 
                           style={{ backgroundColor: ov.color }} 
                        />
                    ))}
                 </div>
              </div>
          )}
        </div>
      );
    }

    return (
      <div id={`month-${monthIndex}`} key={monthIndex} className={`bg-white rounded-xl shadow-sm border border-slate-200 ${isCompactView ? 'p-2' : 'p-4'} scroll-mt-28`}>
        <h3 className={`${headerSize} font-semibold text-slate-800`}>{MONTHS[monthIndex]}</h3>
        <div className={`grid grid-cols-7 ${gapSize} mb-1`}>
          {WEEKDAYS.map((d, i) => (
            <div key={i} className={`text-center ${isCompactView ? 'text-[9px]' : 'text-xs'} font-medium text-slate-400`}>
              {d}
            </div>
          ))}
        </div>
        <div className={`grid grid-cols-7 ${gapSize}`}>
          {days}
        </div>
      </div>
    );
  };

  // Grid Layout Logic
  const gridClass = isCompactView 
    ? "grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4" // Denser
    : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"; // Standard

  return (
    <div className={gridClass}>
      {MONTHS.map((_, index) => renderMonth(index))}
    </div>
  );
};

export default YearCalendar;
