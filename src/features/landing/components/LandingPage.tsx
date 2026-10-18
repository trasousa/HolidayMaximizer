import { useEffect, useState } from 'react';
import { usePlannerUI } from '@/features/planner/context/PlannerContext';
import {
  useCreateProfileMutation,
  useDeleteProfileMutation,
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
} from '@/features/profiles/hooks/useProfiles';
import { ProfileForm } from '@/features/profiles/components/ProfileForm';
import { Profile, SaveProfilePayload, UserSettings } from '@/lib/types';
import { ArrowRight, CalendarRange, Check, ChevronLeft, ChevronRight, Lock, MapPin, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';

interface LandingPageProps {
  profiles: Profile[];
  settings: UserSettings;
}

const FEATURES = [
  { icon: Sparkles, title: 'Smart bridges', text: 'Finds the working days that join weekends and holidays into long breaks.' },
  { icon: MapPin, title: 'National, regional & city', text: 'Up-to-date public holidays down to municipality level, plus your own.' },
  { icon: Lock, title: 'Private by design', text: 'Your plan stays in this browser and is there when you come back.' },
];

export const LandingPage = ({ profiles, settings }: LandingPageProps) => {
  const { selectedProfileIds, setSelectedProfileIds, setActiveProfileId, setViewMode, setComparedProfileIds, activeProfileId } = usePlannerUI();

  const [editing, setEditing] = useState<Profile | 'new' | null>(null);
  const [year, setYear] = useState(settings.year);

  const createProfile = useCreateProfileMutation();
  const updateProfile = useUpdateProfileMutation();
  const deleteProfile = useDeleteProfileMutation();
  const updateSettings = useUpdateSettingsMutation();

  useEffect(() => setYear(settings.year), [settings.year]);

  // First visit: select the only profile automatically.
  useEffect(() => {
    if (profiles.length === 1 && selectedProfileIds.length === 0) setSelectedProfileIds([profiles[0].id]);
  }, [profiles, selectedProfileIds.length, setSelectedProfileIds]);

  const handleCardToggle = (id: string) =>
    setSelectedProfileIds((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));

  const handleSave = async (payload: SaveProfilePayload) => {
    if (editing && editing !== 'new') {
      await updateProfile.mutateAsync({ id: editing.id, payload });
    } else {
      const created = await createProfile.mutateAsync(payload);
      setSelectedProfileIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
    }
    setEditing(null);
  };

  const handleDelete = (profile: Profile) => {
    if (!window.confirm(`Delete ${profile.name} and all of their trips? This cannot be undone.`)) return;
    deleteProfile.mutate(profile.id);
  };

  const handleStartPlanning = async () => {
    if (year !== settings.year) {
      await updateSettings.mutateAsync({ ...settings, year });
    }
    const primary = selectedProfileIds.includes(activeProfileId ?? '') ? activeProfileId! : selectedProfileIds[0];
    setActiveProfileId(primary ?? null);
    setComparedProfileIds(selectedProfileIds.filter((id) => id !== primary));
    setViewMode('planner');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:py-16">
      <header className="space-y-5 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100">
          <span aria-hidden>🌴</span> Holiday Maximizer
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Turn your PTO into the <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">longest possible breaks</span>
        </h1>
        <p className="mx-auto max-w-2xl text-slate-600">
          Add everyone you travel with, pick where they live, and get the best bridge days around your public holidays.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{profiles.length === 0 ? 'Create your first profile' : 'Who are we planning for?'}</h2>
            {profiles.length > 1 && <p className="text-sm text-slate-500">Select several to compare their time off on one calendar.</p>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const isSelected = selectedProfileIds.includes(profile.id);
            return (
              <div
                key={profile.id}
                className={`card group relative p-4 transition hover:-translate-y-0.5 hover:shadow-md ${isSelected ? 'ring-2 ring-brand-500' : ''}`}
              >
                <button onClick={() => handleCardToggle(profile.id)} className="flex w-full items-center gap-3 text-left" aria-pressed={isSelected}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-white" style={{ backgroundColor: profile.color }}>
                    {profile.avatar}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold text-slate-900">{profile.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {profile.city === profile.country ? profile.country : `${profile.city}, ${profile.country}`}
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {profile.totalAllowance} PTO days · {profile.vacations.length} trips
                    </span>
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${isSelected ? 'bg-brand-600 text-white' : 'ring-1 ring-slate-200 text-transparent'}`}
                  >
                    <Check size={14} />
                  </span>
                </button>
                <div className="absolute bottom-3 right-3 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button type="button" onClick={() => setEditing(profile)} className="icon-btn h-7 w-7" aria-label={`Edit ${profile.name}`}>
                    <Pencil size={13} />
                  </button>
                  <button type="button" onClick={() => handleDelete(profile)} className="icon-btn h-7 w-7 hover:text-rose-600" aria-label={`Delete ${profile.name}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setEditing('new')}
            className="flex min-h-[6.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-500 transition hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-700"
          >
            <Plus size={22} />
            Add person
          </button>
        </div>
      </section>

      {profiles.length > 0 && (
        <section className="card flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <CalendarRange size={20} className="text-brand-600" />
            <span className="text-sm font-semibold text-slate-600">Planning year</span>
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5">
              <button className="icon-btn h-8 w-8" onClick={() => setYear((prev) => prev - 1)} aria-label="Previous year">
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[3.5rem] text-center font-bold tabular-nums">{year}</span>
              <button className="icon-btn h-8 w-8" onClick={() => setYear((prev) => prev + 1)} aria-label="Next year">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <button onClick={handleStartPlanning} disabled={selectedProfileIds.length === 0} className="btn-brand w-full px-6 py-3 text-base sm:w-auto">
            Open planner <ArrowRight size={18} />
          </button>
        </section>
      )}

      <footer className="text-center text-xs text-slate-400">
        Holiday data from{' '}
        <a className="underline underline-offset-2" href="https://www.openholidaysapi.org" target="_blank" rel="noreferrer">
          OpenHolidays API
        </a>{' '}
        and{' '}
        <a className="underline underline-offset-2" href="https://date.nager.at" target="_blank" rel="noreferrer">
          Nager.Date
        </a>
        . Your data never leaves this browser.
      </footer>

      {editing && (
        <ProfileForm
          profile={editing === 'new' ? undefined : editing}
          isSaving={createProfile.isPending || updateProfile.isPending}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default LandingPage;
