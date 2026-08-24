import { searchChunks } from "../../utils/search";
import chunks from "../../data/chunks.json";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are an Islamic knowledge assistant for the Bayt al-Ilm website.
Answer ONLY from the provided source passages. If not found, say: "I could not find an answer to this question in the provided sources."
Never fabricate hadith, verses, or rulings. Cite book name and page number.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question } = req.body;
  if (!question || question.trim().length === 0) return res.status(400).json({ error: "Question is required" });
  if (question.length > 1000) return res.status(400).json({ error: "Question too long" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API not configured." });

  const relevantChunks = searchChunks(chunks, question, 5);

  if (relevantChunks.length === 0) {
    return res.status(200).json({
      answer: "I could not find an answer to this question in the provided sources.",
      sources: [],
      foundInSources: false,
    });
  }

  const context = relevantChunks
    .map((c, i) => `[Source ${i + 1}] Book: "${c.book}", Page ${c.page}\n${c.text}`)
    .join("\n\n---\n\n");

  const prompt = `${SYSTEM_PROMPT}\n\nSOURCE PASSAGES:\n${context}\n\nQuestion: ${question.trim()}\n\nAnswer (from sources only):`;

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
      model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1024,
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
        answer: "I could not find an answer to this question in the provided sources.",
        sources: [],
        foundInSources: false,
      });
    }

    const sources = relevantChunks.map((c) => ({
      book: c.book,
      page: c.page,
      excerpt: c.text.slice(0, 120) + (c.text.length > 120 ? "…" : ""),
    }));

    return res.status(200).json({ answer: rawAnswer.trim(), sources, foundInSources: true });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}