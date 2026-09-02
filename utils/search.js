/**
 * Bayt al-Ilm — Hybrid-style local retrieval
 *
 * Designed for Islamic books stored in data/chunks.json.
 *
 * Features:
 * - Arabic normalization
 * - English normalization
 * - Exact term matching
 * - Phrase matching
 * - Synonym/concept expansion
 * - BM25-inspired scoring
 * - Title/metadata matching
 * - Query-term weighting
 * - Result diversity
 *
 * No external API required.
 */

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "it", "in", "on", "at", "to", "for", "of",
  "and", "or", "but", "not", "with", "this", "that", "are", "was",
  "were", "be", "been", "have", "has", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "can", "what", "which",
  "who", "whom", "how", "when", "where", "why", "i", "me", "my",
  "we", "our", "you", "your", "he", "his", "she", "her", "they",
  "their", "them", "about", "from", "into", "than", "then", "there",
  "this", "these", "those"
]);

/*
 * Concepts rather than simple word-for-word synonyms.
 *
 * The purpose is to increase recall when scholars use different
 * terminology for the same subject.
 */
const CONCEPTS = {
  sihr: [
    "magic",
    "sorcery",
    "witchcraft",
    "magician",
    "sahir",
    "sorcerer",
    "السحر",
    "الساحر",
    "ساحر",
    "حكم السحر",
    "حكم الساحر",
    "عمل السحر",
    "تعلم السحر",
    "الشعوذة",
    "الكهانة",
    "الرقى الشركية",
    "الشياطين"
  ],

  magic: [
    "sihr",
    "sorcery",
    "witchcraft",
    "magician",
    "sahir",
    "السحر",
    "الساحر",
    "حكم السحر",
    "حكم الساحر"
  ],

  kufr: [
    "disbelief",
    "unbelief",
    "kafir",
    "apostasy",
    "riddah",
    "murtadd",
    "disbeliever",
    "كفر",
    "كافر",
    "الكفر",
    "تكفير",
    "مرتد",
    "ردة",
    "الردة",
    "نواقض الإسلام"
  ],

  shirk: [
    "polytheism",
    "associating partners",
    "major shirk",
    "minor shirk",
    "شرك",
    "الشرك",
    "الشرك الأكبر",
    "الشرك الأصغر"
  ],

  nawaqid: [
    "nullifiers",
    "nullifier",
    "invalidators",
    "apostasy",
    "riddah",
    "nawaqid al islam",
    "نواقض الإسلام",
    "نواقض الاسلام",
    "الردة",
    "ruling of apostasy"
  ],

  salah: [
    "salat",
    "prayer",
    "salaah",
    "namaz",
    "الصلاة",
    "صلاة",
    "ترك الصلاة",
    "تارك الصلاة"
  ],

  iman: [
    "faith",
    "belief",
    "eeman",
    "imaan",
    "إيمان",
    "الإيمان"
  ],

  tawhid: [
    "tawheed",
    "monotheism",
    "oneness",
    "التوحيد",
    "توحيد"
  ],

  bidah: [
    "bid'ah",
    "innovation",
    "innovated",
    "newly invented",
    "بدعة",
    "البدعة",
    "مبتدع"
  ],

  sunnah: [
    "hadith",
    "prophetic tradition",
    "narration",
    "السنة",
    "سنة",
    "حديث",
    "أثر"
  ],

  istiwa: [
    "istiwa",
    "istawaa",
    "rose",
    "ascended",
    "above",
    "throne",
    "arsh",
    "الاستواء",
    "استوى",
    "فوق العرش",
    "العرش"
  ],

  uluw: [
    "uluw",
    "highness",
    "above",
    "elevated",
    "throne",
    "heaven",
    "sky",
    "العلو",
    "العلي",
    "فوق",
    "العرش"
  ],

  qadar: [
    "qadr",
    "qadar",
    "decree",
    "predestination",
    "destiny",
    "قدر",
    "القدر",
    "القضاء والقدر"
  ],

  riba: [
    "interest",
    "usury",
    "loan",
    "ربا",
    "الربا",
    "الفائدة"
  ]
};

function normalizeArabic(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "");
}

function normalizeText(text) {
  return normalizeArabic(String(text || ""))
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[^\w\s\u0600-\u06FF']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalizeText(text)
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 1 &&
        !STOP_WORDS.has(token)
    );
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

/**
 * Detect concepts represented in the question.
 *
 * Example:
 * "Is sihr kufr?"
 *
 * becomes:
 * sihr + kufr
 */
function detectConcepts(question) {
  const normalized = normalizeText(question);
  const tokens = tokenize(question);

  const concepts = new Set();

  for (const token of tokens) {
    if (CONCEPTS[token]) {
      concepts.add(token);
    }
  }

  /*
   * Arabic phrase / English phrase detection.
   */
  for (const [concept, terms] of Object.entries(CONCEPTS)) {
    for (const term of terms) {
      if (term.length >= 3 && normalized.includes(normalizeText(term))) {
        concepts.add(concept);
        break;
      }
    }
  }

  return [...concepts];
}

/**
 * Expand query using detected concepts.
 */
function expandQuery(question) {
  const originalTokens = tokenize(question);
  const concepts = detectConcepts(question);

  const terms = new Set(originalTokens);

  for (const concept of concepts) {
    terms.add(concept);

    for (const term of CONCEPTS[concept] || []) {
      for (const token of tokenize(term)) {
        terms.add(token);
      }
    }
  }

  return {
    originalTokens,
    concepts,
    expandedTokens: [...terms]
  };
}

function countOccurrences(text, term) {
  if (!term) return 0;

  let count = 0;
  let index = 0;

  while ((index = text.indexOf(term, index)) !== -1) {
    count++;
    index += term.length;
  }

  return count;
}

/**
 * BM25-inspired term scoring.
 *
 * This is deliberately lightweight so it works with your existing
 * JSON database and doesn't require Elasticsearch/Typesense/etc.
 */
function bm25TermScore(
  term,
  documentTokens,
  documentSet,
  avgDocLength
) {
  if (!documentSet.has(term)) return 0;

  const frequency = documentTokens.filter((t) => t === term).length;

  const k1 = 1.5;
  const b = 0.75;

  const docLength = documentTokens.length || 1;

  return (
    ((frequency * (k1 + 1)) /
      (frequency +
        k1 *
          (1 - b + b * (docLength / Math.max(avgDocLength, 1)))))
  );
}

function phraseScore(text, phrase) {
  const normalizedText = normalizeText(text);
  const normalizedPhrase = normalizeText(phrase);

  if (!normalizedPhrase || normalizedPhrase.length < 3) {
    return 0;
  }

  const occurrences = countOccurrences(
    normalizedText,
    normalizedPhrase
  );

  if (occurrences === 0) return 0;

  /*
   * Phrases are very valuable in Islamic literature.
   */
  return Math.min(occurrences * 5, 15);
}

function scoreChunk(
  chunk,
  searchData,
  corpusStats
) {
  const text = normalizeText(chunk.text);

  if (!text) return 0;

  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);

  let score = 0;

  /*
   * 1. Original query terms get the highest weight.
   */
  for (const term of searchData.originalTokens) {
    const bm = bm25TermScore(
      term,
      tokens,
      tokenSet,
      corpusStats.avgDocLength
    );

    if (bm > 0) {
      score += bm * 5;
    }
  }

  /*
   * 2. Expanded conceptual terms.
   *
   * Lower weight than exact user terms.
   */
  for (const term of searchData.expandedTokens) {
    if (searchData.originalTokens.includes(term)) continue;

    const bm = bm25TermScore(
      term,
      tokens,
      tokenSet,
      corpusStats.avgDocLength
    );

    if (bm > 0) {
      score += bm * 1.7;
    }
  }

  /*
   * 3. Phrase matching.
   */
  const question = normalizeText(searchData.question);

  if (question.length > 4) {
    score += phraseScore(text, question) * 2;
  }

  /*
   * 4. Concept phrase matching.
   *
   * This catches things like:
   * "حكم السحر"
   * "نواقض الإسلام"
   * "ترك الصلاة"
   */
  for (const concept of searchData.concepts) {
    for (const phrase of CONCEPTS[concept] || []) {
      if (phrase.includes(" ")) {
        score += phraseScore(text, phrase) * 2;
      }
    }
  }

  /*
   * 5. Book title relevance.
   */
  const book = normalizeText(chunk.book || "");

  for (const concept of searchData.concepts) {
    if (book.includes(normalizeText(concept))) {
      score += 2;
    }
  }

  /*
   * 6. Exact Arabic/English term presence.
   */
  for (const concept of searchData.concepts) {
    const conceptTerms = CONCEPTS[concept] || [];

    for (const term of conceptTerms) {
      const normalizedTerm = normalizeText(term);

      if (
        normalizedTerm.length >= 4 &&
        text.includes(normalizedTerm)
      ) {
        score += 1.5;
      }
    }
  }

  return score;
}

/**
 * Remove near-duplicate passages.
 *
 * We want evidence from different parts of books rather than
 * eight almost-identical overlapping chunks from one page.
 */
function isDuplicateResult(a, selected) {
  const aText = normalizeText(a.text);

  return selected.some((b) => {
    const bText = normalizeText(b.text);

    if (!aText || !bText) return false;

    const shorter =
      aText.length < bText.length ? aText : bText;
    const longer =
      aText.length < bText.length ? bText : aText;

    if (shorter.length < 80) return false;

    return longer.includes(shorter);
  });
}

/**
 * Main retrieval function.
 *
 * Returns diverse, high-quality evidence.
 */
export function searchChunks(chunks, question, topN = 10) {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return [];
  }

  if (!question || typeof question !== "string") {
    return [];
  }

  const searchData = expandQuery(question);

  if (
    searchData.originalTokens.length === 0 &&
    searchData.concepts.length === 0
  ) {
    return [];
  }

  searchData.question = question;

  /*
   * Calculate average document length once.
   */
  let totalLength = 0;

  for (const chunk of chunks) {
    totalLength += tokenize(chunk.text).length;
  }

  const avgDocLength =
    totalLength / Math.max(chunks.length, 1);

  const corpusStats = {
    avgDocLength
  };

  const scored = chunks
    .map((chunk, index) => ({
      chunk,
      index,
      score: scoreChunk(
        chunk,
        searchData,
        corpusStats
      )
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  /*
   * First collect highly relevant results while preventing
   * identical overlapping chunks from dominating.
   */
  const selected = [];

  for (const item of scored) {
    if (selected.length >= topN) break;

    if (!isDuplicateResult(item.chunk, selected)) {
      selected.push(item);
    }
  }

  /*
   * If deduplication removed too many, fill remaining slots.
   */
  if (selected.length < topN) {
    for (const item of scored) {
      if (selected.length >= topN) break;

      if (!selected.some((x) => x.index === item.index)) {
        selected.push(item);
      }
    }
  }

  return selected.map((item) => item.chunk);
}

/**
 * Useful for debugging the retrieval system.
 */
export function analyzeQuery(question) {
  const data = expandQuery(question);

  return {
    originalTokens: data.originalTokens,
    concepts: data.concepts,
    expandedTokens: data.expandedTokens
  };
}