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

export const ProfileManager = ({
  profiles,
  activeProfileId,
  comparedProfileIds,
  onSwitch,
  onToggleCompare,
  onAddProfile,
}: ProfileManagerProps) => (
  <div className="flex items-center gap-2 flex-wrap" aria-label="Profile switcher">
    {profiles.map((profile) => {
      const isActive = profile.id === activeProfileId;
      const isCompared = comparedProfileIds.includes(profile.id);
      return (
        <div key={profile.id} className="relative group">
          <button
            onClick={() => onSwitch(profile.id)}
            className={`flex items-center gap-2 rounded-full border px-2 py-1 pr-3 text-sm transition-all ${
              isActive ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            <span className="w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center" style={{ backgroundColor: profile.color }}>
              {profile.avatar}
            </span>
            <span className="hidden sm:block font-medium">{profile.name}</span>
          </button>
          {!isActive && (
            <button
              onClick={() => onToggleCompare(profile.id)}
              className={`absolute -top-1 -right-1 h-6 w-6 rounded-full border text-xs flex items-center justify-center bg-white ${
                isCompared ? 'border-brand-300 text-brand-600' : 'border-slate-200 text-slate-300'
              }`}
              aria-label={isCompared ? `Hide ${profile.name} from overlay` : `Overlay ${profile.name} on calendar`}
            >
              {isCompared ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          )}
        </div>
      );
    })}
    <button
      onClick={onAddProfile}
      className="h-8 w-8 rounded-full border border-dashed border-slate-300 text-slate-400 flex items-center justify-center hover:text-brand-600 hover:border-brand-300"
      aria-label="Add profile"
    >
      <Plus size={14} />
    </button>
  </div>
);

export default ProfileManager;
