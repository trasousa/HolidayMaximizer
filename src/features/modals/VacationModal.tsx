import { useState } from 'react';
import { X } from 'lucide-react';

interface VacationModalProps {
  defaultStart?: string;
  defaultEnd?: string;
  onClose: () => void;
  onSave: (payload: { startDate: string; endDate: string; commuteHours: number; note: string }) => void;
}

export const VacationModal = ({ defaultStart = '', defaultEnd = '', onClose, onSave }: VacationModalProps) => {
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [commuteHours, setCommuteHours] = useState(0);
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="glass-panel w-full max-w-md p-6 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Trip</p>
            <h2 className="text-2xl font-semibold text-slate-900">Add vacation</h2>
          </div>
          <button className="text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="grid gap-4">
          <label className="text-xs font-semibold text-slate-500">
            Start date
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2" />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            End date
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2" />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Commute hours saved
            <input type="number" value={commuteHours} min={0} onChange={(event) => setCommuteHours(Number(event.target.value))} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2" />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Note
            <input value={note} placeholder="e.g. Alps with Leo" onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2" />
          </label>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 rounded-2xl border border-slate-200 py-3" onClick={onClose}>
            Cancel
          </button>
          <button
            className="flex-1 rounded-2xl bg-slate-900 text-white py-3 font-semibold disabled:opacity-40"
            disabled={!startDate || !endDate}
            onClick={() => onSave({ startDate, endDate, commuteHours, note })}
          >
            Save trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default VacationModal;
