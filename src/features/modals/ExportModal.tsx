import { useState } from 'react';
import { ExportOptions } from '@/lib/services/exportService';
import { Download, X } from 'lucide-react';

interface ExportModalProps {
  profileName: string;
  onExport: (options: ExportOptions) => void;
  onClose: () => void;
}

export const ExportModal = ({ profileName, onExport, onClose }: ExportModalProps) => {
  const [options, setOptions] = useState<ExportOptions>({
    excludeWeekends: true,
    excludeHolidays: true,
    includeCommuteDetails: false,
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-w-md space-y-5" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Export to calendar</p>
            <h2 className="text-xl font-bold text-slate-900">{profileName}</h2>
            <p className="text-sm text-slate-500">Download an .ics file for Google Calendar, Outlook or Apple Calendar.</p>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="space-y-2">
          <CheckboxRow
            title="Skip weekends"
            description="Split events so only working days appear – your manager sees the real PTO."
            checked={options.excludeWeekends}
            onChange={(checked) => setOptions((prev) => ({ ...prev, excludeWeekends: checked }))}
          />
          <CheckboxRow
            title="Skip public holidays"
            description="Leave out days that are already holidays."
            checked={options.excludeHolidays}
            onChange={(checked) => setOptions((prev) => ({ ...prev, excludeHolidays: checked }))}
          />
          <CheckboxRow
            title="Include commute notes"
            description="Append saved commute hours to the event description."
            checked={options.includeCommuteDetails}
            onChange={(checked) => setOptions((prev) => ({ ...prev, includeCommuteDetails: checked }))}
          />
        </div>
        <button onClick={() => onExport(options)} className="btn-primary w-full py-3">
          <Download size={16} />
          Download .ics
        </button>
      </div>
    </div>
  );
};

const CheckboxRow = ({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <label className="flex cursor-pointer gap-3 rounded-xl p-3 text-sm text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-brand-600" />
    <span>
      <span className="block font-semibold text-slate-900">{title}</span>
      {description}
    </span>
  </label>
);

export default ExportModal;
