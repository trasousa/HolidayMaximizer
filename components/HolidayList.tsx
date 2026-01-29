import React, { useState } from 'react';
import { Holiday } from '../types';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface HolidayListProps {
  holidays: Holiday[];
  year: number;
}

const HolidayList: React.FC<HolidayListProps> = ({ holidays, year }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (holidays.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Calendar size={16} />
          <span>{year} Public Holidays ({holidays.length})</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {isOpen && (
        <div className="max-h-64 overflow-y-auto p-2">
          <div className="space-y-1">
            {holidays.map((h, idx) => (
              <div key={`${h.date}-${idx}`} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm">
                 <div className="flex flex-col">
                    <span className="font-medium text-slate-800">{h.name}</span>
                    <span className="text-xs text-slate-400">{h.localName}</span>
                 </div>
                 <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                   {h.date}
                 </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayList;
