import React from "react";

export default function Footer() {
  return (
    <footer className="mt-20 py-12" style={{ borderTop: "1px solid #2a2010", backgroundColor: "#141008" }}>
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="font-amiri text-2xl font-bold mb-1" style={{ color: "#e8dcc8" }}>Bayt al-Ilm</p>
        <p className="font-amiri text-lg mb-6" style={{ color: "#c9973a" }}>بيت العلم</p>
        <div className="h-px max-w-xs mx-auto mb-6" style={{ backgroundColor: "#2a2010" }}></div>
        <p className="text-sm leading-relaxed max-w-lg mx-auto mb-6" style={{ color: "#7a6a4a" }}>
          Developed by Akhi Abu Maryam — may Allah forgive him, guide him, and have mercy on him
          and on his parents — to help you easily access and find fatawa of the scholars from
          reliable sources.
        </p>
        <a href="https://www.instagram.com/deen.salihx/" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-70"
          style={{ color: "#c9973a" }}>
          Abu Maryam's Instagram
        </a>
        <p className="mt-8 font-amiri text-sm" style={{ color: "#2a2010" }}>
          طلب العلم فريضة على كل مسلم
        </p>
      </div>
    </footer>
  );
}
