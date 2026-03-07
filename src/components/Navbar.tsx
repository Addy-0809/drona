"use client";
// src/components/Navbar.tsx — Horizontal top nav with ethnic Indian aesthetic
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, BookOpen, Youtube, ClipboardList,
  BarChart2, FileUp, LogOut, Menu, X, ChevronDown,
} from "lucide-react";
import Image from "next/image";

const navLinks = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { href: "/subjects",   icon: BookOpen,        label: "Subjects"  },
  { href: "/plan",       icon: ClipboardList,   label: "Study Plan" },
  { href: "/resources",  icon: Youtube,         label: "Resources"  },
  { href: "/test",       icon: ClipboardList,   label: "Mock Tests" },
  { href: "/feedback",   icon: BarChart2,       label: "Feedback"   },
  { href: "/paper",      icon: FileUp,          label: "Paper Upload" },
];

export default function Navbar() {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <nav style={{
        background: "linear-gradient(135deg, rgba(245,235,210,0.96) 0%, rgba(255,248,220,0.96) 100%)",
        borderBottom: "1px solid rgba(184,134,11,0.25)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 2px 20px rgba(184,134,11,0.12)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", height: "64px" }}>

          {/* LOGO */}
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginRight: "2rem", flexShrink: 0 }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "linear-gradient(135deg, #DAA520, #B8860B)",
              boxShadow: "0 3px 12px rgba(184,134,11,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>🪷</div>
            <span style={{
              fontFamily: "'Cinzel', serif", fontWeight: 700,
              fontSize: "1.1rem", letterSpacing: "0.12em",
              background: "linear-gradient(135deg, #8B6914, #DAA520, #B8860B)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>DRONA</span>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1, overflowX: "auto" }} className="hide-scrollbar desktop-nav">
            {navLinks.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 14px", borderRadius: "8px",
                  textDecoration: "none", whiteSpace: "nowrap",
                  fontSize: "0.82rem", fontWeight: isActive ? 700 : 500,
                  fontFamily: "'Inter', sans-serif",
                  color: isActive ? "#8B6914" : "#7c6a3a",
                  background: isActive ? "rgba(184,134,11,0.12)" : "transparent",
                  borderBottom: isActive ? "2px solid #DAA520" : "2px solid transparent",
                  transition: "all 0.2s ease",
                }}>
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* USER AVATAR + PROFILE DROPDOWN */}
          {session?.user && (
            <div style={{ position: "relative", marginLeft: "auto", flexShrink: 0 }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "rgba(184,134,11,0.1)",
                  border: "1px solid rgba(184,134,11,0.25)",
                  borderRadius: "10px", padding: "5px 10px 5px 5px",
                  cursor: "pointer",
                }}>
                {session.user.image ? (
                  <Image src={session.user.image} alt={session.user.name ?? "User"}
                    width={28} height={28} style={{ borderRadius: "50%", border: "2px solid #DAA520" }} />
                ) : (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#DAA520,#B8860B)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
                    {session.user.name?.[0] ?? "U"}
                  </div>
                )}
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#7c6a3a", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session.user.name?.split(" ")[0]}
                </span>
                <ChevronDown size={13} color="#B8860B" />
              </button>

              {profileOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "rgba(253,248,230,0.97)", border: "1px solid rgba(184,134,11,0.2)",
                  borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  padding: "8px", minWidth: "200px", zIndex: 100,
                }}>
                  <div style={{ padding: "8px 10px 12px", borderBottom: "1px solid rgba(184,134,11,0.15)" }}>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#5a4a22", marginBottom: "2px" }}>{session.user.name}</p>
                    <p style={{ fontSize: "0.72rem", color: "#9a8a5a" }}>{session.user.email}</p>
                  </div>
                  <button
                    id="signout-btn"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      width: "100%", padding: "8px 10px", marginTop: "4px",
                      background: "transparent", border: "none", borderRadius: "8px",
                      cursor: "pointer", color: "#c0392b", fontSize: "0.82rem", fontWeight: 500,
                    }}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MOBILE HAMBURGER */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-menu-btn"
            style={{
              marginLeft: "8px", background: "transparent", border: "none",
              cursor: "pointer", padding: "6px", borderRadius: "8px",
              color: "#8B6914",
            }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div style={{
            borderTop: "1px solid rgba(184,134,11,0.2)",
            background: "rgba(253,248,230,0.98)",
            padding: "12px",
          }}>
            {navLinks.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px", borderRadius: "10px",
                  textDecoration: "none", marginBottom: "4px",
                  color: isActive ? "#8B6914" : "#7c6a3a",
                  background: isActive ? "rgba(184,134,11,0.12)" : "transparent",
                  fontWeight: isActive ? 700 : 500, fontSize: "0.9rem",
                }}>
                  <Icon size={16} /> {label}
                </Link>
              );
            })}
            {session?.user && (
              <button onClick={() => signOut({ callbackUrl: "/" })} style={{
                display: "flex", alignItems: "center", gap: "10px",
                width: "100%", padding: "10px 14px", marginTop: "8px",
                background: "rgba(192,57,43,0.07)", border: "none", borderRadius: "10px",
                cursor: "pointer", color: "#c0392b", fontSize: "0.9rem", fontWeight: 500,
              }}>
                <LogOut size={16} /> Sign Out
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
