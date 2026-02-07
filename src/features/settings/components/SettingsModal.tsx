import { useState, useRef } from 'react';
import { UserSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { Loader2, Save, X, Download, Upload, Database } from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  onClose: () => void;
  onSave: (settings: UserSettings) => Promise<void> | void;
  isSaving: boolean;
}

export const SettingsModal = ({ settings, onClose, onSave, isSaving }: SettingsModalProps) => {
  const [draft, setDraft] = useState<UserSettings>(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    await onSave(draft);
    onClose();
  };

  const handleExport = async () => {
    try {
      const json = await storage.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `holiday-maximizer-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        await storage.importData(json);
        alert('Data imported successfully. The page will now reload.');
        window.location.reload();
      } catch (error: any) {
        alert('Failed to import data: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="glass-panel w-full max-w-lg p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Preferences</p>
            <h2 className="text-2xl font-bold text-slate-900">App Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded-lg" aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="space-y-6">
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 size={14} /> Optimization Rules
            </h3>
            <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
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
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database size={14} /> Data Management
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-600 hover:border-slate-200 hover:bg-slate-50 transition"
              >
                <Download size={16} /> Export JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-600 hover:border-slate-200 hover:bg-slate-50 transition"
              >
                <Upload size={16} /> Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </section>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-2xl bg-slate-900 text-white py-4 font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-slate-800 transition shadow-lg shadow-slate-900/10"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          SAVE & RECALCULATE
        </button>
      </div>
    </div>
  );
};

import { Settings as Settings2 } from 'lucide-react';

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
