import { useMemo, useState } from 'react';
import { OptimizationSuggestion, UserSettings, Vacation } from '@/lib/types';
import { Check, Loader2, Plus, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { formatShortRange } from '@/lib/utils/date';

interface SuggestionPanelProps {
  suggestions: OptimizationSuggestion[];
  activeSuggestionId?: string;
  onPreview: (suggestion: OptimizationSuggestion | null) => void;
  onApply: (suggestion: OptimizationSuggestion) => Promise<void>;
  lastApplied: Vacation | null;
  onEditApplied: (vacation: Vacation) => void;
  onDismissApplied: () => void;
  onOpenSettings: () => void;
  isLoading: boolean;
  remainingPto: number;
  settings: UserSettings;
}

type SortMode = 'value' | 'date';

export const SuggestionPanel = ({
  suggestions,
  activeSuggestionId,
  onPreview,
  onApply,
  lastApplied,
  onEditApplied,
  onDismissApplied,
  onOpenSettings,
  isLoading,
  remainingPto,
  settings,
}: SuggestionPanelProps) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('value');

  const sorted = useMemo(
    () => (sort === 'date' ? [...suggestions].sort((a, b) => a.breakStart.localeCompare(b.breakStart)) : suggestions),
    [suggestions, sort]
  );
  const bestId = suggestions[0]?.id;

  const handleApply = async (suggestion: OptimizationSuggestion) => {
    if (suggestion.costInPto > remainingPto || loadingId) return;
    setLoadingId(suggestion.id);
    try {
      await onApply(suggestion);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Smart bridges</p>
          <p className="text-lg font-bold text-slate-900">
            {isLoading ? 'Finding bridges…' : `${suggestions.length} ${suggestions.length === 1 ? 'opportunity' : 'opportunities'}`}
          </p>
          <p className="text-xs text-slate-500">
            {settings.minPtoDays}–{settings.maxPtoDays} PTO days · at least {settings.minEfficiency}× · {remainingPto} days left
          </p>
        </div>
        <button onClick={onOpenSettings} className="icon-btn" aria-label="Optimization rules" title="Optimization rules">
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {lastApplied && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          <Check size={16} className="shrink-0" />
          <p className="flex-1">
            Booked <strong>{formatShortRange(lastApplied.startDate, lastApplied.endDate)}</strong>.{' '}
            <button className="font-semibold underline underline-offset-2" onClick={() => onEditApplied(lastApplied)}>
              Add details
            </button>
          </p>
          <button onClick={onDismissApplied} className="text-emerald-600 hover:text-emerald-900" aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {suggestions.length > 1 && (
        <div className="segmented" role="tablist" aria-label="Sort suggestions">
          <button role="tab" aria-selected={sort === 'value'} onClick={() => setSort('value')}>
            Best value
          </button>
          <button role="tab" aria-selected={sort === 'date'} onClick={() => setSort('date')}>
            By date
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand-500" />
        </div>
      )}

      {!isLoading && suggestions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
          <Sparkles className="mx-auto mb-2 text-brand-400" size={22} />
          <p className="font-semibold text-slate-700">No bridges match your rules</p>
          <p className="mt-1 text-xs">Try a lower minimum multiplier or more PTO days per break.</p>
          <button onClick={onOpenSettings} className="btn-secondary mt-3 text-xs">
            Adjust rules
          </button>
        </div>
      )}

      <ul className="space-y-2.5">
        {sorted.map((suggestion) => {
          const isActive = suggestion.id === activeSuggestionId;
          const isAffordable = suggestion.costInPto <= remainingPto;
          const isApplying = loadingId === suggestion.id;

          return (
            <li
              key={suggestion.id}
              onMouseEnter={() => isAffordable && onPreview(suggestion)}
              onMouseLeave={() => isActive && onPreview(null)}
              className={`group rounded-xl p-3.5 ring-1 transition ${
                isActive ? 'bg-brand-50/70 ring-2 ring-brand-500' : 'bg-white ring-slate-200 hover:ring-slate-300'
              } ${!isAffordable ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => isAffordable && onPreview(isActive ? null : suggestion)}
                aria-pressed={isActive}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900">{suggestion.title}</p>
                      {suggestion.id === bestId && <span className="chip bg-amber-100 text-amber-800">Best</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Take {formatShortRange(suggestion.startDate, suggestion.endDate)} off
                      {suggestion.holidayDates.length > 0 && ` · ${suggestion.holidayDates.length} holiday${suggestion.holidayDates.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-extrabold leading-none tabular-nums text-slate-900">{suggestion.totalDaysOff}</p>
                    <p className="text-[0.65rem] font-medium text-slate-400">days off</p>
                  </div>
                </div>
              </button>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="chip bg-slate-900 text-white">{suggestion.costInPto} PTO</span>
                  <span className="chip bg-amber-50 text-amber-700 ring-1 ring-amber-200">{suggestion.efficiency.toFixed(1)}×</span>
                </div>
                {isAffordable ? (
                  <button onClick={() => handleApply(suggestion)} disabled={Boolean(loadingId)} className="btn-brand px-3 py-1.5 text-xs">
                    {isApplying ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Book
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-rose-600">Needs {suggestion.costInPto - remainingPto} more PTO</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SuggestionPanel;
