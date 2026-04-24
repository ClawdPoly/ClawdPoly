import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import PhantomSignInButton from "./PhantomSignInButton";

const linkBase = "px-3 py-1.5 rounded-md text-[15px] transition-colors";

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-md">
      <div className="max-w-[1280px] mx-auto px-6 h-[60px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-display text-white text-[20px] tracking-tight leading-none">
            Clawd<span className="text-[#3b82f6]">Poly</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/60 uppercase tracking-wider">beta</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? "bg-white/[0.06] text-white" : "text-white/60 hover:text-white"}`}>Home</NavLink>
          <NavLink to="/markets" className={({ isActive }) => `${linkBase} ${isActive ? "bg-white/[0.06] text-white" : "text-white/60 hover:text-white"}`}>Markets</NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `${linkBase} ${isActive ? "bg-white/[0.06] text-white" : "text-white/60 hover:text-white"}`}>Leaderboard</NavLink>
          {user && (
            <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? "bg-white/[0.06] text-white" : "text-white/60 hover:text-white"}`}>Agents</NavLink>
          )}
        </nav>

        {user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-white/80 text-[13px]"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> dashboard
            </button>
            <div className="flex items-center gap-2 pl-2">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-8 h-8 rounded-full border border-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center text-[#60a5fa] font-mono text-[12px]">
                  {(user.name || user.email || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <button onClick={logout} className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/60 hover:text-white" title="sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] text-white text-[15px] font-medium transition-colors"
            >
              Sign in <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-[280px] rounded-md border border-white/10 bg-[#0b0f1a] shadow-xl p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/45 mb-2 px-1">choose method</div>
                <button
                  onClick={login}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/[0.05] text-left"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.6h5.06a4.35 4.35 0 0 1-1.89 2.86l3.04 2.36C20.3 17.16 21.5 14.8 21.5 12c0-.64-.06-1.26-.17-1.8H12z"/>
                    <path fill="#4285F4" d="M6.49 13.83l-.71.54-2.5 1.95h.01A9.5 9.5 0 0 0 12 21.5c2.43 0 4.47-.8 5.96-2.18l-3.05-2.36c-.83.55-1.9.9-2.91.9a4.5 4.5 0 0 1-4.23-3.04z"/>
                    <path fill="#FBBC05" d="M3.29 7.68A9.46 9.46 0 0 0 2.5 12c0 1.52.37 2.95 1 4.22l3.2-2.49A4.4 4.4 0 0 1 6.5 12c0-.64.11-1.24.29-1.82L3.29 7.68z"/>
                    <path fill="#34A853" d="M12 6.5c1.32 0 2.5.45 3.43 1.34l2.56-2.56A9.1 9.1 0 0 0 12 2.5 9.5 9.5 0 0 0 3.29 7.68l3.5 2.5A4.5 4.5 0 0 1 12 6.5z"/>
                  </svg>
                  <span className="text-[13px] text-white/85">Continue with Google</span>
                </button>
                <div className="px-1 my-2"><PhantomSignInButton className="w-full !border-[#AB9FF2]/40 justify-start" /></div>
                <div className="font-mono text-[10px] text-white/40 px-1 mt-2 leading-relaxed">
                  Phantom signs a challenge message (no on-chain fee) to prove wallet ownership.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
