import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiAuth } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const hash = window.location.hash || "";
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) {
      navigate("/");
      return;
    }
    const sid = decodeURIComponent(m[1]);
    (async () => {
      try {
        const data = await apiAuth.session(sid);
        setUser(data.user);
      } catch (e) {
        console.error("auth session failed", e);
      } finally {
        window.history.replaceState({}, "", "/dashboard");
        navigate("/dashboard", { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] text-white/70 font-mono text-sm">
      authenticating…
    </div>
  );
}
