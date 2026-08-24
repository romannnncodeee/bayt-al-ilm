/**
 * Keyword search with Islamic synonym expansion.
 * Handles common Arabic/English term variations so questions
 * like "nawaqid al islam" also match "nullifiers of Islam".
 */

const STOP_WORDS = new Set([
  "the","a","an","is","it","in","on","at","to","for","of","and","or","but",
  "not","with","this","that","are","was","were","be","been","have","has",
  "do","does","did","will","would","could","should","may","might","can",
  "what","which","who","whom","how","when","where","why","i","me","my",
  "we","our","you","your","he","his","she","her","they","their","them",
  "al","ibn","abu","bint","bin",
]);

// Islamic synonym map — expands query terms to catch more matches
const SYNONYMS = {
  // Aqidah / Attributes of Allah
  "nawaqid":        ["nullifiers", "invalidators", "nullify", "violates", "breaks"],
  "nullifiers":     ["nawaqid", "invalidators", "violates", "breaks"],
  "hand":           ["yad", "hands", "attribute", "sifa"],
  "yad":            ["hand", "hands"],
  "face":           ["wajh", "countenance"],
  "wajh":           ["face", "countenance"],
  "istiwa":         ["rose", "ascend", "above", "throne", "arsh", "settled"],
  "throne":         ["arsh", "istiwa", "above"],
  "arsh":           ["throne", "istiwa"],
  "attributes":     ["sifat", "names", "asma", "attribute", "sifa"],
  "sifat":          ["attributes", "attribute", "names", "sifa"],
  "tawhid":         ["monotheism", "oneness", "unity", "tawheed"],
  "tawheed":        ["tawhid", "monotheism", "oneness"],
  "shirk":          ["polytheism", "associating", "partners", "association"],
  "kufr":           ["disbelief", "kafir", "apostasy", "unbelief"],
  "iman":           ["faith", "belief", "eeman", "imaan"],
  "eeman":          ["iman", "faith", "belief"],
  "qadr":           ["decree", "predestination", "destiny", "qadar"],
  "qadar":          ["qadr", "decree", "predestination"],

  // Fiqh — Prayer
  "salah":          ["prayer", "salat", "salaah", "namaz", "pray"],
  "salat":          ["salah", "prayer", "salaah", "pray"],
  "prayer":         ["salah", "salat", "pray", "salaah"],
  "wudu":           ["ablution", "purification", "wudhu", "wudoo"],
  "wudhu":          ["wudu", "ablution", "purification"],
  "ablution":       ["wudu", "wudhu", "purification"],
  "tayammum":       ["dry ablution", "sand", "purification"],
  "ghusl":          ["bath", "ritual bath", "janabah", "purification"],
  "adhan":          ["call to prayer", "azan", "athan"],
  "iqamah":         ["iqama", "second call", "prayer called"],
  "rukn":           ["pillar", "pillars", "arkaan", "condition"],
  "sujud":          ["prostration", "sajdah", "sajda"],
  "ruku":           ["bowing", "bow"],

  // Fiqh — Fasting
  "sawm":           ["fasting", "fast", "siyam", "ramadan"],
  "siyam":          ["sawm", "fasting", "fast"],
  "fasting":        ["sawm", "siyam", "fast", "ramadan"],
  "ramadan":        ["fasting", "sawm", "siyam", "month"],
  "iftar":          ["break fast", "breaking fast", "sunset"],
  "suhoor":         ["suhur", "predawn meal", "before fajr"],

  // Fiqh — Zakat
  "zakat":          ["zakah", "charity", "nisab", "obligatory", "purification"],
  "zakah":          ["zakat", "charity", "nisab"],
  "nisab":          ["threshold", "minimum", "amount", "zakat", "gold", "silver"],

  // Fiqh — Hajj
  "hajj":           ["pilgrimage", "makkah", "kaaba", "umrah"],
  "umrah":          ["hajj", "pilgrimage", "makkah"],

  // General Islamic terms
  "sunnah":         ["hadith", "prophetic", "tradition", "prophet"],
  "hadith":         ["sunnah", "narration", "reported", "prophet said"],
  "bidah":          ["innovation", "bid'ah", "newly invented"],
  "halal":          ["permissible", "allowed", "lawful"],
  "haram":          ["forbidden", "prohibited", "impermissible", "unlawful"],
  "makruh":         ["disliked", "discouraged"],
  "fard":           ["obligatory", "wajib", "compulsory", "duty"],
  "wajib":          ["obligatory", "fard", "compulsory"],
  "mustahabb":      ["recommended", "sunnah", "preferred"],
  "mubah":          ["permissible", "allowed", "neutral"],
  "tawbah":         ["repentance", "repent", "return to allah"],
  "repentance":     ["tawbah", "repent", "forgiveness"],
  "dua":            ["supplication", "prayer", "invocation", "asking allah"],
  "supplication":   ["dua", "invocation", "asking allah"],
  "dhikr":          ["remembrance", "mention", "glorification"],
  "quran":          ["quran", "quraan", "koran", "book of allah", "revelation"],
};

function expandQuery(tokens) {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const syns = SYNONYMS[token];
    if (syns) {
      for (const s of syns) {
        // add individual words from multi-word synonyms
        s.split(" ").forEach((w) => { if (w.length > 2) expanded.add(w); });
      }
    }
  }
  return Array.from(expanded);
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function scoreChunk(chunk, queryTokens) {
  const chunkTokens = tokenize(chunk.text);
  const chunkSet = new Set(chunkTokens);

  let score = 0;
  for (const token of queryTokens) {
    if (chunkSet.has(token)) {
      const freq = chunkTokens.filter((t) => t === token).length;
      score += 1 + Math.log(freq + 1);
    }
    // Partial match
    for (const ct of chunkSet) {
      if (ct.includes(token) && ct !== token && token.length > 3) {
        score += 0.4;
      }
    }
  }

  return score;
}

/**
 * Returns the top N most relevant chunks for a query,
 * with Islamic synonym expansion.
 */
export function searchChunks(chunks, query, topN = 8) {
  if (!chunks || chunks.length === 0) return [];

  const baseTokens = tokenize(query);
  if (baseTokens.length === 0) return [];

  // Expand with synonyms
  const expandedTokens = expandQuery(baseTokens);

  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, expandedTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map(({ chunk }) => chunk);
}
