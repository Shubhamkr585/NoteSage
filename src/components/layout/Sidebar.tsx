"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Library, 
  Sparkles, 
  Settings, 
  Plus, 
  HelpCircle, 
  Shield,
  Layers,
  Brain,
  CalendarDays
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Library", href: "/documents", icon: Library },
    { name: "Doc Chat", href: "/chat", icon: Sparkles },
    { name: "Flashcards", href: "/flashcards", icon: Layers },
    { name: "Quizzes", href: "/quizzes", icon: Brain },
    { name: "Study Plan", href: "/study-plan", icon: CalendarDays },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container/80 backdrop-blur-xl border-r border-outline-variant/50 z-50 flex flex-col py-8 px-6 hidden md:flex">
      <div className="mb-10">
        <h1 className="text-headline-md font-headline-md font-bold text-primary tracking-tight">NoteSage</h1>
        <p className="text-on-surface-variant text-label-md font-label-md mt-1 opacity-70">AI Workspace</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive
                  ? "text-primary font-bold border-r-2 border-primary bg-primary/10"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <button className="mt-auto w-full bg-primary-container text-on-primary-container font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
        <Plus className="w-5 h-5" />
        New Project
      </button>

      <div className="mt-8 pt-8 border-t border-outline-variant/30 flex gap-4">
        <Link href="/help" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          <span className="text-label-sm font-label-sm">Help</span>
        </Link>
        <Link href="/privacy" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="text-label-sm font-label-sm">Privacy</span>
        </Link>
      </div>
    </aside>
  );
}
