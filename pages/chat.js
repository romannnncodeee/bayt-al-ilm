import Head from "next/head";
import Link from "next/link";
import Chatbot from "../components/Chatbot";

export default function ChatPage() {
  return (
    <>
      <Head>
        <title>Ask — Bayt al-Ilm</title>
        <meta name="description" content="Ask Islamic fiqh questions from scholarly sources" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ backgroundColor: "#0f0d09", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Minimal header */}
        <header style={{ backgroundColor: "#141008", borderBottom: "1px solid #2a2010" }}
          className="sticky top-0 z-50 flex-shrink-0">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition">
              <span style={{ color: "#9a8a6a", fontSize: "18px" }}>←</span>
              <span className="font-amiri text-xl font-bold" style={{ color: "#e8dcc8" }}>Bayt al-Ilm</span>
              <span className="font-amiri text-base" style={{ color: "#c9973a" }}>بيت العلم</span>
            </Link>
            <span className="text-sm font-medium" style={{ color: "#c9973a" }}>
              Ask the Sources
            </span>
          </div>
        </header>

        {/* Two-column layout on desktop, stacked on mobile */}
        <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full px-4 md:px-8 py-6 gap-6"
          style={{ minHeight: 0 }}>

          {/* Left — info panel */}
          <div className="md:w-72 flex-shrink-0">
            <div className="rounded-2xl p-5 mb-4"
              style={{ backgroundColor: "#1a1208", border: "1px solid #2a2010" }}>
              <p className="font-amiri text-lg font-bold mb-2" style={{ color: "#e8b84b" }}>
                How it works
              </p>
              <ul className="text-sm space-y-2" style={{ color: "#9a8a6a" }}>
                <li>① You ask a question in English or Arabic</li>
                <li>② The system searches the uploaded Islamic source books</li>
                <li>③ An answer is generated from those passages only</li>
                <li>④ The source book and page number are shown</li>
              </ul>
            </div>

            <div className="rounded-2xl p-5"
              style={{ backgroundColor: "#1a1208", border: "1px solid #2a2010" }}>
              <p className="font-amiri text-base font-bold mb-2" style={{ color: "#c9973a" }}>
                Example questions
              </p>
              <ul className="text-sm space-y-2" style={{ color: "#7a6a4a" }}>
                {[
                  "What invalidates the fast?",
                  "Can I break my fast due to illness?",
                  "What are the conditions of prayer?",
                  "Is music permissible in Islam?",
                  "What is the ruling on zakat al-fitr?",
                ].map((q) => (
                  <li key={q} className="font-amiri italic">"{q}"</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-2xl p-4"
              style={{ backgroundColor: "rgba(201,151,58,0.05)", border: "1px solid #2a2010" }}>
              <p className="text-xs leading-relaxed" style={{ color: "#5a4a2e" }}>
                ⚠️ This assistant answers only from the uploaded source books. It is an informational reference tool — not a fatwa service. Always consult a qualified scholar for personal religious matters.
              </p>
            </div>
          </div>

          {/* Right — chat */}
          <div className="flex-1 rounded-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "#0f0d09", border: "1px solid #2a2010", minHeight: "500px" }}>
            <Chatbot />
          </div>
        </div>
      </div>
    </>
  );
}
