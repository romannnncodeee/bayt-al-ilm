/**
 * processPdf.js
 * 
 * Run this locally whenever you add a new PDF:
 *   node scripts/processPdf.js "path/to/book.pdf" "Book Title"
 * 
 * It extracts text page by page, splits into chunks,
 * and appends them to data/chunks.json
 * 
 * Requirements: npm install pdfjs-dist
 */

const fs = require("fs");
const path = require("path");

// We use the legacy build of pdfjs which works in Node
const pdfjsLib = require("pdfjs-dist");

const CHUNKS_FILE = path.join(__dirname, "../data/chunks.json");
const CHUNK_SIZE = 600;   // characters per chunk
const CHUNK_OVERLAP = 100; // overlap between chunks

async function extractPdf(pdfPath, bookTitle) {
  const absolutePath = path.resolve(pdfPath);
  console.log(`\nProcessing: ${absolutePath}`);
  console.log(`Book title: ${bookTitle}`);

  const data = new Uint8Array(fs.readFileSync(absolutePath));
  const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;

  const totalPages = pdf.numPages;
  console.log(`Total pages: ${totalPages}`);

  const allChunks = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!pageText || pageText.length < 20) continue;

    // Split page text into overlapping chunks
    let start = 0;
    while (start < pageText.length) {
      const end = Math.min(start + CHUNK_SIZE, pageText.length);
      const chunkText = pageText.slice(start, end).trim();

      if (chunkText.length > 50) {
        allChunks.push({
          book: bookTitle,
          page: pageNum,
          text: chunkText,
        });
      }

      if (end === pageText.length) break;
      start += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    if (pageNum % 20 === 0) {
      process.stdout.write(`  Processed ${pageNum}/${totalPages} pages...\r`);
    }
  }

  console.log(`\nExtracted ${allChunks.length} chunks from ${totalPages} pages.`);
  return allChunks;
}

function saveChunks(newChunks) {
  let existing = [];
  if (fs.existsSync(CHUNKS_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(CHUNKS_FILE, "utf-8"));
    } catch {
      existing = [];
    }
  }

  const combined = [...existing, ...newChunks];
  fs.writeFileSync(CHUNKS_FILE, JSON.stringify(combined, null, 2), "utf-8");
  console.log(`Saved. Total chunks in database: ${combined.length}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node scripts/processPdf.js <path-to-pdf> <Book Title>");
    console.error('Example: node scripts/processPdf.js ./books/fiqh.pdf "Fiqh al-Sunnah"');
    process.exit(1);
  }

  const [pdfPath, bookTitle] = args;

  if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
  }

  const chunks = await extractPdf(pdfPath, bookTitle);
  saveChunks(chunks);
  console.log("\nDone! Now commit data/chunks.json and redeploy.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
