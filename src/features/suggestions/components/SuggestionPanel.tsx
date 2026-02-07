import { useState } from 'react';
import { OptimizationSuggestion, Vacation } from '@/lib/types';
import { Eye, EyeOff, Loader2, RefreshCcw, Sparkles, Check, Settings2 } from 'lucide-react';

interface SuggestionPanelProps {
  suggestions: OptimizationSuggestion[];
  activeSuggestionId?: string;
  onPreview: (suggestion: OptimizationSuggestion) => void;
  onApply: (suggestion: OptimizationSuggestion) => Promise<Vacation | void>;
  onPlan: (vacation: Vacation) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  remainingPto: number;
}

export const SuggestionPanel = ({
  suggestions,
  activeSuggestionId,
  onPreview,
  onApply,
  onPlan,
  onAnalyze,
  isAnalyzing,
  remainingPto,
}: SuggestionPanelProps) => {
  const [appliedTrips, setAppliedTrips] = useState<Record<string, Vacation>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCardClick = async (suggestion: OptimizationSuggestion) => {
    if (suggestion.costInPto > remainingPto || appliedTrips[suggestion.id] || loadingId) return;
    
    setLoadingId(suggestion.id);
    const result = await onApply(suggestion);
    if (result) {
      setAppliedTrips(prev => ({ ...prev, [suggestion.id]: result }));
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-slate-400">Optimization</p>
          <p className="text-xl font-bold text-slate-900">{suggestions.length} Bridges found</p>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-100 px-4 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100 disabled:opacity-40 transition shadow-sm"
        >
          {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
          RE-ANALYZE
        </button>
      </div>
      {suggestions.length === 0 && !isAnalyzing && (
        <div className="text-center py-12 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-500 text-sm">
          <Sparkles className="mx-auto mb-3 text-brand-400" size={24} />
          <p className="font-semibold">Generate smarter breaks</p>
          <p className="text-xs text-slate-400 mt-1">Tap Analyze to find the best PTO bridges.</p>
        </div>
      )}
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => {
          const isActive = suggestion.id === activeSuggestionId;
          const isAffordable = suggestion.costInPto <= remainingPto;
          const appliedVacation = appliedTrips[suggestion.id];
          const isLoading = loadingId === suggestion.id;

          const accents = [
            'from-brand-500/10 via-brand-400/5 to-white border-brand-100',
            'from-emerald-500/10 via-emerald-400/5 to-white border-emerald-100',
            'from-sky-500/10 via-sky-400/5 to-white border-sky-100',
            'from-amber-500/10 via-amber-400/5 to-white border-amber-100',
          ];
          const accentClass = accents[index % accents.length];

          return (
            <div
              key={suggestion.id}
              onMouseEnter={() => isAffordable && !isActive && !appliedVacation && onPreview(suggestion)}
              onMouseLeave={() => isAffordable && isActive && !appliedVacation && onPreview(suggestion)}
              onClick={() => handleCardClick(suggestion)}
              className={`group relative rounded-2xl border p-4 transition-all duration-300 ${
                isActive
                  ? 'border-brand-500 bg-white ring-4 ring-brand-500/10 shadow-xl z-10 scale-[1.02]'
                  : appliedVacation 
                    ? 'border-emerald-500 bg-emerald-50/30'
                    : `bg-gradient-to-br ${accentClass} hover:shadow-lg hover:border-slate-300`
              } ${isAffordable && !appliedVacation ? 'cursor-pointer' : 'cursor-default'} ${!isAffordable ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mb-1">{suggestion.description}</p>
                  <p className="text-lg font-bold text-slate-900 leading-tight group-hover:text-brand-600 transition-colors">
                    {suggestion.title}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-tighter">Total days off</p>
                  <p className="text-3xl font-black text-slate-900">{suggestion.totalDaysOff}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-[0.65rem] font-black uppercase tracking-wider ${appliedVacation ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                    {suggestion.costInPto} PTO DAYS
                  </span>
                  {appliedVacation && (
                    <span className="flex items-center gap-1 text-[0.65rem] font-bold text-emerald-600">
                      <Check size={12} strokeWidth={3} /> APPLIED
                    </span>
                  )}
                  {isLoading && <Loader2 size={12} className="animate-spin text-slate-400" />}
                </div>
                {!isAffordable && <span className="text-[0.65rem] text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg">-{suggestion.costInPto - remainingPto} PTO needed</span>}
              </div>

              {appliedVacation && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <button
                    onClick={(e) => { e.stopPropagation(); onPlan(appliedVacation); }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-white border-2 border-emerald-100 py-2 text-[0.7rem] font-black text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition uppercase tracking-wider shadow-sm"
                  >
                    <Settings2 size={14} />
                    Plan trip details
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionPanel;
