import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { apiAuth } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function PhantomSignInButton({ className = "" }) {
  const { publicKey, signMessage, connected, disconnect, connect, select, wallets } = useWallet();
  const { setVisible } = useWalletModal();
  const { setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const doSignIn = async () => {
    setErr(""); setBusy(true);
    try {
      // Ensure a phantom wallet is connected
      if (!connected || !publicKey) {
        const phantom = wallets.find((w) => w.adapter.name === "Phantom");
        if (phantom) {
          try { select(phantom.adapter.name); } catch {}
        }
        try { await connect(); }
        catch {
          setVisible(true);
          setBusy(false);
          return;
        }
      }
      if (!publicKey || !signMessage) {
        setBusy(false);
        return;
      }
      const pkStr = publicKey.toBase58();
      const { nonce } = await apiAuth.phantomChallenge(pkStr);
      const signed = await signMessage(new TextEncoder().encode(nonce));
      const sigB58 = bs58.encode(signed);
      const res = await apiAuth.phantomVerify(pkStr, sigB58, nonce);
      setUser(res.user);
      window.location.href = "/dashboard";
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.detail || e?.message || "phantom sign-in failed");
      try { await disconnect(); } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={doSignIn}
        disabled={busy}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#AB9FF2]/40 bg-[#AB9FF2]/10 hover:bg-[#AB9FF2]/20 text-[#c4baf5] text-[13px] font-medium transition-colors disabled:opacity-60 ${className}`}
      >
        <svg viewBox="0 0 108 108" className="w-4 h-4" fill="currentColor">
          <path d="M46.5 26.5h15c22.1 0 40 17.9 40 40v1c0 1.4-1.1 2.5-2.5 2.5H92c-1.4 0-2.5-1.1-2.5-2.5 0-4.7-3.8-8.5-8.5-8.5H78c-1.4 0-2.5 1.1-2.5 2.5V69c0 4.7-3.8 8.5-8.5 8.5s-8.5-3.8-8.5-8.5v-8.5c0-4.7-3.8-8.5-8.5-8.5s-8.5 3.8-8.5 8.5V85c0 1.4-1.1 2.5-2.5 2.5h-7c-1.4 0-2.5-1.1-2.5-2.5V66.5c0-22.1 17.9-40 40-40z"/>
          <circle cx="40" cy="58" r="4"/>
          <circle cx="70" cy="58" r="4"/>
        </svg>
        {busy ? "signing\u2026" : connected ? "sign in with Phantom" : "connect Phantom"}
      </button>
      {err && <div className="font-mono text-[10px] text-[#ef4444] max-w-[260px] text-right">{err}</div>}
    </div>
  );
}
