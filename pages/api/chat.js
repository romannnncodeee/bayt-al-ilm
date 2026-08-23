/**
 * /api/chat
 *
 * Server-side only. The GEMINI_API_KEY environment variable
 * is NEVER sent to the browser.
 *
 * Flow:
 *  1. Receive question from frontend
 *  2. Search chunks.json for relevant passages
 *  3. Build a strict prompt with only those passages
 *  4. Call Gemini API
 *  5. Return answer + citations
 */

import { searchChunks } from "../../utils/search";
import chunks from "../../data/chunks.json";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `You are an Islamic knowledge assistant for the Bayt al-Ilm website.

Your ONLY job is to answer questions using the source passages provided below.

STRICT RULES:
1. Answer ONLY from the provided source passages. Do not use any outside knowledge.
2. If the passages do not contain enough information to answer, respond with exactly: "I could not find an answer to this question in the provided sources."
3. Never fabricate Quran verses, hadith, scholar names, page numbers, or rulings.
4. Do not guess or infer beyond what the sources explicitly say.
5. If quoting, paraphrase faithfully — do not change meanings.
6. Always cite the book name and page number from the source passage at the end of your answer.
7. Keep answers clear and respectful.
8. You may translate Arabic source material into English but must remain faithful to the original meaning.
9. Do not present any ruling as a fatwa from a scholar unless the source explicitly attributes it.
10. This is an informational tool — remind the user to consult a qualified scholar for personal matters if the question is sensitive.

Format your response as:
[Answer based on sources]

Source: [Book name], Page [number]`;

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API not configured. Please contact the site administrator." });
  }

  // 1. Search for relevant chunks
  const relevantChunks = searchChunks(chunks, question, 5);

  // 2. If no relevant chunks found, return early
  if (relevantChunks.length === 0) {
    return res.status(200).json({
      answer: "I could not find an answer to this question in the provided sources.",
      sources: [],
      foundInSources: false,
    });
  }

  // 3. Build context from chunks
  const context = relevantChunks
    .map((c, i) => `[Source ${i + 1}] Book: "${c.book}", Page ${c.page}\n${c.text}`)
    .join("\n\n---\n\n");

  const prompt = `${SYSTEM_PROMPT}

---
PROVIDED SOURCE PASSAGES:
${context}
---

User question: ${question.trim()}

Answer (based ONLY on the sources above):`;

  // 4. Call Gemini API
  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,   // low — we want factual, not creative
          maxOutputTokens: 1024,
          topP: 0.8,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", errText);
      return res.status(502).json({ error: "AI service temporarily unavailable. Please try again." });
    }

    const data = await geminiRes.json();
    const rawAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawAnswer) {
      return res.status(200).json({
        answer: "I could not find an answer to this question in the provided sources.",
        sources: [],
        foundInSources: false,
      });
    }

    // 5. Build citation list
    const sources = relevantChunks.map((c) => ({
      book: c.book,
      page: c.page,
      excerpt: c.text.slice(0, 120) + (c.text.length > 120 ? "…" : ""),
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
