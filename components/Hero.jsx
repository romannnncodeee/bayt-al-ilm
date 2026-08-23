import React from "react";

export default function Hero({ onSearch, searchValue, setSearchValue }) {
  const handleKeyUp = (e) => { if (e.key === "Enter") onSearch(); };

  return (
    <div style={{ background: "linear-gradient(160deg, #2d5a3d 0%, #1e3d2a 60%, #3d4a1e 100%)" }}
      className="py-16 md:py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <p className="font-amiri text-lg mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
          بيت العلم
        </p>
        <h1 className="font-amiri text-4xl md:text-6xl font-bold mb-4" style={{ color: "#fff" }}>
          House of Knowledge
        </h1>
        <p className="text-base md:text-lg mb-10" style={{ color: "rgba(255,255,255,0.65)" }}>
          Scholarly fatwas and tafsir upon the Manhaj of the Salaf al-Salih
        </p>

        {/* Search bar */}
        <div className="relative max-w-xl mx-auto shadow-xl rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#fff" }}>
          <input
            type="text"
            placeholder="Search fatwas… music, prayer, hijab…"
            className="search-input px-5 py-4 text-base pr-28"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyUp={handleKeyUp}
          />
          <button onClick={onSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: "#c9973a", color: "#fff" }}>
            Search
          </button>
        </div>
      </div>

      {/* Hadith block */}
      <div className="max-w-2xl mx-auto mt-12 px-4">
        <div className="rounded-2xl p-6 md:p-8 text-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <p className="font-amiri text-lg md:text-xl leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.9)" }}>
            "To whomever Allah wills goodness, He grants him understanding of the religion. Verily, I am only a distributor, but Allah is the Giver. Those within this nation will continue to establish the commandments of Allah. They will not be harmed by anyone who opposes them until the decree of Allah has come."
          </p>
          <p className="text-sm" style={{ color: "#e8b84b" }}>
            Muʿāwiyah رضي الله عنه — Ṣaḥīḥ al-Bukhārī 71, Ṣaḥīḥ Muslim 1037
          </p>
        </div>
      </div>
    </div>
  );
}
