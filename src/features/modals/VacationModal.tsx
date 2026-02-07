import { useState } from 'react';
import { X, Plus, Palette } from 'lucide-react';
import { Vacation, VacationCategory } from '@/lib/types';

interface VacationModalProps {
  vacation?: Vacation;
  defaultStart?: string;
  defaultEnd?: string;
  categories: VacationCategory[];
  onClose: () => void;
  onSave: (payload: { startDate: string; endDate: string; type: string; commuteHours: number; note: string }) => void;
  onUpdateCategories: (categories: VacationCategory[]) => void;
}

export const VacationModal = ({
  vacation,
  defaultStart = '',
  defaultEnd = '',
  categories,
  onClose,
  onSave,
  onUpdateCategories,
}: VacationModalProps) => {
  const [startDate, setStartDate] = useState(vacation?.startDate || defaultStart);
  const [endDate, setEndDate] = useState(vacation?.endDate || defaultEnd);
  const [type, setType] = useState(vacation?.type || 'PTO');
  const [commuteHours, setCommuteHours] = useState(vacation?.commuteHours || 0);
  const [note, setNote] = useState(vacation?.note || '');
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);

  const handleAddCategory = () => {
    const newCategory: VacationCategory = {
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      name: 'New Category',
      color: '#94a3b8',
      isPto: true,
    };
    onUpdateCategories([...categories, newCategory]);
  };

  const handleUpdateCategory = (id: string, updates: Partial<VacationCategory>) => {
    onUpdateCategories(categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)));
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    onUpdateCategories(categories.filter((cat) => cat.id !== id));
    if (type === id) setType('PTO');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">{vacation ? 'Edit Trip' : 'New Trip'}</p>
            <h2 className="text-2xl font-semibold text-slate-900">{vacation ? 'Update vacation' : 'Add vacation'}</h2>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-100 rounded-full" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition"
              />
            </label>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500">Category</span>
              <button
                type="button"
                onClick={() => setShowCategoryEditor(!showCategoryEditor)}
                className="text-[0.65rem] uppercase font-bold text-brand-600 hover:text-brand-700"
              >
                {showCategoryEditor ? 'Back to selection' : 'Manage categories'}
              </button>
            </div>

            {!showCategoryEditor ? (
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setType(cat.id)}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-sm transition ${
                      type === cat.id ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => handleUpdateCategory(cat.id, { color: e.target.value })}
                      className="h-6 w-6 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => handleUpdateCategory(cat.id, { name: e.target.value })}
                      className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0"
                    />
                    <button
                      onClick={() => handleUpdateCategory(cat.id, { isPto: !cat.isPto })}
                      className={`text-[0.6rem] px-2 py-1 rounded-full font-bold uppercase ${cat.isPto ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}`}
                    >
                      {cat.isPto ? 'PTO' : 'Free'}
                    </button>
                    {categories.length > 1 && (
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-rose-500">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddCategory}
                  className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:border-slate-300 text-xs font-semibold"
                >
                  <Plus size={14} /> Add category
                </button>
              </div>
            )}
          </div>

          <label className="space-y-1 block">
            <span className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500">Commute hours</span>
            <input
              type="number"
              value={commuteHours}
              min={0}
              onChange={(event) => setCommuteHours(Number(event.target.value))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-500">Note</span>
            <input
              value={note}
              placeholder="e.g. Alps with Leo"
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition" onClick={onClose}>
            Cancel
          </button>
          <button
            className="flex-1 rounded-2xl bg-slate-900 text-white py-3 font-semibold disabled:opacity-40 hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
            disabled={!startDate || !endDate}
            onClick={() => onSave({ startDate, endDate, type, commuteHours, note })}
          >
            {vacation ? 'Save changes' : 'Add trip'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VacationModal;
