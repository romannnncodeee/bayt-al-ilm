import { searchChunks, analyzeQuery } from "../../utils/search";
import chunks from "../../data/chunks.json";

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const FALLBACK_ANSWER =
  "I could not find a clear answer to this in the provided sources. Please refer to a qualified Salafi scholar.";

const SYSTEM_PROMPT = `
You are the Islamic research assistant for Bayt al-Ilm.

Your primary job is to answer questions using the Islamic source passages supplied to you.

SOURCE DISCIPLINE:

1. Answer using the supplied source passages.
2. Do not invent quotations, page numbers, book titles, scholar statements, Quran verses, or hadith.
3. Do not use outside knowledge to fill gaps in the retrieved sources.
4. Do not force an answer when the sources do not clearly support one.
5. If the retrieved sources are insufficient, say:
"I could not find a clear answer to this in the provided sources. Please refer to a qualified Salafi scholar."
6. Distinguish between what the source explicitly states and what is merely an inference.
7. Prefer directly relevant passages over passages that merely contain similar words.
8. Keep the answer concise and directly answer the user's question.

BIBLIOGRAPHIC / CITATION RULES:

The Book field supplied with every source is authoritative metadata.

NEVER:
- shorten a book title
- rewrite a book title
- translate a book title
- normalize a book title
- abbreviate a book title
- invent a different title
- replace the author's name with a shorter title
- merge two different books into one title

If a source says:

"Nawaqid Al Islam- Sharh Salih Al Fawzan"

you must refer to it using EXACTLY:

"Nawaqid Al Islam- Sharh Salih Al Fawzan"

Do NOT change it to:
"Sharh Salih Al-Fawzan"

If a source says:

"Nawaqid Al Islam- Sharh Sheikh Sulayman Al- Ruhayli"

you must preserve that exact title.

If a source says:

"Tafseer-As-Sadi-Volume-2-Juz-4-6"

you must preserve that exact title.

The Page field is also authoritative.

Never invent or alter page numbers.

When citing evidence inside your answer, use:

(Book title exactly as supplied, p. page)

Do not create citations for sources that do not support the statement.

AQIDAH:

Bayt al-Ilm follows the Salafi Athari approach.

Allah's Names and Attributes are affirmed as they came in the Quran and authentic Sunnah, without Tahreef, Ta'teel, Takyeef, or Tamtheel.

Do not reinterpret Allah's Attributes metaphorically.

However, when reporting a scholarly statement, accurately represent what the source actually says.

IMPORTANT:

Retrieved passages may contain similar terminology without actually answering the question.

Do not treat a passage as evidence merely because it contains words such as "kufr", "shirk", "apostasy", or another related term.

For example, if the question is about sihr, a general passage about kufr is not automatically evidence about sihr.

Use the most directly relevant passages.

If several sources provide evidence, synthesize them carefully without inventing conclusions.

Never fabricate missing evidence.
`;

function buildContext(relevantChunks) {
  return relevantChunks
    .map((chunk, index) => {
      return [
        `[SOURCE ${index + 1}]`,
        `BOOK: ${chunk.book || "Unknown"}`,
        `PAGE: ${chunk.page ?? "Unknown"}`,
        `CHUNK: ${chunk.chunk ?? "Unknown"}`,
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
   * Retrieve relevant passages.
   *
   * searchChunks handles:
   * - Arabic normalization
   * - Islamic terminology
   * - synonyms
   * - phrase matching
   * - BM25-style scoring
   * - result diversity
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
   * Only send the strongest passages to the model.
   */
  const contextChunks =
    relevantChunks.slice(0, 8);

  const context =
    buildContext(contextChunks);

  const queryAnalysis =
    analyzeQuery(cleanQuestion);

  const userPrompt = `
USER QUESTION:

${cleanQuestion}

RETRIEVED SOURCE PASSAGES:

${context}

RESEARCH INSTRUCTIONS:

Answer the user's question using the source passages above.

IMPORTANT:

The source passages have already been retrieved from the Bayt al-Ilm library.

Do not assume a passage answers the question merely because it contains a related word.

Determine which passages actually address the user's question.

If the sources clearly answer the question:
- Give the answer directly.
- Explain the evidence briefly.
- Quote a short relevant portion when useful.
- Cite the exact Book title and Page supplied with that source.

When citing a source, reproduce its BOOK field EXACTLY.

Do not shorten it.

Do not rename it.

Do not turn:
"Nawaqid Al Islam- Sharh Salih Al Fawzan"
into:
"Sharh Salih Al-Fawzan".

Do not turn:
"Nawaqid Al Islam- Sharh Sheikh Sulayman Al- Ruhayli"
into another title.

Do not invent bibliographic information.

If the evidence is insufficient, use:

"I could not find a clear answer to this in the provided sources. Please refer to a qualified Salafi scholar."

Do not mention the retrieval system, search algorithm, query expansion, or internal analysis.

DETECTED CONCEPTS:

${queryAnalysis.concepts.join(", ") || "none"}

ANSWER:
`;

  try {
    const groqRes = await fetch(
      GROQ_API_URL,
      {
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
      }
    );

    if (!groqRes.ok) {
      const errorText =
        await groqRes.text();

      console.error(
        "Groq error:",
        errorText
      );

      return res.status(502).json({
        error:
          "AI service temporarily unavailable. Please try again."
      });
    }

    const data =
      await groqRes.json();

    const rawAnswer =
      data?.choices?.[0]?.message?.content ||
      "";

    if (!rawAnswer.trim()) {
      return res.status(200).json({
        answer: FALLBACK_ANSWER,
        sources: [],
        foundInSources: false
      });
    }

    /*
     * IMPORTANT:
     *
     * These citations come directly from chunks.json.
     * The AI cannot rename them.
     */
    const sources =
      contextChunks.map((chunk) => ({
        book: chunk.book || "Unknown",
        page: chunk.page ?? "Unknown",
        chunk: chunk.chunk ?? null,

        excerpt:
          chunk.text.length > 250
            ? chunk.text.slice(0, 250) + "…"
            : chunk.text
      }));

    return res.status(200).json({
      answer: rawAnswer.trim(),

      /*
       * Exact metadata from the database.
       */
      sources,

      foundInSources: true,

      /*
       * Useful for debugging the retrieval system.
       * Your frontend does not have to display this.
       */
      retrieval: {
        concepts:
          queryAnalysis.concepts,

        retrieved:
          contextChunks.length
      }
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