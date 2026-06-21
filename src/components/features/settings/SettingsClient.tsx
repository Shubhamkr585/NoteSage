"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  User as UserIcon, 
  Palette, 
  Bell, 
  Camera, 
  Mail, 
  BellRing, 
  Sparkles, 
  Check, 
  Loader2
} from "lucide-react";
import { updateProfileAction } from "@/server/actions/settings";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserProfile {
  name: string;
  email: string;
  image?: string | null;
  bio: string;
  theme: string;
  accentColor: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  productUpdates: boolean;
  createdAt: Date | string;
}

interface SettingsClientProps {
  user: UserProfile;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "notifications">("profile");
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email);
  const [bio, setBio] = useState(user.bio);
  
  // Appearance state — initialise from the user's saved preference
  const [themeMode, setThemeMode] = useState<"dark" | "light">(
    (user.theme === "light" ? "light" : "dark") as "dark" | "light"
  );
  const [accentColor, setAccentColor] = useState(user.accentColor);

  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications);
  const [pushNotifications, setPushNotifications] = useState(user.pushNotifications);
  const [productUpdates, setProductUpdates] = useState(user.productUpdates);

  const [isSaving, startSaveTransition] = useTransition();
  const router = useRouter();

  // Apply theme change to the DOM immediately so the user sees it live
  const handleThemeChange = (mode: "dark" | "light") => {
    setThemeMode(mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  };

  // Sync DOM with the persisted theme on first mount
  useEffect(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync DOM with the selected accent color in real-time
  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty("--primary", accentColor);
      document.documentElement.style.setProperty("--ring", accentColor);
    }
  }, [accentColor]);

  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        await updateProfileAction({
          name,
          bio,
          theme: themeMode,
          accentColor,
          emailNotifications,
          pushNotifications,
          productUpdates,
        });
        router.refresh();
        toast.success("Settings saved successfully!");
      } catch (err: any) {
        toast.error(`Failed to save settings: ${err.message}`);
      }
    });
  };

  const handleDiscard = () => {
    setName(user.name);
    setBio(user.bio);
    // Revert live theme change too
    handleThemeChange((user.theme === "light" ? "light" : "dark") as "dark" | "light");
    setAccentColor(user.accentColor);
    setEmailNotifications(user.emailNotifications);
    setPushNotifications(user.pushNotifications);
    setProductUpdates(user.productUpdates);
  };

  const accentColors = [
    { value: "#d0bcff", name: "Default Violet" },
    { value: "#adc6ff", name: "Sleek Blue" },
    { value: "#bec6e0", name: "Steel Grey" },
    { value: "#ffb4ab", name: "Peach Coral" },
    { value: "#6d3bd7", name: "Deep Indigo" }
  ];

  return (
    <div className="flex w-full h-full justify-center">
      <div className="p-8 max-w-[1000px] w-full mx-auto animate-in fade-in zoom-in duration-500 text-on-surface">
        
        {/* Header */}
        <header className="mb-12">
          <h2 className="font-display text-headline-lg font-bold text-3xl mb-2">Settings</h2>
          <p className="text-on-surface-variant text-body-md">Manage your NoteSage experience and account preferences.</p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-8 border-b border-outline-variant mb-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button 
            id="tab-profile"
            onClick={() => setActiveTab("profile")}
            className={`relative pb-4 font-label-md text-label-md transition-all flex items-center gap-2 group ${
              activeTab === "profile" ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <UserIcon className="w-4 h-4" /> 
            Profile
            {activeTab === "profile" && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_#d0bcff80]" />}
          </button>
          <button 
            id="tab-appearance"
            onClick={() => setActiveTab("appearance")}
            className={`relative pb-4 font-label-md text-label-md transition-all flex items-center gap-2 group ${
              activeTab === "appearance" ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Palette className="w-4 h-4" /> 
            Appearance
            {activeTab === "appearance" && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_#d0bcff80]" />}
          </button>
          <button 
            id="tab-notifications"
            onClick={() => setActiveTab("notifications")}
            className={`relative pb-4 font-label-md text-label-md transition-all flex items-center gap-2 group ${
              activeTab === "notifications" ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Bell className="w-4 h-4" /> 
            Notifications
            {activeTab === "notifications" && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_#d0bcff80]" />}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-12">
          
          {/* PROFILE SECTION */}
          {activeTab === "profile" && (
            <div id="section-profile" className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-300">
              <div className="space-y-2">
                <h3 className="font-headline-md text-xl font-bold">Personal Information</h3>
                <p className="text-sm text-on-surface-variant">Update your public profile details and how we contact you.</p>
              </div>
              <div className="md:col-span-2 bg-surface-container border border-outline-variant/40 backdrop-blur-md rounded-2xl p-8 space-y-6 glass-panel">
                <div className="flex items-center gap-6 pb-6 border-b border-outline-variant/30">
                  <div className="relative group">
                    <img 
                      className="w-20 h-20 rounded-full border-2 border-primary/30 object-cover" 
                      alt="Avatar" 
                      src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6d3bd7&color=fff&size=80`}
                    />
                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <div>
                    <button className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:brightness-110 transition-all font-semibold">
                      Change Avatar
                    </button>
                    <p className="text-xs text-on-surface-variant mt-2">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-sm text-label-sm block opacity-70">Full Name</label>
                    <input 
                      id="name-input"
                      className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none transition-all text-body-md text-on-surface" 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-sm text-label-sm block opacity-70">Email Address</label>
                    <input 
                      className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface-variant/70 outline-none cursor-not-allowed text-body-md" 
                      type="email" 
                      value={email}
                      disabled
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="font-label-sm text-label-sm block opacity-70">Bio</label>
                  <textarea 
                    id="bio-input"
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary outline-none transition-all text-body-md resize-none text-on-surface" 
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE SECTION */}
          {activeTab === "appearance" && (
            <div id="section-appearance" className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-300">
              <div className="space-y-2">
                <h3 className="font-headline-md text-xl font-bold">Interface Theme</h3>
                <p className="text-sm text-on-surface-variant">Customize the look and feel of your learning environment.</p>
              </div>
              <div className="md:col-span-2 bg-surface-container border border-outline-variant/40 backdrop-blur-md rounded-2xl p-8 space-y-8 glass-panel">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    id="theme-dark-btn"
                    onClick={() => handleThemeChange("dark")}
                    className={`border-2 rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${
                      themeMode === "dark" ? "border-primary bg-primary/5" : "border-outline-variant/40 bg-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    <div className="w-full h-20 bg-slate-950 rounded flex gap-2 p-2 overflow-hidden border border-white/5">
                      <div className="w-4 h-full bg-violet-400 rounded-sm opacity-40"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-full h-2 bg-white/10 rounded"></div>
                        <div className="w-3/4 h-2 bg-white/10 rounded"></div>
                      </div>
                    </div>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Dark Mode</span>
                  </button>
                  <button 
                    id="theme-light-btn"
                    onClick={() => handleThemeChange("light")}
                    className={`border-2 rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${
                      themeMode === "light" ? "border-primary bg-primary/5" : "border-outline-variant/40 bg-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    <div className="w-full h-20 bg-slate-100 rounded flex gap-2 p-2 overflow-hidden border border-black/5">
                      <div className="w-4 h-full bg-violet-600 rounded-sm opacity-60"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-full h-2 bg-slate-300 rounded"></div>
                        <div className="w-3/4 h-2 bg-slate-300 rounded"></div>
                      </div>
                    </div>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Light Mode</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="font-label-sm text-label-sm block opacity-70">Accent Color</label>
                  <div className="flex gap-4">
                    {accentColors.map((color, colorIdx) => {
                      const isSel = accentColor === color.value;
                      return (
                        <button 
                          key={color.value}
                          id={`accent-color-btn-${colorIdx}`}
                          onClick={() => setAccentColor(color.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center`}
                          style={{ backgroundColor: color.value, borderColor: isSel ? "#ffffff" : "transparent" }}
                          title={color.name}
                        >
                          {isSel && <Check className="w-4 h-4 text-slate-950" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeTab === "notifications" && (
            <div id="section-notifications" className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-300">
              <div className="space-y-2">
                <h3 className="font-headline-md text-xl font-bold">Notification Channels</h3>
                <p className="text-sm text-on-surface-variant">Stay updated on your learning milestones and AI insights.</p>
              </div>
              <div className="md:col-span-2 bg-surface-container border border-outline-variant/40 backdrop-blur-md rounded-2xl p-8 space-y-6 glass-panel">
                
                <div className="flex items-center justify-between p-4 bg-surface-container-high/50 rounded-xl border border-outline-variant/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-label-md text-label-md font-semibold text-on-surface">Email Notifications</p>
                      <p className="text-xs text-on-surface-variant">Daily digest and security alerts</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      id="email-notif-switch"
                      type="checkbox" 
                      className="sr-only peer"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-outline-variant after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-container-high/50 rounded-xl border border-outline-variant/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-label-md text-label-md font-semibold text-on-surface">Push Notifications</p>
                      <p className="text-xs text-on-surface-variant">Direct alerts in your browser</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      id="push-notif-switch"
                      type="checkbox" 
                      className="sr-only peer"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-outline-variant after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-container-high/50 rounded-xl border border-outline-variant/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-label-md text-label-md font-semibold text-on-surface">Product Updates</p>
                      <p className="text-xs text-on-surface-variant">New AI features and learning tips</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      id="product-updates-switch"
                      type="checkbox" 
                      className="sr-only peer"
                      checked={productUpdates}
                      onChange={(e) => setProductUpdates(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-outline-variant after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex justify-end gap-4 p-4 bg-surface-container border border-outline-variant/40 backdrop-blur-md rounded-2xl z-20 glass-panel">
            <button 
              id="discard-changes-btn"
              onClick={handleDiscard}
              className="px-6 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors font-label-md text-label-md"
            >
              Discard Changes
            </button>
            <button 
              id="save-preferences-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-2.5 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all font-label-md text-label-md flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
