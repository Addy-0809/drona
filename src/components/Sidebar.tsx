"use client";
// src/components/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Youtube,
  ClipboardList,
  BarChart2,
  FileUp,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

const navLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/subjects", icon: BookOpen, label: "Subjects" },
  { href: "/plan", icon: ClipboardList, label: "Study Plan" },
  { href: "/resources", icon: Youtube, label: "Resources" },
  { href: "/test", icon: ClipboardList, label: "Mock Tests" },
  { href: "/feedback", icon: BarChart2, label: "Feedback" },
  { href: "/paper", icon: FileUp, label: "Paper Upload" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass border-r border-white/5 flex flex-col z-40">
      {/* LOGO */}
      <div className="p-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-lg"
            style={{ background: "linear-gradient(135deg, #DAA520, #B8860B)", boxShadow: "0 4px 12px rgba(184,134,11,0.4)" }}>
            🪷
          </div>
          <div>
            <p className="font-bold text-white leading-tight" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", fontSize: "1.1rem" }}>DRONA</p>
            <p className="text-xs text-slate-500">AI Learning Platform</p>
          </div>
        </Link>
      </div>

      {/* NAV */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider px-3 mb-3">Menu</p>
        {navLinks.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase().replace(/ /g, "-")}`}
              className={cn("sidebar-link", isActive && "active")}
            >
              <Icon size={17} />
              <span>{label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* USER PROFILE */}
      <div className="p-4 border-t border-white/5">
        {session?.user && (
          <div className="flex items-center gap-3 mb-3 px-1">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                width={34}
                height={34}
                className="rounded-full ring-2 ring-indigo-500/30"
              />
            ) : (
              <div className="w-[34px] h-[34px] rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                {session.user.name?.[0] ?? "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
              <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
            </div>
          </div>
        )}
        <button
          id="signout-btn"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
