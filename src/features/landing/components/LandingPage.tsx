import { useEffect, useMemo, useState } from 'react';
import { usePlannerUI } from '@/features/planner/context/PlannerContext';
import {
  useCreateProfileMutation,
  useDeleteProfileMutation,
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
} from '@/features/profiles/hooks/useProfiles';
import { Profile, UserSettings } from '@/lib/types';
import { fetchSupportedCountries } from '@/lib/services/locationService';
import { Check, Plus, Wand2, Pencil, Trash2 } from 'lucide-react';

const swatches = ['#1d4ed8', '#0ea5e9', '#14b8a6', '#e11d48', '#9333ea', '#f97316'];

interface LandingPageProps {
  profiles: Profile[];
  settings: UserSettings;
}

interface FormState {
  id?: string;
  name: string;
  country: string;
  city: string;
  color: string;
  allowance: number;
  isoCountryCode?: string;
}

const emptyForm = (): FormState => ({
  name: '',
  country: '',
  city: '',
  color: swatches[0],
  allowance: 30,
});

export const LandingPage = ({ profiles, settings }: LandingPageProps) => {
  const {
    selectedProfileIds,
    setSelectedProfileIds,
    setActiveProfileId,
    setViewMode,
    setComparedProfileIds,
  } = usePlannerUI();

  const [formState, setFormState] = useState<FormState>(emptyForm());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [countries, setCountries] = useState<{ key: string; value: string }[]>([]);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState(settings.year);

  const createProfile = useCreateProfileMutation();
  const updateProfile = useUpdateProfileMutation();
  const deleteProfile = useDeleteProfileMutation();
  const updateSettings = useUpdateSettingsMutation();

  useEffect(() => {
    fetchSupportedCountries().then(setCountries).catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    setSelectedProfileIds((prev) => prev.filter((id) => profiles.some((profile) => profile.id === id)));
  }, [profiles, setSelectedProfileIds]);

  useEffect(() => {
    setYear(settings.year);
  }, [settings.year]);

  const filteredCountries = useMemo(() => {
    if (!search) return countries.slice(0, 10);
    return countries.filter((country) => country.value.toLowerCase().includes(search.toLowerCase())).slice(0, 10);
  }, [countries, search]);

  const handleCardToggle = (id: string) => {
    setSelectedProfileIds((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
  };

  const handleEdit = (profile: Profile) => {
    setIsFormOpen(true);
    setFormState({
      id: profile.id,
      name: profile.name,
      country: profile.country,
      city: profile.city,
      color: profile.color,
      allowance: profile.totalAllowance,
      isoCountryCode: profile.isoCountryCode,
    });
  };

  const resetForm = () => {
    setFormState(emptyForm());
    setIsFormOpen(false);
  };

  const handleSave = async () => {
    if (!formState.name || !formState.country) return;
    const payload = {
      name: formState.name.trim(),
      avatar: formState.name.substring(0, 2).toUpperCase(),
      color: formState.color,
      country: formState.country.trim(),
      city: formState.city.trim(),
      isoCountryCode: formState.isoCountryCode,
      totalAllowance: formState.allowance,
    };
    if (formState.id) {
      await updateProfile.mutateAsync({ id: formState.id, payload });
    } else {
      const created = await createProfile.mutateAsync(payload);
      if (created?.id) {
        setSelectedProfileIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
      }
    }
    resetForm();
  };

  const handleStartPlanning = async () => {
    if (year !== settings.year) {
      await updateSettings.mutateAsync({ ...settings, year });
    }
    const [primary, ...rest] = selectedProfileIds;
    setActiveProfileId(primary ?? null);
    setComparedProfileIds(rest ?? []);
    setViewMode('planner');
  };

  const isSaving = createProfile.isPending || updateProfile.isPending;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-4">
        <p className="text-brand-600 font-semibold uppercase tracking-widest text-xs">Holiday Maximizer</p>
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight">
          Plan PTO that feels intentional, not improvised.
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Create profiles for anyone you travel with, sync their allowances, and let the optimizer surface
          the most efficient bridges across the calendar.
        </p>
        <div className="inline-flex items-center gap-3 rounded-full border border-white/40 px-5 py-2 glass-panel text-sm font-medium">
          <Wand2 size={16} className="text-brand-500" />
          {profiles.length === 0 ? 'Start by adding your first profile' : 'Select who we are planning for today'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => {
          const isSelected = selectedProfileIds.includes(profile.id);
          return (
            <button
              key={profile.id}
              onClick={() => handleCardToggle(profile.id)}
              className={`glass-panel p-5 text-left transition-all hover:-translate-y-1 hover:shadow-glass relative border-2 ${
                isSelected ? 'border-brand-400' : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-semibold" style={{ backgroundColor: profile.color }}>
                  {profile.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400">{profile.city}, {profile.country}</p>
                  <p className="text-xl font-semibold text-slate-900">{profile.name}</p>
                </div>
                {isSelected && (
                  <span className="h-6 w-6 rounded-full bg-brand-500 flex items-center justify-center text-white">
                    <Check size={16} />
                  </span>
                )}
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-4">
                <span>{profile.totalAllowance} PTO days</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEdit(profile);
                    }}
                    className="text-slate-400 hover:text-brand-600"
                    aria-label="Edit profile"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteProfile.mutate(profile.id);
                    }}
                    className="text-slate-400 hover:text-rose-500"
                    aria-label="Delete profile"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </button>
          );
        })}

        <button
          onClick={() => {
            setIsFormOpen(true);
            setFormState(emptyForm());
          }}
          className="glass-panel p-5 flex flex-col items-center justify-center gap-3 border-dashed border-2 border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200"
        >
          <Plus size={28} />
          Add traveler
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="glass-panel flex items-center gap-4 px-6 py-4 w-full md:w-auto">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Planning Year</p>
            <p className="text-2xl font-semibold text-slate-900">{year}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-8 w-8 rounded-full border border-slate-200 text-slate-500"
              onClick={() => setYear((prev) => prev - 1)}
              aria-label="Previous year"
            >
              –
            </button>
            <button
              className="h-8 w-8 rounded-full border border-slate-200 text-slate-500"
              onClick={() => setYear((prev) => prev + 1)}
              aria-label="Next year"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleStartPlanning}
          disabled={selectedProfileIds.length === 0}
          className="px-10 py-4 rounded-full text-white font-semibold text-lg shadow-lg shadow-brand-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(120deg, #7c3aed, #2563eb)' }}
        >
          Launch planner
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">{formState.id ? 'Update' : 'Create'} profile</p>
                <h2 className="text-2xl font-semibold text-slate-900">Traveler details</h2>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={resetForm} aria-label="Close">×</button>
            </div>

            <div className="grid gap-3">
              <label className="text-xs font-semibold text-slate-500">
                Name
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-slate-500">
                  Country
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
                    value={formState.country}
                    onChange={(event) => {
                      setFormState((prev) => ({ ...prev, country: event.target.value }));
                      setSearch(event.target.value);
                    }}
                    onFocus={() => setSearch(formState.country)}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-500">
                  City
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
                    value={formState.city}
                    onChange={(event) => setFormState((prev) => ({ ...prev, city: event.target.value }))}
                  />
                </label>
              </div>

              {search && filteredCountries.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-2xl border border-slate-100 p-2 bg-white">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.key}
                      onClick={() => {
                        setFormState((prev) => ({ ...prev, country: country.value, isoCountryCode: country.key }));
                        setSearch('');
                      }}
                      className="block w-full text-left px-3 py-1 text-sm rounded-lg hover:bg-slate-50"
                    >
                      {country.value}
                    </button>
                  ))}
                </div>
              )}

              <label className="text-xs font-semibold text-slate-500">
                Annual allowance
                <input
                  type="number"
                  min={5}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2"
                  value={formState.allowance}
                  onChange={(event) => setFormState((prev) => ({ ...prev, allowance: Number(event.target.value) }))}
                />
              </label>

              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Color tag</p>
                <div className="flex gap-2">
                  {swatches.map((swatch) => (
                    <button
                      key={swatch}
                      onClick={() => setFormState((prev) => ({ ...prev, color: swatch }))}
                      className={`h-8 w-8 rounded-full border-2 ${formState.color === swatch ? 'border-slate-900' : 'border-transparent'}`}
                      style={{ backgroundColor: swatch }}
                      aria-label={`Select ${swatch}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 rounded-2xl border border-slate-200 py-3" onClick={resetForm}>
                Cancel
              </button>
              <button
                className="flex-1 rounded-2xl bg-slate-900 text-white py-3 disabled:opacity-40"
                onClick={handleSave}
                disabled={isSaving}
              >
                {formState.id ? 'Save changes' : 'Create profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
