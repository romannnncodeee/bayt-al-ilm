import { searchChunks } from "../../utils/search";
import chunks from "../../data/chunks.json";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a strict Islamic knowledge retrieval assistant for Bayt al-Ilm, a Salafi Athari website.

YOUR AQIDAH FRAMEWORK (non-negotiable):
- You follow the Salafi Athari manhaj: the way of the Salaf al-Salih (the Companions, Tabi'een, and the four Imams).
- Allah's Names and Attributes (Asma wa Sifat) are affirmed AS THEY ARE — without Tahreef (distortion), Ta'teel (denial), Takyeef (asking how), or Tamtheel (likening to creation).
- The Hand of Allah is a REAL Hand that befits His Majesty — it is NOT metaphorical. NEVER say any of Allah's attributes are metaphorical.
- The Istiwa of Allah above His Throne is REAL — it is NOT metaphorical.
- When asked "where is Allah" — Allah is above His Throne, above the seven heavens. This is proven by Quran, Sunnah, and consensus of the Salaf. State this clearly.
- The face, hands, eyes, and all attributes mentioned in the Quran and Sunnah are AFFIRMED as real attributes without asking how (bila kayf).
- This is the position of Imam Ahmad, Ibn Taymiyyah, Ibn al-Qayyim, Ibn Baz, Ibn Uthaymeen, and all Salafi scholars.
- NEVER give an Ash'ari, Maturidi, Mu'tazili, or Sufi interpretation of any attribute of Allah.

YOUR STRICT RETRIEVAL RULES:
1. Answer ONLY from the provided source passages. Do not use outside knowledge to fill gaps.
2. QUOTE or closely paraphrase the source — do not summarize with your own conclusions.
3. If the exact answer is not in the passages, say: "I could not find a clear answer to this in the provided sources. Please refer to a qualified Salafi scholar."
4. NEVER fabricate Quran verses, hadith, page numbers, or scholar statements.
5. NEVER give a ruling that contradicts the Salafi Athari aqidah even if the source passages seem unclear.
6. Always cite the book name and page number.
7. If the question is about Allah's attributes, Names, or Sifat — always affirm them as real without interpretation, even if the passage is only partially relevant.
8. Keep the answer concise and direct.
9. End sensitive personal questions with: "Please consult a qualified scholar for your specific situation."`;

// Step 1: Use a fast small model to expand the query into Islamic search terms
async function expandQuery(question, apiKey) {
  const expansionPrompt = `You are an Islamic research assistant. Given a user's question, generate a list of 12-15 specific search terms to find relevant passages in Islamic books.

Include:
- Arabic transliterations (e.g. "uluw", "istiwa", "arsh")
- English equivalents (e.g. "above", "throne", "highness")  
- Arabic script if relevant (e.g. "العلو", "الاستواء")
- Specific scholar names if relevant
- Related Islamic concepts

Return ONLY a JSON array of strings. No explanation. No markdown. Just the array.

Example output: ["uluw","istiwa","above throne","arsh","Allah above","العلو","فوق العرش","highness","transcendence"]

Question: "${question}"`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: expansionPrompt }],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";

    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;

    const terms = JSON.parse(match[0]);
    if (!Array.isArray(terms)) return null;

    return terms.filter((t) => typeof t === "string" && t.length > 0);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body;

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "Question is required" });
  }

  if (question.length > 1000) {
    return res.status(400).json({ error: "Question too long" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API not configured. Please contact the site administrator." });
  }

  // Step 1: Expand query with Islamic terms using fast model
  const expandedTerms = await expandQuery(question, apiKey);
  const searchQuery = expandedTerms
    ? question + " " + expandedTerms.join(" ")
    : question;

  // Step 2: Search chunks with expanded query
  const relevantChunks = searchChunks(chunks, searchQuery, 8);

  // Step 3: If no relevant chunks found
  if (relevantChunks.length === 0) {
    return res.status(200).json({
      answer: "I could not find a clear answer to this in the provided sources. Please refer to a qualified Salafi scholar.",
      sources: [],
      foundInSources: false,
    });
  }

  // Step 4: Build context from chunks
  const context = relevantChunks
    .map((c, i) => `[Source ${i + 1}] Book: "${c.book}", Page ${c.page}\n${c.text}`)
    .join("\n\n---\n\n");

  const userPrompt = `SOURCE PASSAGES FROM SALAFI BOOKS:
${context}

---
Question: ${question.trim()}

Instructions:
- Answer ONLY from the passages above.
- If about Allah's attributes: affirm them as REAL without metaphorical interpretation (Salafi Athari position).
- Quote the source directly where possible.
- Cite book name and page number at the end.
- If not clearly found in sources, say so honestly.

Answer:`;

  // Step 5: Generate answer with main model
  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.05,
        max_tokens: 1200,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", errText);
      return res.status(502).json({ error: "AI service temporarily unavailable. Please try again." });
    }

    const data = await groqRes.json();
    const rawAnswer = data?.choices?.[0]?.message?.content || "";

    if (!rawAnswer) {
      return res.status(200).json({
        answer: "I could not find a clear answer to this in the provided sources. Please refer to a qualified Salafi scholar.",
        sources: [],
        foundInSources: false,
      });
    }

    const sources = relevantChunks.map((c) => ({
      book: c.book,
      page: c.page,
      excerpt: c.text.slice(0, 150) + (c.text.length > 150 ? "…" : ""),
    }));

    return res.status(200).json({
      answer: rawAnswer.trim(),
      sources,
      foundInSources: true,
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
