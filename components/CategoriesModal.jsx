import React, { useEffect } from "react";
import { categories } from "../data/fatwas";

export default function CategoriesModal({ onClose, onFilter }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-modal w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#1a1208", border: "1px solid #2a2010" }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #2a2010" }}>
          <h3 className="font-amiri text-xl font-bold" style={{ color: "#e8dcc8" }}>Categories</h3>
          <button onClick={onClose} className="text-2xl leading-none hover:opacity-50 transition" style={{ color: "#5a4a2e" }}>×</button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
          {categories.slice(1).map((cat) => (
            <button key={cat}
              onClick={() => { onFilter(cat); onClose(); }}
              className="px-4 py-3 rounded-xl text-sm text-left font-medium transition hover:opacity-80 border"
              style={{ backgroundColor: "#221a0d", color: "#9a8a6a", borderColor: "#2a2010" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
