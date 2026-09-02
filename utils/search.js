/**
 * Keyword search with Islamic synonym expansion.
 * Accepts a long query string (original + expanded terms from AI).
 */

const STOP_WORDS = new Set([
  "the","a","an","is","it","in","on","at","to","for","of","and","or","but",
  "not","with","this","that","are","was","were","be","been","have","has",
  "do","does","did","will","would","could","should","may","might","can",
  "what","which","who","whom","how","when","where","why","i","me","my",
  "we","our","you","your","he","his","she","her","they","their","them",
  "al","ibn","abu","bint","bin",
]);

// Static synonym map as fallback when AI expansion fails
const SYNONYMS = {
  "nawaqid":    ["nullifiers","invalidators","nullify","violates","breaks","apostasy"],
  "nullifiers": ["nawaqid","invalidators","violates","breaks"],
  "hand":       ["yad","hands","attribute","sifa"],
  "yad":        ["hand","hands"],
  "face":       ["wajh","countenance"],
  "wajh":       ["face","countenance"],
  "istiwa":     ["rose","ascend","above","throne","arsh","settled","istawaa"],
  "uluw":       ["above","high","highness","transcendence","throne","heaven","sky"],
  "throne":     ["arsh","istiwa","above","uluw"],
  "arsh":       ["throne","istiwa","above"],
  "where":      ["uluw","above","throne","arsh","istiwa","heaven","sky","highness"],
  "attributes": ["sifat","names","asma","attribute","sifa"],
  "sifat":      ["attributes","attribute","names","sifa"],
  "tawhid":     ["monotheism","oneness","unity","tawheed"],
  "tawheed":    ["tawhid","monotheism","oneness"],
  "shirk":      ["polytheism","associating","partners","association"],
  "kufr":       ["disbelief","kafir","apostasy","unbelief"],
  "iman":       ["faith","belief","eeman","imaan"],
  "eeman":      ["iman","faith","belief"],
  "qadr":       ["decree","predestination","destiny","qadar"],
  "qadar":      ["qadr","decree","predestination"],
  "salah":      ["prayer","salat","salaah","namaz","pray"],
  "salat":      ["salah","prayer","salaah","pray"],
  "prayer":     ["salah","salat","pray","salaah"],
  "wudu":       ["ablution","purification","wudhu","wudoo"],
  "wudhu":      ["wudu","ablution","purification"],
  "ablution":   ["wudu","wudhu","purification"],
  "tayammum":   ["dry ablution","sand","purification"],
  "ghusl":      ["bath","ritual bath","janabah","purification"],
  "adhan":      ["call to prayer","azan","athan"],
  "sawm":       ["fasting","fast","siyam","ramadan"],
  "siyam":      ["sawm","fasting","fast"],
  "fasting":    ["sawm","siyam","fast","ramadan"],
  "ramadan":    ["fasting","sawm","siyam","month"],
  "zakat":      ["zakah","charity","nisab","obligatory"],
  "zakah":      ["zakat","charity","nisab"],
  "nisab":      ["threshold","minimum","amount","zakat","gold","silver"],
  "hajj":       ["pilgrimage","makkah","kaaba","umrah"],
  "umrah":      ["hajj","pilgrimage","makkah"],
  "sunnah":     ["hadith","prophetic","tradition","prophet"],
  "hadith":     ["sunnah","narration","reported","prophet said"],
  "bidah":      ["innovation","bid'ah","newly invented"],
  "halal":      ["permissible","allowed","lawful"],
  "haram":      ["forbidden","prohibited","impermissible","unlawful"],
  "fard":       ["obligatory","wajib","compulsory","duty"],
  "wajib":      ["obligatory","fard","compulsory"],
  "tawbah":     ["repentance","repent","return to allah"],
  "repentance": ["tawbah","repent","forgiveness"],
  "dua":        ["supplication","prayer","invocation","asking allah"],
  "dhikr":      ["remembrance","mention","glorification"],
  "sihr":       ["magic","sorcery","witchcraft","magician","kufr"],
  "magic":      ["sihr","sorcery","witchcraft","magician"],
  "riba":       ["usury","interest","loan","bank"],
  "usury":      ["riba","interest","forbidden"],
};

function expandWithSynonyms(tokens) {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const syns = SYNONYMS[token];
    if (syns) {
      for (const s of syns) {
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
    // Partial match bonus
    for (const ct of chunkSet) {
      if (ct.includes(token) && ct !== token && token.length > 3) {
        score += 0.4;
      }
    }
  }

  return score;
}

/**
 * Returns the top N most relevant chunks.
 * Accepts a full expanded query string (original + AI-generated terms).
 */
export function searchChunks(chunks, query, topN = 8) {
  if (!chunks || chunks.length === 0) return [];

  const baseTokens = tokenize(query);
  if (baseTokens.length === 0) return [];

  // Apply static synonym expansion as additional fallback
  const expandedTokens = expandWithSynonyms(baseTokens);

  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, expandedTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map(({ chunk }) => chunk);
}
