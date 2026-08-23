import React, { useEffect, useRef } from "react";

export default function FatwaModal({ fatwa, onClose }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);

  if (!fatwa) return null;

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const renderText = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-70 break-all"
          style={{ color: "#c9973a" }}>
          {part.includes("youtu") ? "Watch on YouTube" : part}
        </a>
      ) : <span key={i}>{part}</span>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-3 md:p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdrop}>
      <div className="animate-modal w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#1a1208", border: "1px solid #2a2010" }}>

        <div className="flex-shrink-0 flex items-center justify-between px-6 md:px-8 py-4"
          style={{ borderBottom: "1px solid #2a2010", backgroundColor: "#141008" }}>
          <span className="text-xs font-semibold px-3 py-1 rounded-lg"
            style={{ backgroundColor: "rgba(201,151,58,0.1)", color: "#c9973a", border: "1px solid #3d2f14" }}>
            {fatwa.category}
          </span>
          <button onClick={onClose} className="text-2xl leading-none hover:opacity-50 transition"
            style={{ color: "#5a4a2e" }}>×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 md:py-8">
          <h2 className="font-amiri text-2xl md:text-3xl font-bold mb-6" style={{ color: "#e8dcc8" }}>
            {fatwa.title}
          </h2>

          {fatwa.isTafsir && fatwa.ayat && (
            <div className="mb-6 p-4 md:p-5 rounded-xl"
              style={{ backgroundColor: "rgba(80,58,139,0.08)", border: "1px solid #3d2d6b" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9a7ac9" }}>The Ayat</p>
              <p className="text-sm md:text-base leading-relaxed ruling-text" style={{ color: "#c8b89a" }}>
                {fatwa.ayat}
              </p>
            </div>
          )}

          {!fatwa.isTafsir && (
            <div className="mb-6 p-4 md:p-5 rounded-xl"
              style={{ backgroundColor: "rgba(201,151,58,0.05)", border: "1px solid #3d2f14" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#c9973a" }}>The Question</p>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: "#c8b89a" }}>
                {fatwa.question}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1" style={{ backgroundColor: "#2a2010" }}></div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a4a2e" }}>
              {fatwa.isTafsir ? "The Tafsir" : "The Ruling"}
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: "#2a2010" }}></div>
          </div>

          <div className="text-sm md:text-base ruling-text" style={{ color: "#c8b89a" }}>
            {renderText(fatwa.ruling)}
          </div>

          {fatwa.audio && (
            <div className="mt-6 p-4 rounded-xl"
              style={{ backgroundColor: "rgba(201,151,58,0.05)", border: "1px solid #3d2f14" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#c9973a" }}>Audio Clip</p>
              <audio ref={audioRef} controls className="w-full">
                <source src={fatwa.audio} type="audio/ogg" />
              </audio>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-between px-6 md:px-8 py-4"
          style={{ borderTop: "1px solid #2a2010", backgroundColor: "#141008" }}>
          <span className="text-xs" style={{ color: "#3d2f14" }}>{fatwa.date || ""}</span>
          <button onClick={onClose}
            className="text-sm font-semibold px-6 py-2.5 rounded-xl transition hover:opacity-90"
            style={{ backgroundColor: "#c9973a", color: "#fff" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
