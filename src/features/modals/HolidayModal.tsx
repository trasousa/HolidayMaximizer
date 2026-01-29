import { Holiday } from '@/lib/types';
import { Info, X } from 'lucide-react';

interface HolidayModalProps {
  holiday: Holiday;
  year: number;
  onClose: () => void;
}

export const HolidayModal = ({ holiday, year, onClose }: HolidayModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="glass-panel relative w-full max-w-sm overflow-hidden">
      <div className="bg-gradient-to-br from-brand-500 to-indigo-500 p-6 text-white">
        <p className="text-xs uppercase tracking-widest text-white/70">Holiday {year}</p>
        <h2 className="text-3xl font-semibold mt-2">{holiday.date}</h2>
        <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{holiday.name}</h3>
          {holiday.localName && <p className="text-sm text-slate-500">{holiday.localName}</p>}
        </div>
        {holiday.description && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600 flex gap-2">
            <Info size={18} className="text-brand-500" />
            <p>{holiday.description}</p>
          </div>
        )}
        <button onClick={onClose} className="w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold">
          Close
        </button>
      </div>
    </div>
  </div>
);

export default HolidayModal;
