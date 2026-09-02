/**
 * Bayt al-Ilm PDF processor
 *
 * Usage:
 *   node scripts/processPdf.js "path/to/book.pdf" "Book Title"
 *
 * Extracts PDF text page-by-page while preserving page numbers.
 *
 * Chunks are created around sentence/paragraph boundaries where possible,
 * rather than blindly cutting every 600 characters.
 */

const fs = require("fs");
const path = require("path");
const pdfjsLib = require("pdfjs-dist");

const CHUNKS_FILE = path.join(
  __dirname,
  "../data/chunks.json"
);

const TARGET_CHARS = 1000;
const MIN_CHARS = 250;
const OVERLAP_CHARS = 150;

function cleanText(text) {
  return String(text || "")
    .replace(/\u00ad/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Attempt to split naturally.
 */
function splitIntoChunks(text) {
  const clean = cleanText(text);

  if (!clean || clean.length < MIN_CHARS) {
    return [];
  }

  /*
   * Prefer paragraph/sentence boundaries.
   */
  const sentences = clean
    .split(/(?<=[.!?؟۔])\s+/)
    .filter(Boolean);

  const chunks = [];

  let current = "";

  for (const sentence of sentences) {
    /*
     * If adding another sentence keeps the chunk reasonably sized,
     * keep building it.
     */
    if (
      current.length === 0 ||
      current.length + sentence.length + 1 <= TARGET_CHARS
    ) {
      current +=
        (current ? " " : "") + sentence;
      continue;
    }

    if (current.length >= MIN_CHARS) {
      chunks.push(current.trim());
    }

    /*
     * Small overlap to avoid losing context between chunks.
     */
    const overlap =
      current.length > OVERLAP_CHARS
        ? current.slice(-OVERLAP_CHARS)
        : current;

    current =
      overlap.trim() +
      " " +
      sentence;
  }

  if (current.trim().length >= MIN_CHARS) {
    chunks.push(current.trim());
  }

  /*
   * Some PDFs have terrible punctuation extraction.
   * Fall back to character-based chunks for unusually long
   * unbroken text.
   */
  if (chunks.length === 0 && clean.length >= MIN_CHARS) {
    let start = 0;

    while (start < clean.length) {
      const end = Math.min(
        start + TARGET_CHARS,
        clean.length
      );

      const piece = clean
        .slice(start, end)
        .trim();

      if (piece.length >= MIN_CHARS) {
        chunks.push(piece);
      }

      if (end === clean.length) break;

      start +=
        TARGET_CHARS - OVERLAP_CHARS;
    }
  }

  return chunks;
}

async function extractPdf(
  pdfPath,
  bookTitle
) {
  const absolutePath =
    path.resolve(pdfPath);

  console.log(
    `\nProcessing: ${absolutePath}`
  );

  console.log(
    `Book title: ${bookTitle}`
  );

  const data = new Uint8Array(
    fs.readFileSync(absolutePath)
  );

  const pdf =
    await pdfjsLib
      .getDocument({
        data,
        useSystemFonts: true
      })
      .promise;

  const totalPages = pdf.numPages;

  console.log(
    `Total pages: ${totalPages}`
  );

  const allChunks = [];

  for (
    let pageNum = 1;
    pageNum <= totalPages;
    pageNum++
  ) {
    const page =
      await pdf.getPage(pageNum);

    const textContent =
      await page.getTextContent();

    const pageText =
      textContent.items
        .map((item) => item.str)
        .join(" ");

    const cleanPageText =
      cleanText(pageText);

    if (
      !cleanPageText ||
      cleanPageText.length < MIN_CHARS
    ) {
      continue;
    }

    const pageChunks =
      splitIntoChunks(cleanPageText);

    for (
      let chunkIndex = 0;
      chunkIndex < pageChunks.length;
      chunkIndex++
    ) {
      allChunks.push({
        book: bookTitle,
        page: pageNum,
        chunk: chunkIndex + 1,
        text: pageChunks[chunkIndex]
      });
    }

    if (pageNum % 20 === 0) {
      process.stdout.write(
        `  Processed ${pageNum}/${totalPages} pages...\r`
      );
    }
  }

  console.log(
    `\nExtracted ${allChunks.length} chunks from ${totalPages} pages.`
  );

  return allChunks;
}

function saveChunks(newChunks) {
  let existing = [];

  if (
    fs.existsSync(CHUNKS_FILE)
  ) {
    try {
      existing = JSON.parse(
        fs.readFileSync(
          CHUNKS_FILE,
          "utf-8"
        )
      );
    } catch {
      console.warn(
        "Could not read existing chunks.json. Starting fresh."
      );

      existing = [];
    }
  }

  const combined = [
    ...existing,
    ...newChunks
  ];

  fs.writeFileSync(
    CHUNKS_FILE,
    JSON.stringify(
      combined,
      null,
      2
    ),
    "utf-8"
  );

  console.log(
    `Saved. Total chunks in database: ${combined.length}`
  );
}

async function main() {
  const args =
    process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "Usage: node scripts/processPdf.js <path-to-pdf> <Book Title>"
    );

    console.error(
      'Example: node scripts/processPdf.js ./books/fiqh.pdf "Fiqh al-Sunnah"'
    );

    process.exit(1);
  }

  const [
    pdfPath,
    bookTitle
  ] = args;

  if (!fs.existsSync(pdfPath)) {
    console.error(
      `File not found: ${pdfPath}`
    );

    process.exit(1);
  }

  const extractedChunks =
    await extractPdf(
      pdfPath,
      bookTitle
    );

  saveChunks(
    extractedChunks
  );

  console.log(
    "\nDone! Commit data/chunks.json and redeploy."
  );
}

main().catch((error) => {
  console.error(
    "Error:",
    error.message
  );

  process.exit(1);
});