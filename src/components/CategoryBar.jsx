import React from "react";
import { categories } from "../data/fatwas";

export default function CategoryBar({ onFilter, active }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-8 hide-scrollbar">
      {categories.map((cat) => {
        const isActive = active === cat || (active === "all" && cat === "All");
        return (
          <button
            key={cat}
            onClick={() => onFilter(cat)}
            className="px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all flex-shrink-0 border"
            style={isActive ? {
              backgroundColor: "#c9973a",
              color: "#fff",
              borderColor: "#c9973a",
            } : {
              backgroundColor: "#fff",
              color: "#555",
              borderColor: "#e0d8cc",
            }}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
