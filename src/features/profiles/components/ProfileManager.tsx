import { Profile } from '@/lib/types';
import { Eye, EyeOff, Plus } from 'lucide-react';

interface ProfileManagerProps {
  profiles: Profile[];
  activeProfileId: string | null;
  comparedProfileIds: string[];
  onSwitch: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onAddProfile: () => void;
}

export const ProfileManager = ({ profiles, activeProfileId, comparedProfileIds, onSwitch, onToggleCompare, onAddProfile }: ProfileManagerProps) => (
  <div className="flex items-center gap-1.5 overflow-x-auto py-1 scroll-area" aria-label="Profile switcher">
    {profiles.map((profile) => {
      const isActive = profile.id === activeProfileId;
      const isCompared = comparedProfileIds.includes(profile.id);
      return (
        <div key={profile.id} className={`flex shrink-0 items-center rounded-full ring-1 transition ${isActive ? 'bg-slate-900 ring-slate-900' : 'bg-white ring-slate-200 hover:ring-slate-300'}`}>
          <button onClick={() => onSwitch(profile.id)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm" aria-current={isActive}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-[0.6rem] font-bold text-white" style={{ backgroundColor: profile.color }}>
              {profile.avatar}
            </span>
            <span className={`font-medium ${isActive ? 'text-white' : 'text-slate-700'}`}>{profile.name}</span>
          </button>
          {!isActive && (
            <button
              onClick={() => onToggleCompare(profile.id)}
              className={`mr-1 flex h-6 w-6 items-center justify-center rounded-full transition ${isCompared ? 'bg-brand-100 text-brand-700' : 'text-slate-300 hover:text-slate-500'}`}
              aria-pressed={isCompared}
              aria-label={isCompared ? `Hide ${profile.name}'s trips` : `Show ${profile.name}'s trips on the calendar`}
              title={isCompared ? 'Hide from calendar' : 'Overlay on calendar'}
            >
              {isCompared ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          )}
        </div>
      );
    })}
    <button onClick={onAddProfile} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 border border-dashed border-slate-300 hover:border-brand-300 hover:text-brand-600" aria-label="Manage profiles" title="Manage profiles">
      <Plus size={14} />
    </button>
  </div>
);

export default ProfileManager;
