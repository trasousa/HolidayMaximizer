import React, { useState, useCallback, useEffect } from 'react';
import { UserSettings, Holiday, Vacation, OptimizationSuggestion, Profile } from './types';
import YearCalendar from './components/YearCalendar';
import StatsPanel from './components/StatsPanel';
import ProfileManager from './components/ProfileManager';
import LandingPage from './components/LandingPage';
import HolidayList from './components/HolidayList';
import ExportModal from './components/ExportModal';
import { getPublicHolidays } from './services/holidayService';
import { normalizeCountry } from './services/locationService';
import { generateSmartSuggestions } from './services/optimizationService';
import { generateICSFile, ExportOptions } from './services/exportService';
import { Trash2, Loader2, Sparkles, Plane, RefreshCw, ChevronLeft, ChevronRight, Eye, EyeOff, X, Info, Settings, Save, Download } from 'lucide-react';

const App: React.FC = () => {
  // --- View State ---
  const [view, setView] = useState<'landing' | 'app'>('landing');

  // --- Data State ---
  const [settings, setSettings] = useState<UserSettings>({ 
      year: new Date().getFullYear(),
      minPtoDays: 1,
      maxPtoDays: 4,
      minEfficiency: 1.5
  });
  
  // Initialize with empty profiles
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  // Selection State
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]); 
  const [comparedProfileIds, setComparedProfileIds] = useState<string[]>([]);
  
  // Interaction State
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  
  // New States for View Options
  const [previewSuggestion, setPreviewSuggestion] = useState<OptimizationSuggestion | null>(null);
  const [showSuggestionsOverlay, setShowSuggestionsOverlay] = useState(false);
  const isCompactView = false; 
  const [activeSidebarTab, setActiveSidebarTab] = useState<'suggestions' | 'holidays' | 'trips'>('suggestions');

  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  
  // Form State
  const [newVacation, setNewVacation] = useState<Partial<Vacation>>({
    type: 'PTO',
    commuteHours: 0,
    note: ''
  });

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  // --- Effects ---
  
  // Auto-refresh data when year changes while in app view
  useEffect(() => {
    if (view === 'app' && activeProfileId) {
       fetchProfileData(activeProfileId);
       // Clear suggestions/previews on year change as they are invalid
       setPreviewSuggestion(null);
    }
  }, [settings.year]);

  // --- Handlers ---

  const handleStartPlanning = (ids: string[]) => {
    if (ids.length === 0) return;
    setSelectedUserIds(ids);
    setActiveProfileId(ids[0]);
    if (ids.length > 1) {
        setComparedProfileIds(ids.slice(1));
    } else {
        setComparedProfileIds([]);
    }
    setView('app');
    
    // Initial fetch to ensure data is loaded for the selected year
    setTimeout(() => fetchProfileData(ids[0]), 100);
  };

  const handleUpdateProfile = (updated: Profile) => {
    setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    setSelectedUserIds(prev => prev.filter(pid => pid !== id));
    if (activeProfileId === id) {
        setActiveProfileId('');
    }
  };

  const fetchProfileData = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    setIsLoading(true);
    
    // 1. Determine Country Code (Use stored ISO or normalize name)
    let isoCode = profile.isoCountryCode;
    if (!isoCode) {
        isoCode = await normalizeCountry(profile.country);
    }
    
    // 2. Fetch raw holidays for the CURRENT SETTINGS YEAR
    const rawHolidays = await getPublicHolidays(settings.year, isoCode);
    
    // 3. Generate suggestions using current settings
    const fetchedSuggestions = generateSmartSuggestions(settings, rawHolidays);

    setProfiles(prev => prev.map(p => {
      if (p.id === profileId) {
        return {
          ...p,
          isoCountryCode: isoCode,
          holidays: rawHolidays,
          suggestions: fetchedSuggestions
        };
      }
      return p;
    }));
    setIsLoading(false);
    setActiveSidebarTab('suggestions');
    setShowSuggestionsOverlay(true);
  };

  const calculateBusinessDays = useCallback((start: string, end: string, holidays: Holiday[]): number => {
    let count = 0;
    const curDate = new Date(start);
    const endDate = new Date(end);

    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dateStr = curDate.toISOString().split('T')[0];
      const isHoliday = holidays.some(h => h.date === dateStr);

      if (!isWeekend && !isHoliday) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  }, []);

  const handleDateClick = (date: string) => {
    const clickedHoliday = activeProfile.holidays.find(h => h.date === date);
    
    if (clickedHoliday && !selectionStart) {
        setSelectedHoliday(clickedHoliday);
        return;
    }

    if (!selectionStart) {
        setSelectionStart(date);
    } else {
        let start = selectionStart;
        let end = date;
        if (new Date(end) < new Date(start)) {
            [start, end] = [end, start];
        }
        
        setNewVacation({ 
            startDate: start, 
            endDate: end, 
            type: 'PTO', 
            commuteHours: 0, 
            note: '' 
        });
        setSelectionStart(null);
        setShowAddModal(true);
    }
  };

  const handleAddVacation = () => {
    if (!newVacation.startDate || !newVacation.endDate) return;
    
    const entry: Vacation = {
      id: Math.random().toString(36).substr(2, 9),
      profileId: activeProfileId,
      startDate: newVacation.startDate,
      endDate: newVacation.endDate,
      type: newVacation.type as 'PTO',
      commuteHours: Number(newVacation.commuteHours) || 0,
      note: newVacation.note
    };

    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, vacations: [...p.vacations, entry] };
      }
      return p;
    }));
    setShowAddModal(false);
    setNewVacation({ type: 'PTO', commuteHours: 0, note: '' });
  };

  const removeVacation = (vacationId: string) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, vacations: p.vacations.filter(v => v.id !== vacationId) };
      }
      return p;
    }));
  };

  const previewSuggestionAction = (s: OptimizationSuggestion) => {
      if (previewSuggestion?.id === s.id) {
          setPreviewSuggestion(null);
      } else {
          setPreviewSuggestion(s);
          const monthIndex = new Date(s.startDate).getMonth();
          const el = document.getElementById(`month-${monthIndex}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  const acceptSuggestion = (s: OptimizationSuggestion) => {
    const entry: Vacation = {
      id: Math.random().toString(36).substr(2, 9),
      profileId: activeProfileId,
      startDate: s.startDate,
      endDate: s.endDate,
      type: 'PTO',
      commuteHours: 0,
      note: `Optimized: ${s.title}`
    };
    
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, vacations: [...p.vacations, entry] };
      }
      return p;
    }));
    setPreviewSuggestion(null);
  };
  
  const handleExport = (options: ExportOptions) => {
      generateICSFile(activeProfile, options);
      setShowExportModal(false);
  };

  // --- View Logic ---
  if (view === 'landing' || !activeProfile) {
      return (
          <LandingPage 
            profiles={profiles}
            year={settings.year}
            onYearChange={(y) => setSettings({...settings, year: y})}
            onAddProfile={(p) => setProfiles(prev => [...prev, p])}
            onUpdateProfile={handleUpdateProfile}
            onDeleteProfile={handleDeleteProfile}
            onSelectProfiles={handleStartPlanning}
          />
      );
  }

  // --- Active Data Calculation ---
  const activeDaysUsed = activeProfile.vacations.reduce((acc, v) => acc + calculateBusinessDays(v.startDate, v.endDate, activeProfile.holidays), 0);
  const activeCommute = activeProfile.vacations.reduce((acc, v) => acc + v.commuteHours, 0);
  const activeTotalDaysOff = activeProfile.vacations.reduce((acc, v) => {
      const diffTime = Math.abs(new Date(v.endDate).getTime() - new Date(v.startDate).getTime());
      return acc + Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  }, 0);
  const activeEfficiency = activeDaysUsed > 0 ? activeTotalDaysOff / activeDaysUsed : 0;
  
  const sessionProfiles = profiles.filter(p => selectedUserIds.includes(p.id));

  // Tab Content Renderer
  const renderSidebarContent = () => {
      switch(activeSidebarTab) {
          case 'suggestions':
              return (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                           Found {activeProfile.suggestions.length} options
                        </span>
                        {previewSuggestion && (
                            <button 
                              onClick={() => setPreviewSuggestion(null)}
                              className="text-xs text-red-500 hover:underline flex items-center gap-1"
                            >
                                <EyeOff size={10} /> Clear Preview
                            </button>
                        )}
                    </div>

                    {activeProfile.suggestions.length > 0 ? (
                        activeProfile.suggestions.map((s) => {
                            const isPreviewing = previewSuggestion?.id === s.id;
                            return (
                                <div 
                                    key={s.id} 
                                    className={`
                                        p-3 rounded-lg border transition-all hover:shadow-md
                                        ${isPreviewing ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-slate-50 border-slate-100'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-800 text-sm">{s.title}</h4>
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                        {s.totalDaysOff} Days Off
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">{s.description}</p>
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                                        <span className="font-semibold text-indigo-600">Cost: {s.costInPto} PTO</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => previewSuggestionAction(s)}
                                            className={`
                                                flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 border
                                                ${isPreviewing 
                                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                                                    : 'bg-white text-slate-600 border-slate-200 hover:text-indigo-600 hover:border-indigo-200'}
                                            `}
                                        >
                                            {isPreviewing ? <><EyeOff size={12} /> Stop</> : <><Eye size={12} /> View</>}
                                        </button>
                                        <button 
                                            onClick={() => acceptSuggestion(s)}
                                            className="flex-1 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium rounded transition-colors"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            <Sparkles className="mx-auto mb-2 opacity-50" />
                            <p>No suggestions yet.</p>
                            <button onClick={() => fetchProfileData(activeProfileId)} className="text-indigo-600 font-medium hover:underline mt-2 text-xs">Analyze Calendar</button>
                        </div>
                    )}
                </div>
              );
          case 'holidays':
             return <HolidayList holidays={activeProfile.holidays} year={settings.year} />;
          case 'trips':
              return (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                    {activeProfile.vacations.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                           No trips planned yet.<br/>Click dates on the calendar.
                        </div>
                    ) : (
                        activeProfile.vacations.map(v => (
                            <div key={v.id} className="flex flex-col gap-1 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-indigo-600 uppercase">
                                        {new Date(v.startDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                    </span>
                                    <button onClick={() => removeVacation(v.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="text-sm font-semibold text-slate-700">
                                    {v.note || 'Vacation'}
                                </div>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                    <span>{calculateBusinessDays(v.startDate, v.endDate, activeProfile.holidays)} PTO</span>
                                    {v.commuteHours > 0 && <span className="bg-slate-200 px-1.5 rounded text-[10px]">🚗 {v.commuteHours}h</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
              );
      }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Modern Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <button onClick={() => setView('landing')} className="text-slate-400 hover:text-slate-800 transition-colors" title="Back to Home">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowSettingsModal(true)} 
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors relative group"
                        title="Optimization Settings"
                    >
                        <div className="relative">
                            <Plane size={20} />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full border border-indigo-100">
                                <Settings size={10} className="text-slate-500" />
                            </div>
                        </div>
                    </button>
                    <span className="text-lg font-bold text-slate-800 hidden sm:inline">Holiday Maximizer</span>
                </div>
                
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                
                {/* Year Navigation */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                   <button 
                      onClick={() => setSettings(s => ({...s, year: s.year - 1}))}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
                   >
                     <ChevronLeft size={16} />
                   </button>
                   <span className="w-14 text-center font-bold text-slate-800 text-sm">{settings.year}</span>
                   <button 
                      onClick={() => setSettings(s => ({...s, year: s.year + 1}))}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
                   >
                     <ChevronRight size={16} />
                   </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                 <ProfileManager 
                    profiles={sessionProfiles}
                    activeProfileId={activeProfileId}
                    comparedProfileIds={comparedProfileIds}
                    onSwitchProfile={setActiveProfileId}
                    onToggleCompare={(id) => setComparedProfileIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id])}
                    onAddProfile={() => setView('landing')} 
                />
            </div>
        </div>
      </header>

      {/* Pinned Stats Panel (Adjusted for visual "float") */}
      <StatsPanel 
            allowance={activeProfile.totalAllowance} 
            used={activeDaysUsed} 
            commuteHours={activeCommute} 
            efficiency={activeEfficiency} 
            holidayCount={activeProfile.holidays.length}
      />

      <main className="max-w-7xl mx-auto px-4 pb-8">
        
        {/* Context & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-2">
           <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span style={{ backgroundColor: activeProfile.color }} className="w-3 h-3 rounded-full inline-block"></span>
                {activeProfile.name}'s Plan
              </h2>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                <span className="font-medium">{activeProfile.city}, {activeProfile.country}</span>
                {activeProfile.holidays.length > 0 && <span className="text-slate-300">•</span>}
                {activeProfile.holidays.length > 0 && <span>{activeProfile.holidays.length} Holidays Fetched</span>}
              </p>
           </div>
           
           <div className="flex gap-2">
               {/* Export Button */}
               <button 
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm"
               >
                   <Download size={16} />
                   <span className="hidden md:inline">Export</span>
               </button>

               {/* View Toggles */}
               <button 
                  onClick={() => setShowSuggestionsOverlay(!showSuggestionsOverlay)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${showSuggestionsOverlay ? 'bg-amber-100 text-amber-800' : 'bg-white border border-slate-200 text-slate-600'}`}
               >
                  <Sparkles size={16} />
                  <span className="hidden md:inline">Suggestions</span>
               </button>

                <button 
                    onClick={() => fetchProfileData(activeProfileId)}
                    disabled={isLoading}
                    className="px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-lg shadow-sm hover:shadow font-medium flex items-center gap-2 transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                    <span>Fetch</span>
                </button>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Tabbed Sidebar */}
            <div className="w-full lg:w-80 flex flex-col gap-4 order-2 lg:order-1">
                
                {/* Tabs */}
                <div className="flex p-1 bg-slate-200/50 rounded-lg">
                    <button 
                        onClick={() => setActiveSidebarTab('suggestions')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeSidebarTab === 'suggestions' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Suggestions
                    </button>
                    <button 
                        onClick={() => setActiveSidebarTab('holidays')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeSidebarTab === 'holidays' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Holidays
                    </button>
                    <button 
                        onClick={() => setActiveSidebarTab('trips')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeSidebarTab === 'trips' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Trips
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 min-h-[400px]">
                    {renderSidebarContent()}
                </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 order-1 lg:order-2">
                <YearCalendar 
                    year={settings.year} 
                    profiles={sessionProfiles}
                    activeProfileId={activeProfileId}
                    comparedProfileIds={comparedProfileIds}
                    activeSuggestion={previewSuggestion}
                    selectionStart={selectionStart}
                    onDateClick={handleDateClick}
                    showSuggestionsOverlay={showSuggestionsOverlay}
                    isCompactView={isCompactView}
                />
            </div>
        </div>

      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Settings className="text-slate-400" size={20} />
                        Optimization Settings
                    </h2>
                    <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Min PTO Days to Spend</label>
                            <span className="text-xs font-bold text-indigo-600">{settings.minPtoDays} days</span>
                        </div>
                        <input 
                            type="range" min="1" max="10" step="1"
                            value={settings.minPtoDays}
                            onChange={(e) => setSettings({...settings, minPtoDays: parseInt(e.target.value)})}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Max PTO Days to Spend</label>
                            <span className="text-xs font-bold text-indigo-600">{settings.maxPtoDays} days</span>
                        </div>
                        <input 
                            type="range" min={settings.minPtoDays} max="20" step="1"
                            value={settings.maxPtoDays}
                            onChange={(e) => setSettings({...settings, maxPtoDays: parseInt(e.target.value)})}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Min Efficiency Ratio</label>
                            <span className="text-xs font-bold text-indigo-600">{settings.minEfficiency}x</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2">A ratio of 2.0 means you get 2 days off for every 1 PTO day used.</p>
                        <input 
                            type="range" min="1" max="5" step="0.1"
                            value={settings.minEfficiency}
                            onChange={(e) => setSettings({...settings, minEfficiency: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                </div>

                <div className="mt-8">
                    <button 
                        onClick={() => {
                            setShowSettingsModal(false);
                            // Trigger re-fetch/re-calc if suggestions exist
                            if (activeProfile.holidays.length > 0) {
                                fetchProfileData(activeProfileId);
                            }
                        }} 
                        className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={16} />
                        Save & Recalculate
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
          <ExportModal 
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
            profileName={activeProfile.name}
          />
      )}

      {/* Holiday Details Modal */}
      {selectedHoliday && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative">
                <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 flex flex-col justify-end">
                    <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">{settings.year}</span>
                    <h2 className="text-2xl font-bold text-white leading-none">{selectedHoliday.date}</h2>
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{selectedHoliday.name}</h3>
                            {selectedHoliday.localName && (
                                <p className="text-sm text-slate-500 italic">{selectedHoliday.localName}</p>
                            )}
                        </div>
                    </div>
                    
                    {selectedHoliday.description && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                          <div className="flex gap-2 items-start">
                              <Info size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                              <p className="text-sm text-slate-600 leading-relaxed">
                                  {selectedHoliday.description}
                              </p>
                          </div>
                      </div>
                    )}

                    <button 
                        onClick={() => setSelectedHoliday(null)}
                        className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-black transition-colors"
                    >
                        Close
                    </button>
                </div>
                <button 
                    onClick={() => setSelectedHoliday(null)}
                    className="absolute top-4 right-4 text-white/70 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
      )}

      {/* Add Vacation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-slate-900">Add Vacation</h2>
                 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start</label>
                  <input type="date" value={newVacation.startDate} onChange={e => setNewVacation({...newVacation, startDate: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">End</label>
                  <input type="date" value={newVacation.endDate} onChange={e => setNewVacation({...newVacation, endDate: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Est. Commute (Hours)</label>
                  <input type="number" value={newVacation.commuteHours} onChange={e => setNewVacation({...newVacation, commuteHours: parseInt(e.target.value)})} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Note / Annotation</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Summer Trip to Italy"
                    value={newVacation.note || ''} 
                    onChange={e => setNewVacation({...newVacation, note: e.target.value})} 
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={handleAddVacation} className="flex-1 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg">Save Trip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;