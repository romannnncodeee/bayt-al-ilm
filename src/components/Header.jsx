import React from "react";

export default function Header({ onShowAll, onShowCategories, onFilterCategory }) {
  return (
    <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e8e0d0" }}
      className="sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <button onClick={onShowAll} className="text-left">
          <span className="font-amiri text-xl font-bold" style={{ color: "#1a1208" }}>
            Bayt al-Ilm
          </span>
          <span className="font-amiri text-base ml-2" style={{ color: "#c9973a" }}>بيت العلم</span>
        </button>

        <nav className="flex items-center gap-6 text-sm" style={{ color: "#555" }}>
          <button onClick={onShowAll} className="hover:text-amber-700 transition">Home</button>
          <button onClick={() => onFilterCategory("all")} className="hover:text-amber-700 transition">All Fatwas</button>
          <button onClick={onShowCategories}
            className="px-4 py-2 rounded-lg font-medium transition hover:opacity-90"
            style={{ backgroundColor: "#c9973a", color: "#fff" }}>
            Categories
          </button>
        </nav>
      </div>
    </header>
  );
}
