import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, MapPin, X } from 'lucide-react';
import { HolidaySource, Profile, SaveProfilePayload } from '@/lib/types';
import { Country, CountryRegion, fetchCountryRegions, fetchSupportedCountries } from '@/lib/services/locationService';
import { defaultWeekendFor } from '@/lib/constants';
import { weekdayLabel } from '@/lib/utils/date';

const SWATCHES = ['#7c3aed', '#2563eb', '#0ea5e9', '#14b8a6', '#16a34a', '#f59e0b', '#f97316', '#e11d48', '#db2777', '#475569'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface ProfileFormProps {
  profile?: Profile;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (payload: SaveProfilePayload) => Promise<void>;
}

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const ProfileForm = ({ profile, isSaving, onCancel, onSave }: ProfileFormProps) => {
  const [name, setName] = useState(profile?.name ?? '');
  const [color, setColor] = useState(profile?.color ?? SWATCHES[0]);
  const [allowance, setAllowance] = useState(profile?.totalAllowance ?? 25);
  const [countryCode, setCountryCode] = useState(profile?.isoCountryCode);
  const [countryQuery, setCountryQuery] = useState(profile?.country ?? '');
  const [regionCode, setRegionCode] = useState(profile?.isoRegionCode);
  const [city, setCity] = useState(profile?.city ?? '');
  const [regionQuery, setRegionQuery] = useState('');
  const [weekendDays, setWeekendDays] = useState<number[]>(profile?.weekendDays ?? defaultWeekendFor(profile?.isoCountryCode));

  const [countries, setCountries] = useState<Country[]>([]);
  const [countryError, setCountryError] = useState<string | null>(null);
  const [regions, setRegions] = useState<CountryRegion[]>([]);
  const [source, setSource] = useState<HolidaySource | undefined>(profile?.holidaySource);
  const [isLoadingRegions, setLoadingRegions] = useState(false);
  const [showCountryList, setShowCountryList] = useState(false);

  useEffect(() => {
    fetchSupportedCountries()
      .then(setCountries)
      .catch(() => setCountryError('Could not load the country list. Check your connection and try again.'));
  }, []);

  useEffect(() => {
    if (!countryCode) {
      setRegions([]);
      return;
    }
    let cancelled = false;
    setLoadingRegions(true);
    fetchCountryRegions(countryCode)
      .then((result) => {
        if (cancelled) return;
        setRegions(result.regions);
        setSource(result.source);
        // A region picked from the other provider (older profiles) is no longer valid.
        setRegionCode((current) => (current && result.regions.some((r) => r.key === current) ? current : undefined));
      })
      .finally(() => !cancelled && setLoadingRegions(false));
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  const country = countries.find((c) => c.key === countryCode);
  const selectedRegion = regions.find((r) => r.key === regionCode);

  const filteredCountries = useMemo(() => {
    const q = normalize(countryQuery);
    return countries.filter((c) => !q || normalize(c.value).includes(q) || c.key.toLowerCase() === q).slice(0, 8);
  }, [countries, countryQuery]);

  const filteredRegions = useMemo(() => {
    const q = normalize(regionQuery);
    return regions
      .filter((r) => !q || normalize(r.value).includes(q) || normalize(r.parent ?? '').includes(q))
      .slice(0, 50);
  }, [regions, regionQuery]);

  const pickCountry = (c: Country) => {
    setCountryCode(c.key);
    setCountryQuery(c.value);
    setShowCountryList(false);
    setRegionCode(undefined);
    setCity('');
    setRegionQuery('');
    if (!profile?.weekendDays) setWeekendDays(defaultWeekendFor(c.key));
  };

  const pickRegion = (region: CountryRegion | null) => {
    setRegionCode(region?.key);
    setCity(region?.value ?? '');
    setRegionQuery('');
  };

  const toggleWeekend = (day: number) =>
    setWeekendDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));

  const canSave = name.trim().length > 0 && Boolean(countryCode) && allowance >= 0 && weekendDays.length < 7;

  const handleSave = async () => {
    if (!canSave || !countryCode) return;
    await onSave({
      name: name.trim(),
      avatar: name.trim().slice(0, 2).toUpperCase(),
      color,
      country: country?.value ?? countryQuery,
      city: city.trim() || country?.value || countryQuery,
      isoCountryCode: countryCode,
      isoRegionCode: regionCode,
      holidaySource: source,
      weekendDays,
      totalAllowance: allowance,
      ...(profile ? {} : { categories: [], customHolidays: [] }),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal max-w-lg space-y-5" role="dialog" aria-modal="true" aria-labelledby="profile-title" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{profile ? 'Edit profile' : 'New profile'}</p>
            <h2 id="profile-title" className="text-xl font-bold text-slate-900">
              Who are we planning for?
            </h2>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4">
          <div className="grid grid-cols-[1fr,7rem] gap-3">
            <label>
              <span className="field-label">Name</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ana" autoFocus />
            </label>
            <label>
              <span className="field-label">PTO days / year</span>
              <input type="number" min={0} max={365} className="input" value={allowance} onChange={(e) => setAllowance(Math.max(0, Number(e.target.value)))} />
            </label>
          </div>

          <div className="relative">
            <label>
              <span className="field-label">Country</span>
              <input
                className="input"
                value={countryQuery}
                onChange={(e) => {
                  setCountryQuery(e.target.value);
                  setCountryCode(undefined);
                  setShowCountryList(true);
                }}
                onFocus={() => setShowCountryList(true)}
                placeholder="Search country"
                role="combobox"
                aria-expanded={showCountryList}
              />
            </label>
            {countryError && <p className="mt-1 text-xs text-rose-600">{countryError}</p>}
            {showCountryList && !countryCode && filteredCountries.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200 scroll-area" role="listbox">
                {filteredCountries.map((c) => (
                  <li key={c.key}>
                    <button onClick={() => pickCountry(c)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
                      <span>{c.value}</span>
                      <span className="text-xs text-slate-400">{c.key}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {countryCode && (
            <div>
              <span className="field-label">City / region</span>
              {isLoadingRegions ? (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={14} className="animate-spin" /> Loading regions…
                </p>
              ) : regions.length > 0 ? (
                <div className="space-y-2">
                  {selectedRegion ? (
                    <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-sm ring-1 ring-brand-200">
                      <span className="flex items-center gap-2 font-semibold text-brand-900">
                        <MapPin size={14} /> {selectedRegion.value}
                        {selectedRegion.parent && <span className="font-normal text-brand-700/70">· {selectedRegion.parent}</span>}
                      </span>
                      <button className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => pickRegion(null)}>
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <input className="input" value={regionQuery} onChange={(e) => setRegionQuery(e.target.value)} placeholder={`Search ${regions.length} regions / municipalities`} />
                      <ul className="max-h-48 overflow-y-auto rounded-xl p-1 ring-1 ring-slate-200 scroll-area">
                        <li>
                          <button onClick={() => pickRegion(null)} className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${!regionCode ? 'font-semibold text-brand-700' : ''}`}>
                            National holidays only
                            {!regionCode && <Check size={14} />}
                          </button>
                        </li>
                        {filteredRegions.map((region) => (
                          <li key={region.key}>
                            <button onClick={() => pickRegion(region)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-slate-50">
                              <span className="truncate">
                                {region.value}
                                {region.parent && <span className="text-slate-400"> · {region.parent}</span>}
                              </span>
                              {region.category && <span className="shrink-0 text-[0.65rem] uppercase tracking-wide text-slate-400">{region.category}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <p className="text-[0.7rem] text-slate-500">
                    Pick the most specific match (e.g. your municipality) to include local holidays. Anything missing can be added later as a custom holiday.
                  </p>
                </div>
              ) : (
                <>
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (label only)" />
                  <p className="mt-1 text-[0.7rem] text-slate-500">No regional data for this country – national holidays apply. Add local ones as custom holidays.</p>
                </>
              )}
            </div>
          )}

          <div>
            <span className="field-label">Weekend days</span>
            <div className="flex gap-1">
              {WEEK_ORDER.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekend(day)}
                  aria-pressed={weekendDays.includes(day)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ring-1 transition ${weekendDays.includes(day) ? 'bg-slate-900 text-white ring-slate-900' : 'text-slate-500 ring-slate-200 hover:ring-slate-300'}`}
                >
                  {weekdayLabel(day)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="field-label">Colour</span>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  onClick={() => setColor(swatch)}
                  className={`h-8 w-8 rounded-full ring-offset-2 transition ${color === swatch ? 'ring-2 ring-slate-900' : 'hover:scale-110'}`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Colour ${swatch}`}
                  aria-pressed={color === swatch}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn-secondary flex-1 py-3" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary flex-1 py-3" onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {profile ? 'Save changes' : 'Create profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
