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
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-modal w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#fff" }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #e8e0d0" }}>
          <h3 className="font-amiri text-xl font-bold" style={{ color: "#1a1208" }}>Categories</h3>
          <button onClick={onClose} className="text-2xl leading-none hover:opacity-50 transition" style={{ color: "#999" }}>×</button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
          {categories.slice(1).map((cat) => (
            <button key={cat}
              onClick={() => { onFilter(cat); onClose(); }}
              className="px-4 py-3 rounded-xl text-sm text-left font-medium transition hover:opacity-80 border"
              style={{ backgroundColor: "#fdf9f2", color: "#555", borderColor: "#e8d9b0" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
