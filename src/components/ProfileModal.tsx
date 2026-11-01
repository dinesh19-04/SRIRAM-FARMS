import React, { useState, useEffect } from 'react';
import { UserProfile, Language } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  User,
  Check,
  X,
  Camera,
  Upload,
  GraduationCap,
  Calendar,
  Phone,
  ShieldCheck,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: UserProfile;
  onUpdateProfile: (uid: string, profile: Partial<UserProfile>) => Promise<void>;
  onSwitchAccount: (targetRole: 'Owner' | 'Manager') => Promise<void>;
  onSignInWithGoogle?: () => Promise<void>;
  onSignOut?: () => Promise<void>;
  language: Language;
}

const PRESET_AVATARS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%2314532d"/><circle cx="60" cy="46" r="22" fill="%23fde047"/><path d="M60 40 C52 40 45 44 43 51 C48 53 54 54 60 54 C66 54 72 53 77 51 C75 44 68 40 60 40 Z" fill="%23713f12" opacity="0.4"/><path d="M42 42 Q60 30 78 42 Q60 34 42 42 Z" fill="%231e293b"/><path d="M26 104 C26 84 41 74 60 74 C79 74 94 84 94 104 Z" fill="%23fef08a"/><path d="M35 104 L60 84 L85 104 Z" fill="%2315803d"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%23166534"/><circle cx="60" cy="46" r="22" fill="%23fcd34d"/><path d="M40 38 Q60 22 80 38 Q75 30 60 28 Q45 30 40 38 Z" fill="%230f172a"/><path d="M26 104 C26 84 41 74 60 74 C79 74 94 84 94 104 Z" fill="%23f1f5f9"/><path d="M46 104 L60 82 L74 104 Z" fill="%230284c7"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%230f766e"/><circle cx="60" cy="46" r="22" fill="%23fed7aa"/><path d="M40 40 Q60 26 80 40 Z" fill="%231e293b"/><path d="M26 104 C26 84 41 74 60 74 C79 74 94 84 94 104 Z" fill="%23f8fafc"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%23854d0e"/><circle cx="60" cy="46" r="22" fill="%23fef08a"/><path d="M38 42 Q60 28 82 42 Z" fill="%23334155"/><path d="M26 104 C26 84 41 74 60 74 C79 74 94 84 94 104 Z" fill="%23ecfdf5"/></svg>',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onUpdateProfile,
  onSwitchAccount,
  onSignInWithGoogle,
  onSignOut,
  language,
}) => {
  const t = useTranslation(language);
  const [isEditing, setIsEditing] = useState(false);

  // Edit states for the current user's profile
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [education, setEducation] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  const [isSaving, setIsSaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync form state when activeProfile changes or edit starts
  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name || '');
      setMobile(activeProfile.mobile || activeProfile.phone || '');
      setAge(activeProfile.age || (activeProfile.role === 'Owner' ? 48 : 22));
      setEducation(activeProfile.education || '');
      setPhotoUrl(activeProfile.photoUrl || activeProfile.photoURL);
    }
  }, [activeProfile, isEditing]);

  if (!isOpen) return null;

  const handleStartEdit = () => {
    setName(activeProfile.name || '');
    setMobile(activeProfile.mobile || activeProfile.phone || '');
    setAge(activeProfile.age || (activeProfile.role === 'Owner' ? 48 : 22));
    setEducation(activeProfile.education || '');
    setPhotoUrl(activeProfile.photoUrl || activeProfile.photoURL);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 240;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw cropped square
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoUrl(compressed);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const sanitizedMobile = mobile.replace(/\s+/g, '').trim();
      await onUpdateProfile(activeProfile.uid, {
        name: name.trim(),
        mobile: sanitizedMobile,
        phone: sanitizedMobile,
        age: age ? Number(age) : undefined,
        education: education.trim(),
        photoUrl,
        photoURL: photoUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess(false);
      }, 900);
    } catch (err) {
      console.error('Save profile error in modal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchRole = async (targetRole: 'Owner' | 'Manager') => {
    if (activeProfile.role === targetRole) return;
    setIsSwitching(true);
    try {
      setIsEditing(false);
      await onSwitchAccount(targetRole);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-stone-200">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-base font-bold leading-tight">
                {isEditing ? `Edit ${activeProfile.role} Profile` : 'Account Profile & Sessions'}
              </h3>
              <p className="text-[11px] text-emerald-200">
                Isolated per account UID in Firestore (<span className="font-mono">{activeProfile.uid.slice(0, 16)}...</span>)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Cloud Sync Status Banner */}
          <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-950 font-bold">
                Firestore Collection: <code className="font-mono text-emerald-800">users/{activeProfile.uid}</code>
              </span>
            </div>
            <span className="text-[10px] text-emerald-800 font-semibold hidden sm:inline">
              Multi-Device Real-time Sync
            </span>
          </div>

          {/* EDIT FORM MODE */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                {/* Profile Picture Upload & Presets */}
                <div>
                  <label className="text-[10px] text-stone-600 font-bold uppercase block mb-1">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-600 shrink-0 bg-stone-200">
                      {photoUrl ? (
                        <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-stone-600">
                          {name.charAt(0) || 'P'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>

                        <label className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs cursor-pointer">
                          <Camera className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>

                        {photoUrl && (
                          <button
                            type="button"
                            onClick={() => setPhotoUrl(undefined)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                            title="Remove photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Quick Preset Avatars */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-stone-400">Presets:</span>
                        {PRESET_AVATARS.map((svg, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPhotoUrl(svg)}
                            className="w-6 h-6 rounded-full overflow-hidden border border-stone-300 hover:scale-110 transition"
                          >
                            <img src={svg} alt="Preset" className="w-full h-full" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role is FIXED to prevent role escalation */}
                <div>
                  <label className="text-[10px] text-stone-600 font-bold uppercase block mb-1">
                    Assigned Account Role (Immutable)
                  </label>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-stone-900">{activeProfile.role}</span>
                    <span className="text-[10px] text-stone-400 ml-auto">
                      Role cannot be changed in profile editor
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-stone-600 font-bold uppercase block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-600 font-bold uppercase block mb-1">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="90"
                      value={age}
                      onChange={e => setAge(parseInt(e.target.value, 10) || '')}
                      placeholder={activeProfile.role === 'Owner' ? '48' : '22'}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-stone-600 font-bold uppercase block mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-600 font-bold uppercase block mb-1">
                    Education / Studies / Qualifications
                  </label>
                  <input
                    type="text"
                    value={education}
                    onChange={e => setEducation(e.target.value)}
                    placeholder="e.g. B.E. Agricultural Engineering / Diploma / B.Sc"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Profile saved to Firestore! Updating interface...</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs min-h-[44px] flex items-center justify-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSaving ? 'Saving to Cloud...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* ACTIVE PROFILE DISPLAY CARD */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/40 shadow-xs space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Profile Picture */}
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-600 shrink-0 bg-stone-200 shadow-sm">
                      {activeProfile.photoUrl || activeProfile.photoURL ? (
                        <img
                          src={activeProfile.photoUrl || activeProfile.photoURL}
                          alt={activeProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-emerald-800 text-amber-200 flex items-center justify-center font-bold text-xl">
                          {activeProfile.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                        ✓
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-stone-900 leading-tight">
                          {activeProfile.name}
                        </h4>
                        <span className="text-[10px] bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded-full">
                          {activeProfile.role}
                        </span>
                      </div>

                      <div className="text-xs text-stone-600 font-mono mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>{activeProfile.mobile || activeProfile.phone}</span>
                      </div>

                      {activeProfile.email && (
                        <div className="text-[11px] text-stone-500 font-mono">
                          {activeProfile.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleStartEdit}
                    className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs min-h-[38px]"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {/* Age and Studies Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 border-t border-emerald-200/60 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-700">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>
                      Age: <strong className="text-stone-900">{activeProfile.age ? `${activeProfile.age} Years` : (activeProfile.role === 'Owner' ? '48 Years' : '22 Years')}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-700">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">
                      Studies: <strong className="text-stone-900">{activeProfile.education || (activeProfile.role === 'Owner' ? 'B.A. (Farm Machinery)' : 'B.E. Agricultural Engineering')}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 text-[10px] text-stone-500 font-mono flex items-center justify-between">
                  <span>Document: <strong>users/{activeProfile.uid}</strong></span>
                  <span>{activeProfile.updatedAt ? `Updated: ${new Date(activeProfile.updatedAt).toLocaleTimeString()}` : 'Live Cloud'}</span>
                </div>
              </div>

              {/* ACCOUNT SEPARATION & SWITCHING SECTION */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Switch Active Session / Device Account
                    </h5>
                  </div>
                  <span className="text-[10px] text-stone-500 font-semibold">Separate Profiles</span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Log in as Owner or Manager. Each account maintains its own isolated profile document in Firestore (<code className="font-mono text-emerald-800">users/{'{uid}'}</code>). Both share all customers and planting records.
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* Switch to Owner */}
                  <button
                    type="button"
                    disabled={isSwitching || activeProfile.role === 'Owner'}
                    onClick={() => handleSwitchRole('Owner')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[70px] ${
                      activeProfile.role === 'Owner'
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-600 text-emerald-950 font-bold'
                        : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">Owner Account</span>
                      {activeProfile.role === 'Owner' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                          Logged In
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      Prop: RAJA S · 8072514712
                    </div>
                  </button>

                  {/* Switch to Manager */}
                  <button
                    type="button"
                    disabled={isSwitching || activeProfile.role === 'Manager'}
                    onClick={() => handleSwitchRole('Manager')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[70px] ${
                      activeProfile.role === 'Manager'
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-600 text-emerald-950 font-bold'
                        : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">Manager Account</span>
                      {activeProfile.role === 'Manager' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                          Logged In
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      Mngr: DINESH H · 9840123456
                    </div>
                  </button>
                </div>

                {/* Optional Google Login */}
                {onSignInWithGoogle && (
                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={onSignInWithGoogle}
                      className="px-3 py-2 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Sign In with Google Account</span>
                    </button>

                    {onSignOut && (
                      <button
                        type="button"
                        onClick={onSignOut}
                        className="text-stone-500 hover:text-red-600 text-xs font-bold transition flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 min-h-[44px] transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
