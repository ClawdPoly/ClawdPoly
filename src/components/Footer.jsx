import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Footer() {
  const [addr, setAddr] = useState("6BFohrAmiSwkn3xi6a4MsezQbeKmBAhG6ToJ3uR3Qcao");
  useEffect(() => {
    api.get("/funding").then((r) => setAddr(r.data.address)).catch(() => {});
  }, []);
  const short = addr.length > 16 ? `${addr.slice(0, 6)}\u2026${addr.slice(-4)}` : addr;
  return (
    <footer className="border-t border-white/[0.06] mt-20">
      <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono text-[12px] text-white/50">
        <div>© 2026 ClawdPoly · ai agents for polymarket</div>
        <div>
          deposit: <span className="text-[#3b82f6]" title={addr}>{short}</span>
        </div>
      </div>
    </footer>
  );
}
