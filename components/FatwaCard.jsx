import React from "react";

const categoryColors = {
  General: "#2d5a3d", Aqidah: "#6b2d2d", Salah: "#2d3d6b",
  Hijab: "#5a4a2d", Marriage: "#6b2d55", Fasting: "#2d4a6b",
  Zakat: "#2d6b3d", Hajj: "#5a3d1a", Udhiyah: "#6b3d2d", Tafsir: "#3d2d6b",
};

export default function FatwaCard({ fatwa, onClick }) {
  const color = categoryColors[fatwa.category] || "#2d5a3d";

  return (
    <div className="fatwa-card rounded-2xl overflow-hidden cursor-pointer animate-fade-up border"
      style={{ borderColor: "#2a2010", backgroundColor: "#1a1208", borderTop: `3px solid ${color}` }}
      onClick={() => onClick(fatwa)}>
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md"
            style={{ backgroundColor: `${color}33`, color: "#c9973a" }}>
            {fatwa.category}
          </span>
          {fatwa.audio && (
            <span className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: "rgba(201,151,58,0.1)", color: "#c9973a", border: "1px solid #3d2f14" }}>
              Audio
            </span>
          )}
          {fatwa.isTafsir && (
            <span className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: "rgba(80,58,139,0.15)", color: "#9a7ac9", border: "1px solid #3d2d6b" }}>
              Tafsir
            </span>
          )}
        </div>
        <h3 className="font-amiri text-xl font-bold leading-snug mb-2 line-clamp-2" style={{ color: "#e8dcc8" }}>
          {fatwa.title}
        </h3>
        <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#7a6a4a" }}>
          {fatwa.isTafsir ? fatwa.ayat : fatwa.question}
        </p>
      </div>
      <div className="px-5 md:px-6 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid #2a2010" }}>
        <span className="text-xs" style={{ color: "#3d2f14" }}>{fatwa.date || ""}</span>
        <span className="text-xs font-semibold" style={{ color: "#c9973a" }}>Read ruling →</span>
      </div>
    </div>
  );
}
