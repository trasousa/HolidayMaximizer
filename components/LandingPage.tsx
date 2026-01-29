import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { Plus, Check, User, ArrowRight, MapPin, Search, Trash2, Pencil, Calendar } from 'lucide-react';
import { fetchSupportedCountries } from '../services/locationService';

interface LandingPageProps {
  profiles: Profile[];
  onAddProfile: (p: Profile) => void;
  onUpdateProfile: (p: Profile) => void;
  onDeleteProfile: (id: string) => void;
  onSelectProfiles: (ids: string[]) => void;
  year: number;
  onYearChange: (year: number) => void;
}

const PASTEL_COLORS = [
  { value: '#94a3b8', label: 'Slate' }, // Neutral
  { value: '#f87171', label: 'Red' },   // Soft Red
  { value: '#fbbf24', label: 'Amber' }, // Soft Orange
  { value: '#34d399', label: 'Emerald' }, // Soft Green
  { value: '#60a5fa', label: 'Blue' },    // Soft Blue
  { value: '#a78bfa', label: 'Violet' },  // Soft Purple
  { value: '#f472b6', label: 'Pink' },    // Soft Pink
];

interface CountryOption {
    key: string;
    value: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  profiles, 
  onAddProfile, 
  onUpdateProfile, 
  onDeleteProfile, 
  onSelectProfiles, 
  year, 
  onYearChange 
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New Profile State
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newColor, setNewColor] = useState(PASTEL_COLORS[4].value);
  const [newYear, setNewYear] = useState(year); // Initialized with global year
  
  // Country Search State
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [availableCountries, setAvailableCountries] = useState<CountryOption[]>([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  useEffect(() => {
      // Load countries on mount
      fetchSupportedCountries().then(setAvailableCountries);
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const filteredCountries = availableCountries.filter(c => 
    c.value.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectCountry = (c: CountryOption) => {
      setCountrySearch(c.value);
      setSelectedCountryCode(c.key);
      setShowCountryDropdown(false);
  };

  const startEditing = (p: Profile, e: React.MouseEvent) => {
      e.stopPropagation();
      setFormMode('edit');
      setEditingId(p.id);
      setNewName(p.name);
      setNewCity(p.city);
      setNewColor(p.color);
      setCountrySearch(p.country);
      setSelectedCountryCode(p.isoCountryCode || '');
      setNewYear(year); // Default to current app year, but user can change it
  };

  const resetForm = () => {
      setFormMode(null);
      setEditingId(null);
      setNewName('');
      setNewCity('');
      setCountrySearch('');
      setSelectedCountryCode('');
      setNewColor(PASTEL_COLORS[4].value);
      setNewYear(year);
  };

  const handleSave = () => {
    if (!newName || !countrySearch) return;

    if (formMode === 'create') {
        const newProfile: Profile = {
          id: Math.random().toString(36).substr(2, 9),
          name: newName,
          color: newColor,
          avatar: newName.substring(0, 2).toUpperCase(),
          country: countrySearch,
          isoCountryCode: selectedCountryCode || undefined, 
          city: newCity,
          totalAllowance: 30, // Default
          holidays: [],
          vacations: [],
          suggestions: []
        };
        onAddProfile(newProfile);
        // If year changed in form, update global app year
        if (newYear !== year) onYearChange(newYear);
        setSelectedIds(prev => [...prev, newProfile.id]);
    } else if (formMode === 'edit' && editingId) {
        const existing = profiles.find(p => p.id === editingId);
        if (existing) {
            onUpdateProfile({
                ...existing,
                name: newName,
                city: newCity,
                country: countrySearch,
                isoCountryCode: selectedCountryCode || existing.isoCountryCode,
                color: newColor,
                avatar: newName.substring(0, 2).toUpperCase()
            });
            // If year changed in form, update global app year
            if (newYear !== year) onYearChange(newYear);
        }
    }
    
    resetForm();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Holiday Maximizer</h1>
          <p className="text-slate-500 text-lg">
             {profiles.length === 0 ? "Let's create your first profile." : "Who are we planning for today?"}
          </p>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {profiles.map(profile => {
            const isSelected = selectedIds.includes(profile.id);
            return (
              <div 
                key={profile.id}
                onClick={() => toggleSelection(profile.id)}
                className={`
                  relative cursor-pointer rounded-2xl p-6 transition-all duration-200 border-2 group
                  ${isSelected 
                    ? 'border-indigo-500 bg-white shadow-xl scale-105 z-10' 
                    : 'border-transparent bg-white shadow-sm hover:shadow-md hover:scale-[1.02]'}
                `}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{profile.name}</h3>
                    <div className="flex items-center text-xs text-slate-400 gap-1 truncate">
                      <MapPin size={10} className="shrink-0" />
                      <span className="truncate">{profile.city}, {profile.country}</span>
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-indigo-500 text-white rounded-full p-1 shadow-sm">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}

                {/* Edit/Delete Actions (Visible on hover) */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isSelected && (
                        <>
                            <button 
                                onClick={(e) => startEditing(profile, e)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full"
                                title="Edit"
                            >
                                <Pencil size={12} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteProfile(profile.id); }}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 rounded-full"
                                title="Delete"
                            >
                                <Trash2 size={12} />
                            </button>
                        </>
                    )}
                </div>
              </div>
            );
          })}

          {/* Add New Card */}
          {!formMode ? (
            <button 
              onClick={() => { setFormMode('create'); setNewYear(year); }}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-6 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all gap-3 min-h-[140px]"
            >
              <Plus size={32} />
              <span className="font-medium">Add Person</span>
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 flex flex-col gap-3 animate-in fade-in zoom-in-95 ring-2 ring-indigo-500/20">
               <h3 className="font-bold text-slate-700 text-sm flex justify-between">
                   {formMode === 'create' ? 'New Profile' : 'Edit Profile'}
               </h3>
               
               <div className="flex gap-2">
                    <input 
                        autoFocus
                        placeholder="Name" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-2/3 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="w-1/3 relative">
                        <input 
                           type="number"
                           value={newYear}
                           onChange={e => setNewYear(parseInt(e.target.value))}
                           className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 pl-8"
                        />
                        <Calendar size={12} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
               </div>

               <div className="flex gap-2">
                 
                 {/* Country Autocomplete */}
                 <div className="relative w-1/2">
                    <input 
                        placeholder="Country" 
                        value={countrySearch}
                        onChange={e => {
                            setCountrySearch(e.target.value);
                            setShowCountryDropdown(true);
                            setSelectedCountryCode(''); // Reset code if typing
                        }}
                        onFocus={() => setShowCountryDropdown(true)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {showCountryDropdown && filteredCountries.length > 0 && (
                        <div className="absolute z-10 top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                           {filteredCountries.map(c => (
                               <div 
                                 key={c.key}
                                 onClick={() => selectCountry(c)}
                                 className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                               >
                                   {c.value}
                               </div>
                           ))}
                        </div>
                    )}
                 </div>
                 
                 <input 
                    placeholder="City" 
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                 />
               </div>

               {/* Color Picker */}
               <div className="flex gap-2 justify-center mt-1">
                  {PASTEL_COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setNewColor(c.value)}
                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${newColor === c.value ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''}`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                  ))}
               </div>

               <div className="flex gap-2 mt-2">
                   <button onClick={resetForm} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium">Cancel</button>
                   <button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm">
                       {formMode === 'create' ? 'Create' : 'Save'}
                   </button>
               </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex justify-center">
            <button 
                onClick={() => onSelectProfiles(selectedIds)}
                disabled={selectedIds.length === 0}
                className={`
                    flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all
                    ${selectedIds.length > 0 
                        ? 'bg-slate-900 text-white hover:scale-105 hover:bg-black cursor-pointer' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                `}
            >
                <span>Start Planning</span>
                <ArrowRight size={20} />
            </button>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;