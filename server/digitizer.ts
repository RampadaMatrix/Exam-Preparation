import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini SDK with User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export interface ParsedDiagramInfo {
  id: string;
  title: string;
  svg: string;
  caption?: string;
}

export interface ParsedPaperResult {
  paperId: string;
  title: string;
  year: string;
  subject: string;
  medium: string;
  markdown: string;
  diagrams: ParsedDiagramInfo[];
  pageCount: number;
  isParsed: boolean;
  lastParsedAt?: string;
}

/**
 * Universal PDF page extractor for both direct DCTDecode (JPEG)
 * and FlateDecode (zlib-compressed JFIF) scanned examination papers.
 */
export function extractPagesFromPdf(pdfPath: string): Buffer[] {
  if (!fs.existsSync(pdfPath)) return [];
  const buf = fs.readFileSync(pdfPath);
  const pages: Buffer[] = [];
  const streamMarker = Buffer.from('stream');
  const endstreamMarker = Buffer.from('endstream');
  
  let pos = 0;
  while (true) {
    const sIdx = buf.indexOf(streamMarker, pos);
    if (sIdx === -1) break;
    const eIdx = buf.indexOf(endstreamMarker, sIdx);
    if (eIdx === -1) break;

    let start = sIdx + 6;
    while (start < eIdx && (buf[start] === 0x0d || buf[start] === 0x0a)) start++;
    let end = eIdx;
    while (end > start && (buf[end - 1] === 0x0d || buf[end - 1] === 0x0a)) end--;

    const slice = buf.subarray(start, end);

    // 1. Direct JPEG
    if (slice.length > 20000 && slice[0] === 0xff && slice[1] === 0xd8 && slice[2] === 0xff) {
      pages.push(slice);
    } else {
      // 2. Flate-compressed JPEG
      try {
        const unzipped = zlib.inflateSync(slice);
        if (unzipped.length > 20000 && unzipped[0] === 0xff && unzipped[1] === 0xd8 && unzipped[2] === 0xff) {
          pages.push(unzipped);
        }
      } catch {
        // Not a compressed stream, skip
      }
    }
    pos = eIdx + 9;
  }
  return pages;
}

/**
 * Parses SVG blocks from markdown text into structured diagram objects
 */
export function extractDiagramsFromMarkdown(markdown: string): ParsedDiagramInfo[] {
  const diagrams: ParsedDiagramInfo[] = [];
  // Match ```xml or ```svg blocks containing <svg ... </svg>
  const regex = /```(?:svg|xml)\s*([\s\S]*?<svg[\s\S]*?<\/svg>[\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  let idx = 1;

  while ((match = regex.exec(markdown)) !== null) {
    const fullCode = match[1].trim();
    // extract pure <svg ... </svg>
    const svgMatch = fullCode.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      diagrams.push({
        id: `diagram-${idx}`,
        title: `Technical & Geometric Diagram ${idx}`,
        svg: svgMatch[0],
        caption: `Rendered vector illustration reconstructed from board exam paper`
      });
      idx++;
    }
  }
  return diagrams;
}

/**
 * Locate markdown file for paperId
 */
export function getParsedMarkdownPath(paperId: string): string | null {
  const root = path.join(process.cwd(), 'parsed_papers');
  
  // Extract potential year if paperId begins with year like 2024- or 2025_
  const yearMatch = paperId.match(/^(20\d\d)[-_]/);
  const detectedYear = yearMatch ? yearMatch[1] : null;
  const strippedId = detectedYear ? paperId.replace(new RegExp(`^${detectedYear}[-_]`), '') : paperId;

  const candidates = [
    path.join(root, `${paperId}.md`),
    detectedYear ? path.join(root, detectedYear, `${paperId}.md`) : '',
    detectedYear ? path.join(root, detectedYear, `${strippedId}.md`) : '',
    detectedYear ? path.join(root, detectedYear, `${detectedYear}-${strippedId}.md`) : '',
    path.join(root, '2026', `${paperId}.md`),
    path.join(root, '2026', `${paperId.replace('2026-', '')}.md`),
    path.join(root, '2025', `${paperId}.md`),
    path.join(root, '2025', `${paperId.replace('2025-', '')}.md`),
    path.join(root, '2024', `${paperId}.md`),
    path.join(root, '2024', `${paperId.replace('2024-', '')}.md`),
    path.join(root, 'Compilations_2017_2025', `${paperId}.md`),
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // Also check normalized names across all markdown files
  const allParsed = walkParsedFiles(root);
  const normId = paperId.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const file of allParsed) {
    const base = path.basename(file, '.md').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (base === normId || base.includes(normId) || normId.includes(base)) {
      return file;
    }
  }

  return null;
}

function walkParsedFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkParsedFiles(full));
    } else if (file.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Read and return parsed paper data from disk
 */
export function getParsedPaper(paperId: string, metadata?: { title?: string; year?: string; subject?: string; medium?: string }): ParsedPaperResult | null {
  const mdPath = getParsedMarkdownPath(paperId);
  if (!mdPath || !fs.existsSync(mdPath)) {
    return null;
  }

  const markdown = fs.readFileSync(mdPath, 'utf8');
  const diagrams = extractDiagramsFromMarkdown(markdown);
  const stat = fs.statSync(mdPath);

  return {
    paperId,
    title: metadata?.title || path.basename(mdPath, '.md').replace(/_/g, ' '),
    year: metadata?.year || '2026',
    subject: metadata?.subject || 'Board Examination',
    medium: metadata?.medium || 'Standard',
    markdown,
    diagrams,
    pageCount: (markdown.match(/## Page \d+/g) || []).length || 1,
    isParsed: true,
    lastParsedAt: stat.mtime.toISOString(),
  };
}

/**
 * Digitize a single page snapshot with Gemini 3.1 Flash Lite
 */
async function transcribePageWithGemini(pageBuf: Buffer, pageNum: number, subject: string): Promise<string> {
  const prompt = `Transcribe this WBBSE Madhyamik Class 10 ${subject} board exam paper page into clean, structured Markdown:
- Maintain exact question numbering and section names (Group A, Group B, Group C, Group D, Group E, etc.).
- Preserve marks distribution (e.g. [1x6=6], [2x10=20], [5x6=30], etc.).
- Convert all mathematical, physical, and chemical formulas into clean LaTeX notation ($...$ and $$...$$).
- Format multiple choice questions with neat option choices.
- If there are any diagrams, geometric figures, ray paths, biological organs/cells, or electric circuits, draw a clean, complete, high-contrast, scalable vector SVG illustration inside an \`\`\`svg block with viewBox, coordinates, paths, and clear labels.
- Output pure Markdown.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: pageBuf.toString('base64'),
                },
              },
              { text: prompt },
            ],
          },
        ],
      });
      return res.text || '';
    } catch (err) {
      console.warn(`Attempt ${attempt + 1} failed for page ${pageNum}:`, err);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return `<!-- Page ${pageNum} transcription pending -->`;
}

/**
 * Digitize a PDF paper on demand and save to parsed_papers/
 */
export async function digitizePaperOnDemand(
  pdfPath: string,
  outPath: string,
  paperTitle: string,
  subject: string
): Promise<ParsedPaperResult> {
  const pages = extractPagesFromPdf(pdfPath);
  if (pages.length === 0) {
    throw new Error('No page snapshots could be extracted from PDF');
  }

  let fullMarkdown = `# ${paperTitle}\n\n**Total Marks: 90** | **Time: 3 Hours 15 Minutes** | **WBBSE Madhyamik**\n\n---\n\n`;

  for (let i = 0; i < pages.length; i++) {
    const pageMd = await transcribePageWithGemini(pages[i], i + 1, subject);
    fullMarkdown += `## Page ${i + 1}\n\n${pageMd}\n\n---\n\n`;
  }

  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outPath, fullMarkdown, 'utf8');
  const diagrams = extractDiagramsFromMarkdown(fullMarkdown);

  return {
    paperId: path.basename(outPath, '.md'),
    title: paperTitle,
    year: '2026',
    subject,
    medium: 'English/Bengali',
    markdown: fullMarkdown,
    diagrams,
    pageCount: pages.length,
    isParsed: true,
    lastParsedAt: new Date().toISOString(),
  };
}
