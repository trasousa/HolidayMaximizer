import { OptimizationSuggestion } from '@/lib/types';
import { Eye, EyeOff, Loader2, RefreshCcw, Sparkles } from 'lucide-react';

interface SuggestionPanelProps {
  suggestions: OptimizationSuggestion[];
  activeSuggestionId?: string;
  onPreview: (suggestion: OptimizationSuggestion) => void;
  onApply: (suggestion: OptimizationSuggestion) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const SuggestionPanel = ({
  suggestions,
  activeSuggestionId,
  onPreview,
  onApply,
  onAnalyze,
  isAnalyzing,
}: SuggestionPanelProps) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Optimization</p>
        <p className="text-lg font-semibold text-slate-900">{suggestions.length} bridges</p>
      </div>
      <button
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-40"
      >
        {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
        Analyze
      </button>
    </div>
    {suggestions.length === 0 && !isAnalyzing && (
      <div className="text-center py-10 text-slate-500 text-sm">
        <Sparkles className="mx-auto mb-2 text-brand-400" />
        Tap “Analyze” to generate smarter breaks.
      </div>
    )}
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => {
        const isActive = suggestion.id === activeSuggestionId;
        const accents = [
          'from-brand-500/15 via-brand-400/10 to-brand-300/5 border-brand-100',
          'from-emerald-500/15 via-emerald-400/10 to-emerald-300/5 border-emerald-100',
          'from-sky-500/15 via-sky-400/10 to-sky-300/5 border-sky-100',
          'from-amber-500/15 via-amber-400/10 to-amber-300/5 border-amber-100',
        ];
        const accentClass = accents[index % accents.length];
        return (
          <div
            key={suggestion.id}
            className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
              isActive
                ? 'border-brand-400 bg-brand-50/80 ring-2 ring-brand-200'
                : `bg-gradient-to-br ${accentClass}`
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{suggestion.description}</p>
                <p className="text-lg font-semibold text-slate-900">{suggestion.title}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">Total days</p>
                <p className="text-xl font-bold text-slate-900">{suggestion.totalDaysOff}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onPreview(suggestion)}
                className={`flex-1 rounded-full border px-3 py-2 text-sm font-medium transition ${isActive ? 'border-rose-200 text-rose-600 bg-rose-50' : 'border-slate-200 text-slate-600 hover:border-brand-200 hover:text-brand-600'}`}
              >
                {isActive ? (
                  <span className="inline-flex items-center gap-2"><EyeOff size={14} /> Hide preview</span>
                ) : (
                  <span className="inline-flex items-center gap-2"><Eye size={14} /> Preview</span>
                )}
              </button>
              <button
                onClick={() => onApply(suggestion)}
                className="flex-1 rounded-full bg-slate-900 text-white px-3 py-2 text-sm font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default SuggestionPanel;
