import { useState } from 'react';
import { UserSettings } from '@/lib/types';
import { Loader2, Save, X } from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  onClose: () => void;
  onSave: (settings: UserSettings) => Promise<void> | void;
  isSaving: boolean;
}

export const SettingsModal = ({ settings, onClose, onSave, isSaving }: SettingsModalProps) => {
  const [draft, setDraft] = useState<UserSettings>(settings);

  const handleSave = async () => {
    await onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="glass-panel w-full max-w-lg p-6 space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Optimizer</p>
            <h2 className="text-2xl font-semibold text-slate-900">Tuning</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className="space-y-4">
          <SliderField
            label="Min PTO days"
            value={draft.minPtoDays}
            min={1}
            max={10}
            step={1}
            onChange={(value) => setDraft((prev) => ({ ...prev, minPtoDays: value, maxPtoDays: Math.max(prev.maxPtoDays, value) }))}
          />
          <SliderField
            label="Max PTO days"
            value={draft.maxPtoDays}
            min={draft.minPtoDays}
            max={20}
            step={1}
            onChange={(value) => setDraft((prev) => ({ ...prev, maxPtoDays: value }))}
          />
          <SliderField
            label="Min efficiency"
            value={draft.minEfficiency}
            min={1}
            max={4}
            step={0.1}
            onChange={(value) => setDraft((prev) => ({ ...prev, minEfficiency: Number(value.toFixed(1)) }))}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save & Recalculate
        </button>
      </div>
    </div>
  );
};

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const SliderField = ({ label, value, min, max, step, onChange }: SliderFieldProps) => (
  <label className="space-y-2 block text-sm font-medium text-slate-600">
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="text-slate-900 font-semibold">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full accent-brand-500"
    />
  </label>
);

export default SettingsModal;
