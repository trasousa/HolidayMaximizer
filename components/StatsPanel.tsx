import React from 'react';
import { Clock, TrendingUp, Calendar } from 'lucide-react';

interface StatsPanelProps {
  allowance: number;
  used: number;
  commuteHours: number;
  efficiency: number; // Ratio of real days off vs PTO used
  holidayCount: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ allowance, used, commuteHours, efficiency, holidayCount }) => {
  const remaining = allowance - used;
  const progressPercent = Math.min(100, (used / allowance) * 100);

  return (
    <div className="bg-slate-50/0 pointer-events-none sticky top-16 z-40 p-4">
       <div className="max-w-7xl mx-auto pointer-events-auto">
          <div className="bg-white rounded-[2rem] shadow-lg border border-slate-100 p-5 flex flex-col md:flex-row gap-6 md:items-center">
            
            {/* Main Balance with Linear Progress */}
            <div className="flex-1 min-w-[200px]">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vacation Balance</span>
                    <div className="text-right">
                        <span className={`text-3xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                            {remaining}
                        </span>
                        <span className="text-sm text-slate-400 font-medium"> / {allowance} days</span>
                    </div>
                </div>
                {/* Modern Progress Bar */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${remaining < 0 ? 'bg-red-500' : 'bg-indigo-600'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Vertical Divider (Hidden on mobile) */}
            <div className="hidden md:block w-px h-12 bg-slate-100"></div>

            {/* Metrics Grid */}
            <div className="flex gap-4 md:gap-8 justify-between md:justify-start">
                
                {/* Holidays */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-tight mb-0.5">Public<br/>Holidays</p>
                        <p className="text-xl font-bold text-slate-700 leading-none">{holidayCount}</p>
                    </div>
                </div>

                {/* Efficiency */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-tight mb-0.5">Multiplier</p>
                        <p className="text-xl font-bold text-slate-700 leading-none">{efficiency.toFixed(1)}x</p>
                    </div>
                </div>

                {/* Commute */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-tight mb-0.5">Time<br/>Spent</p>
                        <p className="text-xl font-bold text-slate-700 leading-none">{commuteHours}h</p>
                    </div>
                </div>

            </div>
          </div>
       </div>
    </div>
  );
};

export default StatsPanel;
