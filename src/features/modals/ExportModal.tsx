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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="glass-panel w-full max-w-md p-6 space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Export schedule</p>
            <h2 className="text-2xl font-semibold text-slate-900">{profileName}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className="space-y-4">
          <CheckboxRow
            title="Split weekends"
            description="Only include weekdays in PTO events so managers see the true PTO burn."
            checked={options.excludeWeekends}
            onChange={(checked) => setOptions((prev) => ({ ...prev, excludeWeekends: checked }))}
          />
          <CheckboxRow
            title="Remove public holidays"
            description="Skip days that are already government holidays."
            checked={options.excludeHolidays}
            onChange={(checked) => setOptions((prev) => ({ ...prev, excludeHolidays: checked }))}
          />
          <CheckboxRow
            title="Include commute notes"
            description="Append commute hours saved into the event description."
            checked={options.includeCommuteDetails}
            onChange={(checked) => setOptions((prev) => ({ ...prev, includeCommuteDetails: checked }))}
          />
        </div>
        <button
          onClick={() => onExport(options)}
          className="w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold inline-flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Download .ics
        </button>
      </div>
    </div>
  );
};

const CheckboxRow = ({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-slate-600">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 accent-brand-500" />
    <span>
      <span className="block font-semibold text-slate-900">{title}</span>
      {description}
    </span>
  </label>
);

export default ExportModal;
