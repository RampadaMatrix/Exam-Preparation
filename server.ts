import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import {
  getParsedPaper,
  digitizePaperOnDemand,
  extractDiagramsFromMarkdown,
} from "./server/digitizer.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper function to resolve relative pdf path safely
  const getPdfFilePath = (reqPath: string): string | null => {
    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    const absolutePath = path.join(process.cwd(), safePath);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile() && safePath.endsWith('.pdf')) {
      return absolutePath;
    }
    return null;
  };

  // API Route: PDF Inline Viewer
  app.get('/api/pdf/*', (req, res) => {
    const rawPath = (req.params as unknown as Record<string, string>)[0];
    const filePath = getPdfFilePath(rawPath);
    if (!filePath) {
      return res.status(404).json({ error: 'Question paper PDF not found' });
    }
    const fileName = path.basename(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });

  // API Route: Direct PDF Download
  app.get('/api/download/*', (req, res) => {
    const rawPath = (req.params as unknown as Record<string, string>)[0];
    const filePath = getPdfFilePath(rawPath);
    if (!filePath) {
      return res.status(404).json({ error: 'Question paper PDF not found' });
    }
    const fileName = path.basename(filePath);
    res.download(filePath, fileName);
  });

  // API Route: Get Parsed Status across all papers
  app.get('/api/parsed-status', (_req, res) => {
    const parsedDir = path.join(process.cwd(), 'parsed_papers');
    const result: Record<string, { isParsed: boolean; diagramsCount: number; pageCount: number }> = {};

    if (fs.existsSync(parsedDir)) {
      const walk = (d: string) => {
        const items = fs.readdirSync(d);
        for (const it of items) {
          const p = path.join(d, it);
          if (fs.statSync(p).isDirectory()) {
            walk(p);
          } else if (it.endsWith('.md')) {
            const rawId = it.replace('.md', '');
            const content = fs.readFileSync(p, 'utf8');
            const diagrams = extractDiagramsFromMarkdown(content);
            const pageMatches = content.match(/## Page \d+/g) || [];
            const info = {
              isParsed: true,
              diagramsCount: diagrams.length,
              pageCount: pageMatches.length || 1,
            };
            result[rawId] = info;
            result[rawId.toLowerCase()] = info;
            result[rawId.toLowerCase().replace(/[^a-z0-9]/g, '')] = info;

            // Handle year prefix or suffix patterns
            const yrMatch = rawId.match(/^(20\d\d)[-_](.+)$/);
            if (yrMatch) {
              const yr = yrMatch[1];
              const rest = yrMatch[2];
              result[`${rest}_${yr}`] = info;
              result[`${rest}-${yr}`] = info;
              result[`${yr}_${rest}`] = info;
              result[`${yr}-${rest}`] = info;
              result[rest.toLowerCase().replace(/[^a-z0-9]/g, '')] = info;
            }
          }
        }
      };
      walk(parsedDir);
    }
    res.json(result);
  });

  // API Route: Get Single Parsed Paper (Markdown + Diagrams)
  app.get('/api/parsed-paper/:paperId', (req, res) => {
    const paperId = req.params.paperId;
    const meta = {
      title: req.query.title as string,
      year: req.query.year as string,
      subject: req.query.subject as string,
      medium: req.query.medium as string,
    };
    const paper = getParsedPaper(paperId, meta);
    if (!paper) {
      return res.status(404).json({
        isParsed: false,
        message: 'This question paper has not been digitized into Markdown yet.',
        paperId,
      });
    }
    res.json(paper);
  });

  // API Route: Trigger on-demand digitization of paper
  app.post('/api/digitize/:paperId', async (req, res) => {
    try {
      const paperId = req.params.paperId;
      const { relativePath, title, subject } = req.body;
      const pdfPath = getPdfFilePath(relativePath || '');

      if (!pdfPath) {
        return res.status(404).json({ error: 'Source PDF file not found to digitize' });
      }

      const outPath = path.join(process.cwd(), 'parsed_papers', `${paperId}.md`);
      const result = await digitizePaperOnDemand(
        pdfPath,
        outPath,
        title || paperId,
        subject || 'General'
      );
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Digitize error:', msg);
      res.status(500).json({ error: msg });
    }
  });

  // API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for dev mode or static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3000 },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Madhyamik Question Papers server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
