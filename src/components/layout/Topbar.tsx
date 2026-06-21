"use client";

import { Search, Bell, LogOut, Settings, User, Sun, Moon } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState, useEffect } from "react";

export function Topbar() {
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  };

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-280px)] z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant/50 h-16 px-4 md:px-margin-desktop flex justify-between items-center">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-60 group-focus-within:text-primary transition-colors" />
          <input 
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-full pl-10 pr-4 py-2 text-label-md text-on-surface focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/40 outline-none" 
            placeholder="Search flashcards or docs..." 
            type="text" 
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none cursor-pointer"
          title="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 text-on-surface-variant hover:text-primary transition-colors relative focus:outline-none cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              <div className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="font-semibold text-xs text-primary">System</span>
                </div>
                <p className="text-xs text-on-surface">Welcome to NoteSage! Try uploading a PDF to start using Doc Chat.</p>
                <span className="text-[10px] text-on-surface-variant/60 mt-1">Just now</span>
              </div>
              <DropdownMenuSeparator />
              <div className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="font-semibold text-xs text-primary">Model Update</span>
                </div>
                <p className="text-xs text-on-surface">We migrated to gemini-embedding-001 (3072-dim) for high quality search indexing.</p>
                <span className="text-[10px] text-on-surface-variant/60 mt-1">1 hour ago</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <Link href="/settings" passHref legacyBehavior>
              <DropdownMenuItem className="cursor-pointer text-center justify-center font-medium text-xs text-primary py-2 hover:bg-primary/5">
                Manage Notifications
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative focus:outline-none cursor-pointer">
            <div className="h-8 w-8 rounded-full overflow-hidden border border-outline-variant/40 hover:border-primary/50 transition-colors">
              <img 
                className="w-full h-full object-cover" 
                alt="User profile" 
                src={session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || "U")}&background=6d3bd7&color=fff&size=32`} 
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name || "Student"}</p>
                <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/settings" passHref legacyBehavior>
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings" passHref legacyBehavior>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
