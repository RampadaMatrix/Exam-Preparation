import React from 'react';
import { Eye, Download, ExternalLink, Bookmark, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { QuestionPaper, PaperProgress } from '../types';
import { getSubjectColor } from './PaperCard';

interface PaperListRowProps {
  paper: QuestionPaper;
  progress?: PaperProgress;
  isParsed?: boolean;
  diagramsCount?: number;
  onView: (paper: QuestionPaper) => void;
  onViewMarkdown: (paper: QuestionPaper) => void;
  onToggleBookmark: (paperId: string) => void;
  onTogglePracticed: (paperId: string) => void;
}

export const PaperListRow: React.FC<PaperListRowProps> = ({
  paper,
  progress,
  isParsed,
  diagramsCount,
  onView,
  onViewMarkdown,
  onToggleBookmark,
  onTogglePracticed
}) => {
  const isBookmarked = progress?.isBookmarked;
  const isPracticed = progress?.status === 'completed';
  const color = getSubjectColor(paper.subject);

  return (
    <div className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
      isPracticed
        ? 'border-emerald-200 bg-emerald-50/20'
        : 'border-slate-200 hover:border-slate-300 bg-white'
    }`}>
      
      {/* Left Subject & Title info */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        
        {/* Practice status icon button */}
        <button
          onClick={() => onTogglePracticed(paper.id)}
          className="mt-0.5 sm:mt-0 text-slate-400 hover:text-emerald-600 transition cursor-pointer shrink-0"
          title={isPracticed ? 'Mark as Unsolved' : 'Mark as Practiced / Solved'}
        >
          <CheckCircle2 className={`w-5 h-5 ${isPracticed ? 'fill-emerald-600 text-white' : ''}`} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${color.tag}`}>
              {paper.subject}
            </span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {paper.year}
            </span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {paper.medium}
            </span>
            {isParsed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>AI Parsed {diagramsCount ? `(${diagramsCount} SVGs)` : ''}</span>
              </span>
            )}
            {paper.isLatest && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Latest
              </span>
            )}
            {paper.isCompilation && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Compilation
              </span>
            )}
          </div>
          <h4 className="font-semibold text-slate-900 text-sm truncate">
            {paper.title}
          </h4>
        </div>
      </div>

      {/* Right Metadata & Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-center shrink-0">
        <span className="text-xs font-medium text-slate-400 hidden md:inline mr-1">
          {paper.sizeString}
        </span>

        <button
          onClick={() => onToggleBookmark(paper.id)}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isBookmarked ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'
          }`}
          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Paper'}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
        </button>

        <button
          onClick={() => onViewMarkdown(paper)}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer shadow-sm shadow-indigo-100"
          title="Read digitized paper with LaTeX & interactive SVG diagrams"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
          <span>{isParsed ? 'Read Parsed' : 'Digitize'}</span>
        </button>

        <button
          onClick={() => onView(paper)}
          className="inline-flex items-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
          title="View original PDF"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>PDF</span>
        </button>

        <a
          href={paper.downloadUrl}
          download={paper.filename}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
        </a>

        <a
          href={paper.viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

    </div>
  );
};
