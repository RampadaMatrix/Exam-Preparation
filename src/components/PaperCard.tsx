import React from 'react';
import { Eye, Download, ExternalLink, Bookmark, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { QuestionPaper, PaperProgress } from '../types';

interface PaperCardProps {
  paper: QuestionPaper;
  progress?: PaperProgress;
  isParsed?: boolean;
  diagramsCount?: number;
  onView: (paper: QuestionPaper) => void;
  onViewMarkdown: (paper: QuestionPaper) => void;
  onToggleBookmark: (paperId: string) => void;
  onTogglePracticed: (paperId: string) => void;
}

export const getSubjectColor = (subject: string) => {
  switch (subject) {
    case 'Bengali':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', tag: 'bg-rose-100 text-rose-800' };
    case 'English':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', tag: 'bg-indigo-100 text-indigo-800' };
    case 'Mathematics':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', tag: 'bg-blue-100 text-blue-800' };
    case 'Physical Science':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', tag: 'bg-amber-100 text-amber-800' };
    case 'Life Science':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', tag: 'bg-emerald-100 text-emerald-800' };
    case 'History':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', tag: 'bg-purple-100 text-purple-800' };
    case 'Geography':
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', tag: 'bg-teal-100 text-teal-800' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', tag: 'bg-slate-100 text-slate-800' };
  }
};

export const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  progress,
  isParsed,
  diagramsCount,
  onView,
  onViewMarkdown,
  onToggleBookmark,
  onTogglePracticed,
}) => {
  const isBookmarked = progress?.isBookmarked;
  const isPracticed = progress?.status === 'completed';
  const color = getSubjectColor(paper.subject);

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
      isPracticed
        ? 'border-emerald-200 bg-emerald-50/15'
        : 'border-slate-200 hover:border-slate-300'
    }`}>
      
      {/* Top Header info */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${color.tag}`}>
              {paper.subject}
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

          {/* Bookmark & Practice toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleBookmark(paper.id)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isBookmarked
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Paper'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>

            <button
              onClick={() => onTogglePracticed(paper.id)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isPracticed
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isPracticed ? 'Mark as Unsolved' : 'Mark as Practiced / Solved'}
            >
              <CheckCircle2 className={`w-4 h-4 ${isPracticed ? 'fill-emerald-600 text-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Paper Title */}
        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-2">
          {paper.title}
        </h3>

        {/* Details & Metadata pills */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-2 text-xs text-slate-500 font-medium">
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
            Year: {paper.year}
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
            {paper.medium}
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
            {paper.sizeString}
          </span>
        </div>

        {/* Syllabus pattern badge */}
        <div className="mt-3 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>{paper.pattern}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-100 rounded-b-xl flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewMarkdown(paper)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer shadow-sm shadow-indigo-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>{isParsed ? 'Read Parsed & Diagrams' : 'Digitize / Read Paper'}</span>
          </button>

          <button
            onClick={() => onView(paper)}
            className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="View original PDF in modal"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
          <a
            href={paper.downloadUrl}
            download={paper.filename}
            className="inline-flex items-center gap-1 hover:text-blue-600 transition"
            title="Download PDF"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </a>
          <span>•</span>
          <a
            href={paper.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-blue-600 transition"
            title="Open raw PDF in new tab"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Raw PDF</span>
          </a>
        </div>
      </div>

    </div>
  );
};
