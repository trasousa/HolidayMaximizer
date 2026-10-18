import { Holiday } from '@/lib/types';
import { CalendarPlus, X } from 'lucide-react';
import { formatLongDay } from '@/lib/utils/date';

interface HolidayModalProps {
  holiday: Holiday;
  onClose: () => void;
  onStartTrip: (date: string) => void;
}

const SCOPE_LABEL = { national: 'National holiday', regional: 'Regional / city holiday', custom: 'Custom holiday' } as const;

export const HolidayModal = ({ holiday, onClose, onStartTrip }: HolidayModalProps) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal max-w-sm space-y-4" role="dialog" aria-modal="true" aria-labelledby="holiday-title" onClick={(e) => e.stopPropagation()}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{SCOPE_LABEL[holiday.scope ?? 'national']}</p>
          <h2 id="holiday-title" className="mt-1 text-xl font-bold text-slate-900">{holiday.name}</h2>
          {holiday.localName && <p className="text-sm text-slate-500">{holiday.localName}</p>}
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{formatLongDay(holiday.date)}</p>
      {holiday.description && <p className="text-sm text-slate-600">{holiday.description}</p>}
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">
          Close
        </button>
        <button onClick={() => onStartTrip(holiday.date)} className="btn-primary flex-1">
          <CalendarPlus size={16} /> Start a trip here
        </button>
      </div>
    </div>
  </div>
);

export default HolidayModal;
