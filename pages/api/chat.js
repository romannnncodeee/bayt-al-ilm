import { searchChunks, analyzeQuery } from "../../utils/search";
import chunks from "../../data/chunks.json";

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const FALLBACK_ANSWER =
  "I could not find a clear answer to this in the provided sources. Please refer to a qualified Salafi scholar.";

const SYSTEM_PROMPT = `
You are the Islamic research assistant for Bayt al-Ilm.

Your job is to answer questions using the Islamic books and source passages supplied to you.

SOURCE DISCIPLINE:

1. Base your answer on the supplied source passages.
2. Do not invent quotations, page numbers, scholar statements, Quran verses, or hadith.
3. Do not cite a source unless the supplied passage actually supports the claim.
4. If the retrieved passages do not clearly establish an answer, say:
   "I could not find a clear answer to this in the provided sources. Please refer to a qualified Salafi scholar."
5. Distinguish clearly between what a source explicitly states and what can reasonably be inferred from it.
6. Prefer the strongest and most directly relevant source passage.
7. Do not treat a passage as evidence merely because it contains similar words.
8. Always cite the book title and page number when making a sourced claim.
9. Keep answers concise unless the user asks for detail.

AQIDAH FRAMEWORK:

Bayt al-Ilm follows the Salafi Athari approach.

Allah's Names and Attributes are affirmed as they came in the Quran and authentic Sunnah, without Tahreef, Ta'teel, Takyeef, or Tamtheel.

Do not reinterpret Allah's Attributes metaphorically.

When discussing a scholarly ruling, however, distinguish between the source's actual statement and the general aqidah framework.

IMPORTANT:

The retrieval system may provide passages that are related to the subject but do not directly answer the question.

Do NOT force an answer from weakly related passages.

If several passages disagree, mention the disagreement rather than pretending there is one unanimous answer.

Never fabricate missing evidence.
`;

function buildContext(relevantChunks) {
  return relevantChunks
    .map((chunk, index) => {
      return [
        `[SOURCE ${index + 1}]`,
        `Book: ${chunk.book || "Unknown"}`,
        `Page: ${chunk.page ?? "Unknown"}`,
        "",
        chunk.text
      ].join("\n");
    })
    .join("\n\n==============================\n\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { question } = req.body || {};

  if (
    !question ||
    typeof question !== "string" ||
    question.trim().length === 0
  ) {
    return res.status(400).json({
      error: "Question is required"
    });
  }

  if (question.length > 1000) {
    return res.status(400).json({
      error: "Question too long"
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error:
        "API not configured. Please contact the site administrator."
    });
  }

  const cleanQuestion = question.trim();

  /*
   * Retrieve a larger candidate set first.
   *
   * We intentionally retrieve more than we send to the model.
   */
  const relevantChunks = searchChunks(
    chunks,
    cleanQuestion,
    12
  );

  if (relevantChunks.length === 0) {
    return res.status(200).json({
      answer: FALLBACK_ANSWER,
      sources: [],
      foundInSources: false
    });
  }

  /*
   * Keep context manageable.
   */
  const contextChunks = relevantChunks.slice(0, 8);

  const context = buildContext(contextChunks);

  const queryAnalysis = analyzeQuery(cleanQuestion);

  const userPrompt = `
USER QUESTION:

${cleanQuestion}

RETRIEVED SOURCE PASSAGES:

${context}

RESEARCH INSTRUCTIONS:

Answer the user's question based on the retrieved passages.

The passages were retrieved using both exact terminology and related Islamic concepts. Therefore, do not assume that a passage is relevant merely because it shares a word with the question.

First determine which passages actually address the question.

If a passage is directly relevant, use it.

If a passage is only generally related, do not use it as primary evidence.

If the sources contain insufficient evidence for a confident answer, use the required fallback statement.

When possible:

- State the answer directly.
- Briefly explain the evidence.
- Quote a short relevant portion of the source when useful.
- Give the book title and page number immediately after the relevant claim.

Do not cite irrelevant sources simply to increase the number of citations.

INTERNAL RETRIEVAL ANALYSIS:

Detected concepts:
${queryAnalysis.concepts.join(", ") || "none"}

Do not mention this internal retrieval analysis in your answer.

ANSWER:
`;

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.05,
        max_tokens: 900
      })
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();

      console.error(
        "Groq error:",
        errorText
      );

      return res.status(502).json({
        error:
          "AI service temporarily unavailable. Please try again."
      });
    }

    const data = await groqRes.json();

    const rawAnswer =
      data?.choices?.[0]?.message?.content || "";

    if (!rawAnswer.trim()) {
      return res.status(200).json({
        answer: FALLBACK_ANSWER,
        sources: [],
        foundInSources: false
      });
    }

    const sources = contextChunks.map((chunk) => ({
      book: chunk.book,
      page: chunk.page,
      excerpt:
        chunk.text.slice(0, 220) +
        (chunk.text.length > 220 ? "…" : "")
    }));

    return res.status(200).json({
      answer: rawAnswer.trim(),
      sources,
      foundInSources: true
    });
  } catch (error) {
    console.error(
      "Chat API error:",
      error
    );

    return res.status(500).json({
      error:
        "Something went wrong. Please try again."
    });
  }
}