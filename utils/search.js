/**
 * Simple TF-IDF-style keyword search over chunks.
 * Runs entirely in the API route (server-side) so no latency on the client.
 */

// Common stop words to ignore
const STOP_WORDS = new Set([
  "the","a","an","is","it","in","on","at","to","for","of","and","or","but",
  "not","with","this","that","are","was","were","be","been","have","has",
  "do","does","did","will","would","could","should","may","might","can",
  "what","which","who","whom","how","when","where","why","i","me","my",
  "we","our","you","your","he","his","she","her","they","their","them",
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, " ") // keep Arabic chars
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function scoreChunk(chunk, queryTokens) {
  const chunkTokens = tokenize(chunk.text);
  const chunkSet = new Set(chunkTokens);

  let score = 0;
  for (const token of queryTokens) {
    if (chunkSet.has(token)) {
      // Count occurrences
      const freq = chunkTokens.filter((t) => t === token).length;
      score += 1 + Math.log(freq + 1);
    }
    // Partial match bonus
    for (const ct of chunkSet) {
      if (ct.includes(token) && ct !== token) {
        score += 0.3;
      }
    }
  }

  return score;
}

/**
 * Returns the top N most relevant chunks for a query.
 */
export function searchChunks(chunks, query, topN = 5) {
  if (!chunks || chunks.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map(({ chunk }) => chunk);
}
