import React from 'react';
import { Profile } from '../types';
import { Plus, Eye, EyeOff } from 'lucide-react';

interface ProfileManagerProps {
  profiles: Profile[];
  activeProfileId: string;
  comparedProfileIds: string[];
  onSwitchProfile: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onAddProfile: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ 
  profiles, 
  activeProfileId, 
  comparedProfileIds,
  onSwitchProfile, 
  onToggleCompare,
  onAddProfile
}) => {
  return (
    <div className="flex items-center gap-2">
      {profiles.map(p => {
        const isActive = p.id === activeProfileId;
        const isCompared = comparedProfileIds.includes(p.id) && !isActive;

        return (
          <div key={p.id} className="relative group">
            <button
              onClick={() => onSwitchProfile(p.id)}
              className={`
                flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all
                ${isActive 
                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-100' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}
              `}
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                style={{ backgroundColor: p.color }}
              >
                {p.avatar}
              </div>
              <span className="text-sm font-medium hidden sm:block">{p.name}</span>
            </button>

             {/* Compact Compare Toggle for non-active */}
            {!isActive && (
              <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompare(p.id);
                  }}
                  className={`
                    absolute -top-1 -right-1 z-20 bg-white rounded-full p-0.5 border shadow-sm
                    ${isCompared ? 'text-indigo-600 border-indigo-200' : 'text-slate-300 border-slate-200'}
                  `}
                  title={isCompared ? "Hide from calendar" : "Overlay on calendar"}
              >
                  {isCompared ? <Eye size={10} /> : <EyeOff size={10} />}
              </button>
            )}
          </div>
        );
      })}
      
      <button
        onClick={onAddProfile}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        title="Add Profile"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

export default ProfileManager;
