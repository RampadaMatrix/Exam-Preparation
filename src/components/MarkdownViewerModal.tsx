import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import {
  X,
  BookOpen,
  SplitSquareVertical,
  Code2,
  Copy,
  Check,
  Download,
  Printer,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  FileCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { QuestionPaper, ParsedPaperData } from '../types';
import { SvgDiagramRenderer } from './SvgDiagramRenderer';

interface MarkdownViewerModalProps {
  paper: QuestionPaper;
  onClose: () => void;
}

export const MarkdownViewerModal: React.FC<MarkdownViewerModalProps> = ({ paper, onClose }) => {
  const [activeTab, setActiveTab] = useState<'parsed' | 'side-by-side' | 'raw'>('parsed');
  const [parsedData, setParsedData] = useState<ParsedPaperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isDigitizing, setIsDigitizing] = useState(false);
  const [digitizeProgress, setDigitizeProgress] = useState<string>('');

  // Fetch parsed paper on mount or when paper changes
  const loadParsedPaper = async () => {
    setLoading(true);
    setError(null);
    try {
      // Clean paper id or filename
      const paperBaseId = paper.filename.replace('.pdf', '');
      const res = await fetch(
        `/api/parsed-paper/${paperBaseId}?title=${encodeURIComponent(paper.title)}&year=${paper.year}&subject=${encodeURIComponent(paper.subject)}&medium=${encodeURIComponent(paper.medium)}`
      );

      if (res.ok) {
        const data = await res.json();
        setParsedData(data);
      } else {
        setParsedData(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load parsed paper';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParsedPaper();
  }, [paper]);

  // Handle on-demand digitization
  const handleStartDigitize = async () => {
    setIsDigitizing(true);
    setDigitizeProgress('Extracting and splitting high-resolution page snapshots...');
    try {
      const paperBaseId = paper.filename.replace('.pdf', '');
      setDigitizeProgress('Processing through Gemini OCR & reconstructing LaTeX/SVG diagrams...');

      const res = await fetch(`/api/digitize/${paperBaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relativePath: paper.relativePath,
          title: paper.title,
          subject: paper.subject,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Digitization failed');
      }

      const result = await res.json();
      setParsedData(result);
      setDigitizeProgress('Completed! Displaying structured Markdown.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Digitization process error';
      setError(msg);
    } finally {
      setIsDigitizing(false);
    }
  };

  // Copy full markdown
  const handleCopyMarkdown = async () => {
    if (!parsedData?.markdown) return;
    try {
      await navigator.clipboard.writeText(parsedData.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Download markdown file
  const handleDownloadMarkdown = () => {
    if (!parsedData?.markdown) return;
    const blob = new Blob([parsedData.markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper.filename.replace('.pdf', '')}_digitized.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print paper
  const handlePrint = () => {
    window.print();
  };

  // Quick jump navigation table of contents
  const tableOfContents = useMemo(() => {
    if (!parsedData?.markdown) return [];
    const lines = parsedData.markdown.split('\n');
    const sections: { title: string; lineId: string; level: number }[] = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## Page ')) {
        const title = trimmed.replace('## ', '');
        sections.push({ title, lineId: title.toLowerCase().replace(/[^a-z0-9]/g, '-'), level: 2 });
      } else if (trimmed.startsWith('### Group ') || trimmed.startsWith('### **Group ')) {
        const title = trimmed.replace(/###\s*\**/, '').replace(/\**$/, '');
        sections.push({ title, lineId: title.toLowerCase().replace(/[^a-z0-9]/g, '-'), level: 3 });
      }
    });
    return sections;
  }, [parsedData]);

  const fontSizeClass =
    fontSize === 'xlarge'
      ? 'text-lg leading-relaxed'
      : fontSize === 'large'
      ? 'text-base leading-relaxed'
      : 'text-sm leading-normal';

  return (
    <div
      id="parsed-paper-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-hidden"
    >
      <div className="relative flex flex-col w-full max-w-7xl h-[94vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 py-3.5 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate">{paper.title}</h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> LaTeX Math & SVG Vector
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 truncate">
                <span>{paper.subject}</span>
                <span>•</span>
                <span>Year {paper.year}</span>
                <span>•</span>
                <span className="text-indigo-300 font-medium">{paper.medium} Medium</span>
                <span>•</span>
                <span>{paper.pattern}</span>
              </p>
            </div>
          </div>

          {/* Controls and Actions */}
          <div className="flex items-center gap-2">
            {/* View Mode Tabs */}
            <div className="flex items-center p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                id="tab-view-parsed"
                onClick={() => setActiveTab('parsed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'parsed'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Digitized Paper</span>
              </button>
              <button
                id="tab-view-side-by-side"
                onClick={() => setActiveTab('side-by-side')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'side-by-side'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Side-by-Side Verification</span>
              </button>
              <button
                id="tab-view-raw-markdown"
                onClick={() => setActiveTab('raw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'raw'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Markdown Source</span>
              </button>
            </div>

            {/* Font Size Adjuster */}
            <div className="hidden lg:flex items-center border border-slate-800 bg-slate-950/60 rounded-xl p-1 text-xs">
              <button
                id="btn-font-normal"
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded-lg ${
                  fontSize === 'normal' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
                title="Normal text size"
              >
                A
              </button>
              <button
                id="btn-font-large"
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded-lg ${
                  fontSize === 'large' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
                title="Large text size"
              >
                A+
              </button>
              <button
                id="btn-font-xlarge"
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 rounded-lg ${
                  fontSize === 'xlarge' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                }`}
                title="Extra large text size"
              >
                A++
              </button>
            </div>

            {/* Utility buttons */}
            {parsedData && (
              <>
                <button
                  id="btn-copy-full-markdown"
                  onClick={handleCopyMarkdown}
                  title="Copy Full Markdown"
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  id="btn-download-markdown"
                  onClick={handleDownloadMarkdown}
                  title="Download Markdown (.md)"
                  className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  id="btn-print-paper"
                  onClick={handlePrint}
                  title="Print Question Paper"
                  className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Close Modal */}
            <button
              id="btn-close-markdown-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 rounded-xl transition-colors border border-transparent"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
              <p className="text-base font-semibold text-slate-200">Loading Digitized Question Paper...</p>
              <p className="text-xs text-slate-500 mt-1">Checking chronological archive & vector diagrams</p>
            </div>
          ) : !parsedData ? (
            /* Unparsed State with One-Click AI Digitize */
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center max-w-2xl mx-auto overflow-auto">
              <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Digitize "{paper.title}"
              </h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                This question paper from the {paper.category} is currently preserved in high-resolution scanned PDF format.
                Using our multi-stage architecture, the system will split the PDF, snap crisp page snapshots, transcribe exact Bengali & English text, convert mathematical equations to LaTeX ($...$), and reconstruct all scientific diagrams as scalable SVG code.
              </p>

              {/* Multi-stage workflow illustration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8 text-left">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-mono text-indigo-400 font-semibold mb-1">STAGE 1: SNAP</div>
                  <div className="text-sm font-semibold text-slate-200">Page Isolation</div>
                  <div className="text-xs text-slate-500 mt-1">Binary DCT/Flate stream extraction of all raw pages</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-mono text-emerald-400 font-semibold mb-1">STAGE 2: SCAN</div>
                  <div className="text-sm font-semibold text-slate-200">Gemini OCR & LaTeX</div>
                  <div className="text-xs text-slate-500 mt-1">Multimodal vision for questions, marks & formulas</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-mono text-amber-400 font-semibold mb-1">STAGE 3: DRAW</div>
                  <div className="text-sm font-semibold text-slate-200">SVG Reconstruction</div>
                  <div className="text-xs text-slate-500 mt-1">Clean vector diagrams with labels and zoom controls</div>
                </div>
              </div>

              {isDigitizing ? (
                <div className="flex flex-col items-center gap-3 p-6 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl w-full">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-sm font-semibold text-indigo-200">{digitizeProgress}</p>
                  <p className="text-xs text-slate-400">This usually takes 15-30 seconds depending on page count.</p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    id="btn-start-digitizing"
                    onClick={handleStartDigitize}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Split, Snap & Digitize Paper Now
                  </button>
                  <a
                    href={paper.viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-all border border-slate-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Original PDF Only
                  </a>
                </div>
              )}

              {error && (
                <div className="mt-6 flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            /* Parsed Paper Active Display */
            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar Table of Contents (for quick navigation) */}
              {tableOfContents.length > 0 && activeTab === 'parsed' && (
                <div className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-800 bg-slate-950/40 p-4 overflow-y-auto">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Chronological Index</span>
                  </div>
                  <div className="space-y-1">
                    {tableOfContents.map((sec, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const el = document.getElementById(sec.lineId);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between group ${
                          sec.level === 2
                            ? 'font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            : 'font-normal text-slate-400 pl-4 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{sec.title}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                      </button>
                    ))}
                  </div>

                  {/* Diagrams summary box */}
                  {parsedData.diagrams && parsedData.diagrams.length > 0 && (
                    <div className="mt-6 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Vector Diagrams ({parsedData.diagrams.length})</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Interactive SVG figures rendered directly within questions.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Center Content depending on tab */}
              {activeTab === 'parsed' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/20">
                  <div className={`max-w-4xl mx-auto ${fontSizeClass}`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        // Custom code renderer to intercept SVGs
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeStr = String(children).replace(/\n$/, '');

                          // If it's an SVG block or contains <svg, render interactive vector diagram!
                          if (match && (match[1] === 'svg' || match[1] === 'xml') && codeStr.includes('<svg')) {
                            return <SvgDiagramRenderer svgContent={codeStr} />;
                          }

                          return (
                            <code className="bg-slate-800/80 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        h1({ children }) {
                          return (
                            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight pb-3 mb-6 border-b border-slate-800">
                              {children}
                            </h1>
                          );
                        },
                        h2({ children }) {
                          const title = String(children);
                          const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
                          return (
                            <div id={id} className="scroll-mt-6 pt-6 pb-2 my-4 border-b border-slate-800/80 flex items-center justify-between">
                              <h2 className="text-lg font-bold text-indigo-300 uppercase tracking-wide">
                                {children}
                              </h2>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                Exam Page Section
                              </span>
                            </div>
                          );
                        },
                        h3({ children }) {
                          const title = String(children);
                          const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
                          return (
                            <h3 id={id} className="scroll-mt-6 text-base font-bold text-slate-200 mt-6 mb-2">
                              {children}
                            </h3>
                          );
                        },
                        p({ children }) {
                          return <p className="mb-4 text-slate-300 leading-relaxed">{children}</p>;
                        },
                        ul({ children }) {
                          return <ul className="list-disc pl-6 mb-4 space-y-1 text-slate-300">{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className="list-decimal pl-6 mb-4 space-y-1 text-slate-300">{children}</ol>;
                        },
                        table({ children }) {
                          return (
                            <div className="my-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow">
                              <table className="w-full text-left text-xs sm:text-sm">{children}</table>
                            </div>
                          );
                        },
                        th({ children }) {
                          return <th className="bg-slate-800/80 px-4 py-3 font-semibold text-slate-200 border-b border-slate-700">{children}</th>;
                        },
                        td({ children }) {
                          return <td className="px-4 py-2.5 border-b border-slate-800 text-slate-300">{children}</td>;
                        },
                        hr() {
                          return <hr className="my-8 border-slate-800" />;
                        },
                      }}
                    >
                      {parsedData.markdown}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {activeTab === 'side-by-side' && (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                  {/* Left Column: Original Scanned PDF */}
                  <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-300">
                      <span>Original Archival Scan (PDF)</span>
                      <a
                        href={paper.viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <span>New tab</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex-1 w-full h-full bg-slate-900">
                      <iframe
                        src={paper.viewUrl}
                        title="Archival Scanned PDF"
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>

                  {/* Right Column: Digitized Markdown with LaTeX and SVGs */}
                  <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-slate-900/40">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Parsed Markdown (LaTeX Formulas & SVG Diagrams)</span>
                      </span>
                      <span className="text-slate-400 font-normal text-[11px]">Synchronous View</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeStr = String(children).replace(/\n$/, '');
                            if (match && (match[1] === 'svg' || match[1] === 'xml') && codeStr.includes('<svg')) {
                              return <SvgDiagramRenderer svgContent={codeStr} />;
                            }
                            return (
                              <code className="bg-slate-800/80 text-amber-300 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {parsedData.markdown}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'raw' && (
                <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-950 overflow-hidden font-mono text-xs">
                  <div className="flex items-center justify-between mb-2 text-slate-400">
                    <span>Raw Markdown Source ({parsedData.markdown.length} bytes)</span>
                    <button
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy All'}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={parsedData.markdown}
                    className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-300 font-mono text-xs focus:outline-none resize-none leading-relaxed selection:bg-indigo-600 selection:text-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
