import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';

interface SvgDiagramRendererProps {
  svgContent: string;
  title?: string;
  caption?: string;
}

export const SvgDiagramRenderer: React.FC<SvgDiagramRendererProps> = ({
  svgContent,
  title = 'Examination Technical & Geometric Diagram',
  caption,
}) => {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Clean and sanitize SVG content for direct insertion
  const sanitizedSvg = svgContent
    .replace(/^```(?:svg|xml)?/i, '')
    .replace(/```$/, '')
    .trim();

  return (
    <div
      id="svg-diagram-card"
      className={`my-6 rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-xl overflow-hidden transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-4 z-50 flex flex-col bg-slate-950 border-amber-500/50 shadow-2xl'
          : 'relative'
      }`}
      ref={containerRef}
    >
      {/* Top Diagram Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-300">
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="btn-diagram-zoom-out"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-slate-400 font-mono px-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            id="btn-diagram-zoom-in"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="btn-diagram-reset-zoom"
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1"></div>
          <button
            id="btn-diagram-copy-svg"
            onClick={handleCopySvg}
            title="Copy SVG Code"
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            id="btn-diagram-download-svg"
            onClick={handleDownloadSvg}
            title="Download SVG"
            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            id="btn-diagram-fullscreen"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div
        className={`flex items-center justify-center p-6 bg-slate-950/60 overflow-auto min-h-[220px] ${
          isFullscreen ? 'flex-1 min-h-0' : 'max-h-[500px]'
        }`}
      >
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="transition-transform duration-150 inline-block w-full max-w-xl text-slate-100 [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[420px] [&>svg]:drop-shadow-md [&>svg_text]:fill-slate-100 [&>svg_path]:stroke-slate-200 [&>svg_line]:stroke-slate-200 [&>svg_circle]:stroke-slate-200 [&>svg_rect]:stroke-slate-200"
          dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />
      </div>

      {/* Caption footer */}
      {caption && (
        <div className="border-t border-slate-800/80 bg-slate-900/60 px-4 py-2 text-xs text-slate-400 italic">
          {caption}
        </div>
      )}
    </div>
  );
};
