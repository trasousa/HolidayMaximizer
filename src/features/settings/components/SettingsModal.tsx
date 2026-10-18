import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { UserSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { clearApiCache } from '@/lib/services/cache';
import { Database, Download, HardDrive, Loader2, Save, SlidersHorizontal, Upload, X } from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  onClose: () => void;
  onSave: (settings: UserSettings) => Promise<void> | void;
  isSaving: boolean;
}

export const SettingsModal = ({ settings, onClose, onSave, isSaving }: SettingsModalProps) => {
  const [draft, setDraft] = useState<UserSettings>(settings);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Export failed');
    }
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!window.confirm('Importing replaces all profiles and trips stored in this browser. Continue?')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await storage.importData(e.target?.result as string);
        window.location.reload();
      } catch (error) {
        setMessage(`Import failed: ${error instanceof Error ? error.message : 'invalid file'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearCache = async () => {
    await clearApiCache();
    setMessage('Holiday cache cleared – fresh data will be downloaded.');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-w-lg space-y-6" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Preferences</p>
            <h2 className="text-xl font-bold text-slate-900">Settings</h2>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <Section icon={<SlidersHorizontal size={14} />} title="Bridge rules">
          <div className="space-y-4 rounded-xl bg-slate-50 p-4">
            <SliderField
              label="Min PTO days per break"
              value={draft.minPtoDays}
              min={1}
              max={10}
              step={1}
              onChange={(value) => setDraft((prev) => ({ ...prev, minPtoDays: value, maxPtoDays: Math.max(prev.maxPtoDays, value) }))}
            />
            <SliderField
              label="Max PTO days per break"
              value={draft.maxPtoDays}
              min={1}
              max={20}
              step={1}
              onChange={(value) => setDraft((prev) => ({ ...prev, maxPtoDays: value, minPtoDays: Math.min(prev.minPtoDays, value) }))}
            />
            <SliderField
              label="Min multiplier (days off ÷ PTO days)"
              value={draft.minEfficiency}
              display={`${draft.minEfficiency.toFixed(1)}×`}
              min={1}
              max={4}
              step={0.1}
              onChange={(value) => setDraft((prev) => ({ ...prev, minEfficiency: Number(value.toFixed(1)) }))}
            />
            <Toggle
              label="Must include a public holiday"
              description="Off: also suggest plain long weekends."
              checked={draft.requireHoliday ?? true}
              onChange={(requireHoliday) => setDraft((prev) => ({ ...prev, requireHoliday }))}
            />
            <Toggle
              label="Hide breaks in the past"
              description="Only suggest from today onwards in the current year."
              checked={draft.hidePastSuggestions ?? true}
              onChange={(hidePastSuggestions) => setDraft((prev) => ({ ...prev, hidePastSuggestions }))}
            />
          </div>
        </Section>

        <Section icon={<Database size={14} />} title="Your data">
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <HardDrive size={14} className="mt-0.5 shrink-0" />
            <span>
              Everything is saved in this browser only – nothing is sent to a server.{' '}
              {persisted === true && <strong className="text-emerald-700">Persistent storage is on.</strong>}
              {persisted === false && <strong className="text-amber-700">The browser may clear it under storage pressure – keep a backup.</strong>}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleExport} className="btn-secondary">
              <Download size={16} /> Backup
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
              <Upload size={16} /> Restore
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
          </div>
          <button onClick={handleClearCache} className="btn-ghost w-full text-xs">
            Clear cached holiday data
          </button>
          {message && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{message}</p>}
        </Section>

        <button onClick={handleSave} disabled={isSaving} className="btn-primary w-full py-3">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save & recalculate
        </button>
      </div>
    </div>
  );
};

const Section = ({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h3 className="eyebrow flex items-center gap-2">
      {icon} {title}
    </h3>
    {children}
  </section>
);

interface SliderFieldProps {
  label: string;
  value: number;
  display?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const SliderField = ({ label, value, display, min, max, step, onChange }: SliderFieldProps) => (
  <label className="block space-y-1.5 text-sm text-slate-600">
    <span className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">{display ?? value}</span>
    </span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-brand-600" />
  </label>
);

const Toggle = ({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) => (
  <label className="flex cursor-pointer items-start justify-between gap-3 text-sm">
    <span>
      <span className="block font-medium text-slate-700">{label}</span>
      <span className="text-xs text-slate-500">{description}</span>
    </span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 rounded accent-brand-600" />
  </label>
);

export default SettingsModal;
