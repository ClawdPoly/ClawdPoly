import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Markets from "./pages/Markets";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import NewAgent from "./pages/NewAgent";
import AgentTerminal from "./pages/AgentTerminal";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import SolanaProvider from "./context/SolanaProvider";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/new" element={<ProtectedRoute><NewAgent /></ProtectedRoute>} />
        <Route path="/dashboard/agent/:id" element={<ProtectedRoute><AgentTerminal /></ProtectedRoute>} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-[#0a0e1a] text-white">
      <BrowserRouter>
        <SolanaProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </SolanaProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
