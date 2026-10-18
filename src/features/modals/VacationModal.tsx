import { useMemo, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Holiday, Vacation, VacationCategory } from '@/lib/types';
import { countBusinessDays, countTotalDays } from '@/lib/utils/date';

interface VacationModalProps {
  vacation?: Vacation;
  defaultStart?: string;
  defaultEnd?: string;
  categories: VacationCategory[];
  holidays: Holiday[];
  weekendDays: number[];
  onClose: () => void;
  onSave: (payload: { startDate: string; endDate: string; type: string; commuteHours: number; note: string }) => void;
  onDelete?: () => void;
  onUpdateCategories: (categories: VacationCategory[]) => void;
}

export const VacationModal = ({
  vacation,
  defaultStart = '',
  defaultEnd = '',
  categories,
  holidays,
  weekendDays,
  onClose,
  onSave,
  onDelete,
  onUpdateCategories,
}: VacationModalProps) => {
  const [startDate, setStartDate] = useState(vacation?.startDate || defaultStart);
  const [endDate, setEndDate] = useState(vacation?.endDate || defaultEnd || defaultStart);
  const [type, setType] = useState(vacation?.type || categories[0]?.id || 'PTO');
  const [commuteHours, setCommuteHours] = useState(vacation?.commuteHours || 0);
  const [note, setNote] = useState(vacation?.note || '');
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);

  const isValid = Boolean(startDate && endDate);
  const category = categories.find((c) => c.id === type);
  const summary = useMemo(() => {
    if (!isValid) return null;
    const holidaySet = new Set(holidays.map((h) => h.date));
    return {
      total: countTotalDays(startDate, endDate),
      pto: countBusinessDays(startDate, endDate, holidaySet, weekendDays),
    };
  }, [isValid, startDate, endDate, holidays, weekendDays]);

  const handleAddCategory = () => {
    onUpdateCategories([...categories, { id: `cat-${nanoid(8)}`, name: 'New category', color: '#94a3b8', isPto: true }]);
  };

  const handleUpdateCategory = (id: string, updates: Partial<VacationCategory>) => {
    onUpdateCategories(categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)));
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    const remaining = categories.filter((cat) => cat.id !== id);
    onUpdateCategories(remaining);
    if (type === id) setType(remaining[0].id);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-w-md space-y-5" role="dialog" aria-modal="true" aria-labelledby="vacation-title" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{vacation ? 'Edit trip' : 'New trip'}</p>
            <h2 id="vacation-title" className="text-xl font-bold text-slate-900">
              {vacation ? 'Update time off' : 'Plan time off'}
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="field-label">First day</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="input" />
            </label>
            <label>
              <span className="field-label">Last day</span>
              <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="input" />
            </label>
          </div>

          {summary && (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <strong className="text-slate-900">{summary.total}</strong> calendar days ·{' '}
              {category?.isPto ? (
                <>
                  <strong className="text-slate-900">{summary.pto}</strong> PTO days (weekends & holidays are free)
                </>
              ) : (
                'does not use PTO allowance'
              )}
            </p>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="field-label mb-0">Category</span>
              <button type="button" onClick={() => setShowCategoryEditor(!showCategoryEditor)} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                {showCategoryEditor ? 'Done' : 'Manage'}
              </button>
            </div>

            {!showCategoryEditor ? (
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setType(cat.id)}
                    aria-pressed={type === cat.id}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ring-1 transition ${
                      type === cat.id ? 'bg-brand-50 font-semibold text-brand-800 ring-2 ring-brand-500' : 'text-slate-600 ring-slate-200 hover:ring-slate-300'
                    }`}
                  >
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
                    <input type="color" value={cat.color} onChange={(e) => handleUpdateCategory(cat.id, { color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent" aria-label="Colour" />
                    <input type="text" value={cat.name} onChange={(e) => handleUpdateCategory(cat.id, { name: e.target.value })} className="input py-1.5" aria-label="Name" />
                    <button
                      onClick={() => handleUpdateCategory(cat.id, { isPto: !cat.isPto })}
                      className={`chip shrink-0 ${cat.isPto ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}`}
                      title="Does this category use PTO allowance?"
                    >
                      {cat.isPto ? 'Uses PTO' : 'Free'}
                    </button>
                    {categories.length > 1 && (
                      <button onClick={() => handleDeleteCategory(cat.id)} className="icon-btn h-7 w-7 hover:text-rose-600" aria-label={`Delete ${cat.name}`}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={handleAddCategory} className="btn-secondary w-full border-dashed text-xs">
                  <Plus size={14} /> Add category
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[1fr,2fr] gap-3">
            <label>
              <span className="field-label">Commute hours</span>
              <input type="number" value={commuteHours} min={0} onChange={(event) => setCommuteHours(Math.max(0, Number(event.target.value)))} className="input" />
            </label>
            <label>
              <span className="field-label">Note</span>
              <input value={note} placeholder="e.g. Alps with Leo" onChange={(event) => setNote(event.target.value)} className="input" />
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          {onDelete && (
            <button className="icon-btn h-11 w-11 ring-1 ring-slate-200 hover:text-rose-600" onClick={onDelete} aria-label="Delete trip">
              <Trash2 size={16} />
            </button>
          )}
          <button className="btn-secondary flex-1 py-3" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary flex-1 py-3" disabled={!isValid} onClick={() => onSave({ startDate, endDate, type, commuteHours, note })}>
            {vacation ? 'Save changes' : 'Add trip'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VacationModal;
