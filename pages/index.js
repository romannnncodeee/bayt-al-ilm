import { useState, useRef } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Hero from "../components/Hero";
import CategoryBar from "../components/CategoryBar";
import FatwaCard from "../components/FatwaCard";
import FatwaModal from "../components/FatwaModal";
import CategoriesModal from "../components/CategoriesModal";
import Footer from "../components/Footer";
import { fatwas as allFatwas } from "../data/fatwas";

export default function Home() {
  const [displayed, setDisplayed] = useState(allFatwas);
  const [selected, setSelected] = useState(null);
  const [showCats, setShowCats] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const gridRef = useRef(null);

  const handleSearch = () => {
    const q = searchValue.toLowerCase().trim();
    if (!q) { setDisplayed(allFatwas); setActiveCategory("All"); return; }
    setDisplayed(allFatwas.filter(f =>
      f.title.toLowerCase().includes(q) ||
      (f.question || "").toLowerCase().includes(q) ||
      (f.ruling || "").toLowerCase().includes(q) ||
      (f.ayat || "").toLowerCase().includes(q)
    ));
    setActiveCategory("All");
    gridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleShowAll = () => {
    setSearchValue(""); setDisplayed(allFatwas); setActiveCategory("All");
  };

  const handleFilter = (cat) => {
    setSearchValue("");
    setActiveCategory(cat);
    if (cat === "All" || cat === "all") { setDisplayed(allFatwas); return; }
    setDisplayed(allFatwas.filter(f => f.category === cat));
    gridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Head>
        <title>Bayt al-Ilm — بيت العلم</title>
        <meta name="description" content="Scholarly fatwas and tafsir upon the Manhaj of the Salaf al-Salih" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ backgroundColor: "#0f0d09", minHeight: "100vh" }}>
        <Header
          onShowAll={handleShowAll}
          onFilterCategory={handleFilter}
          onShowCategories={() => setShowCats(true)}
        />

        <Hero
          onSearch={handleSearch}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />

        <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
          <CategoryBar onFilter={handleFilter} active={activeCategory} />

          {displayed.length > 0 && (
            <p className="text-xs mb-6" style={{ color: "#5a4a2e" }}>
              {displayed.length} {displayed.length === 1 ? "entry" : "entries"}
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </p>
          )}

          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayed.map((fatwa) => (
              <FatwaCard key={fatwa.id} fatwa={fatwa} onClick={setSelected} />
            ))}
          </div>

          {displayed.length === 0 && (
            <div className="text-center py-24">
              <h3 className="font-amiri text-2xl mb-2" style={{ color: "#5a4a2e" }}>No entries found</h3>
              <p className="text-sm mb-6" style={{ color: "#3d2f14" }}>Try different keywords</p>
              <button onClick={handleShowAll}
                className="text-sm font-semibold px-6 py-3 rounded-xl transition hover:opacity-90"
                style={{ backgroundColor: "#c9973a", color: "#fff" }}>
                Show All
              </button>
            </div>
          )}
        </main>

        <Footer />

        {selected && <FatwaModal fatwa={selected} onClose={() => setSelected(null)} />}
        {showCats && <CategoriesModal onClose={() => setShowCats(false)} onFilter={handleFilter} />}
      </div>
    </>
  );
}
