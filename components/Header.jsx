import Link from "next/link";

export default function Header({ onShowAll, onShowCategories, onFilterCategory }) {
  return (
    <header style={{ backgroundColor: "#141008", borderBottom: "1px solid #2a2010" }}
      className="sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <button onClick={onShowAll} className="text-left">
          <span className="font-amiri text-xl font-bold" style={{ color: "#e8dcc8" }}>
            Bayt al-Ilm
          </span>
          <span className="font-amiri text-base ml-2" style={{ color: "#c9973a" }}>بيت العلم</span>
        </button>

        <nav className="flex items-center gap-3 md:gap-6 text-sm">
          <button onClick={onShowAll} className="transition hover:opacity-70 hidden sm:block" style={{ color: "#9a8a6a" }}>
            Home
          </button>
          <button onClick={() => onFilterCategory("all")} className="transition hover:opacity-70 hidden sm:block" style={{ color: "#9a8a6a" }}>
            All Fatwas
          </button>
          <button onClick={onShowCategories}
            className="transition hover:opacity-70 border px-3 py-1.5 rounded-lg text-xs md:text-sm"
            style={{ color: "#9a8a6a", borderColor: "#2a2010" }}>
            Categories
          </button>
          <Link href="/chat"
            className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium transition hover:opacity-90 text-xs md:text-sm"
            style={{ backgroundColor: "#c9973a", color: "#1a1208" }}>
            <span>✦</span>
            Ask AI
          </Link>
        </nav>
      </div>
    </header>
  );
}
