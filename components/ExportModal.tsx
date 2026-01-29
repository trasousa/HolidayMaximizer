import React, { useState } from 'react';
import { Download, X, Calendar, Briefcase, FileText } from 'lucide-react';
import { ExportOptions } from '../services/exportService';

interface ExportModalProps {
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  profileName: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport, profileName }) => {
  const [options, setOptions] = useState<ExportOptions>({
    excludeWeekends: true,
    excludeHolidays: true,
    includeCommuteDetails: true
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
             <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Download size={20} className="text-indigo-600" />
                    Export to Calendar
                </h2>
                <p className="text-xs text-slate-500 mt-1">Generate an .ics file for {profileName}</p>
             </div>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Option 1: Weekends */}
            <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                    <Calendar size={18} />
                </div>
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={options.excludeWeekends}
                            onChange={e => setOptions({...options, excludeWeekends: e.target.checked})}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-700">Split Weekends</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        If checked, vacation events will be split to exclude Saturdays and Sundays. Useful for requesting exact PTO days.
                    </p>
                </div>
            </div>

            {/* Option 2: Holidays */}
            <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0 mt-0.5">
                    <Calendar size={18} />
                </div>
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={options.excludeHolidays}
                            onChange={e => setOptions({...options, excludeHolidays: e.target.checked})}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-700">Exclude Public Holidays</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Skip days that are already public holidays. Keep checked if you only want to import days you need to burn allowance for.
                    </p>
                </div>
            </div>

            {/* Option 3: Commute */}
            <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                    <Briefcase size={18} />
                </div>
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={options.includeCommuteDetails}
                            onChange={e => setOptions({...options, includeCommuteDetails: e.target.checked})}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-700">Include Commute Info</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Adds the estimated commute hours saved to the event description.
                    </p>
                </div>
            </div>

        </div>

        <div className="p-6 pt-2 flex gap-3">
            <button 
                onClick={onClose} 
                className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={() => onExport(options)} 
                className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
                <Download size={18} />
                Download .ICS
            </button>
        </div>

      </div>
    </div>
  );
};

export default ExportModal;