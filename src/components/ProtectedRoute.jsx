import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] text-white/50 font-mono text-sm">
        loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}
