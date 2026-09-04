import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Maximize2, Minimize2, Bookmark, CheckCircle2, Info, BookOpen, AlertCircle } from 'lucide-react';
import { QuestionPaper, PaperProgress } from '../types';
import { SUBJECT_GUIDES } from '../data/examInfo';
import { getSubjectColor } from './PaperCard';

interface PdfViewerModalProps {
  paper: QuestionPaper | null;
  progress?: PaperProgress;
  onClose: () => void;
  onToggleBookmark: (paperId: string) => void;
  onTogglePracticed: (paperId: string) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  paper,
  progress,
  onClose,
  onToggleBookmark,
  onTogglePracticed
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubjectTips, setShowSubjectTips] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  if (!paper) return null;

  const isBookmarked = progress?.isBookmarked;
  const isPracticed = progress?.status === 'completed';
  const color = getSubjectColor(paper.subject);
  const guide = SUBJECT_GUIDES[paper.subject];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs transition-opacity animate-in fade-in">
      
      <div className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 transition-all duration-300 ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[92vh]'
      }`}>
        
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          
          {/* Paper Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md shrink-0 ${color.tag}`}>
              {paper.subject}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {paper.title}
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate">
                {paper.year} • {paper.medium} • {paper.pattern} ({paper.sizeString})
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Toggle Study Tips for Subject */}
            {guide && (
              <button
                onClick={() => setShowSubjectTips(!showSubjectTips)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  showSubjectTips
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Toggle Subject Syllabus & Question Pattern Notes"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Syllabus Insights</span>
              </button>
            )}

            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark(paper.id)}
              className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer ${
                isBookmarked ? 'text-amber-500 bg-amber-50' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Paper'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>

            {/* Practiced button */}
            <button
              onClick={() => onTogglePracticed(paper.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isPracticed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={isPracticed ? 'Mark as Unsolved' : 'Mark as Practiced / Solved'}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isPracticed ? 'fill-white text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{isPracticed ? 'Solved' : 'Mark Solved'}</span>
            </button>

            {/* Direct Download Button */}
            <a
              href={paper.downloadUrl}
              download={paper.filename}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Download PDF to Computer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Download</span>
            </a>

            {/* External Tab */}
            <a
              href={paper.viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              title="Open full PDF in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer hidden sm:inline-flex"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer ml-1"
              title="Close viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Modal Body: Subject Insights Sidebar + PDF Viewer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-slate-100">
          
          {/* Collapsible Subject Tips Drawer */}
          {showSubjectTips && guide && (
            <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 overflow-y-auto shrink-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  {paper.subject} Exam Blueprint
                </h3>
                <button
                  onClick={() => setShowSubjectTips(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer md:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-3 text-slate-600">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800">Total Marks: 100</div>
                  <div>• Written Theory: <span className="font-bold text-blue-600">{guide.theoryMarks} Marks</span></div>
                  <div>• Internal Formative: <span className="font-bold text-slate-700">{guide.internalMarks} Marks</span></div>
                  <div>• Exam Duration: <span className="font-bold text-slate-700">{guide.timeLimit}</span></div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-1.5">Question Paper Pattern:</h4>
                  <p className="leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {guide.questionStructure}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-1.5">High-Weightage Chapters:</h4>
                  <ul className="space-y-1 pl-1">
                    {guide.importantTopics.map((topic, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-1.5">Preparation Strategy:</h4>
                  <ul className="space-y-1.5 pl-1">
                    {guide.preparationTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-700 bg-amber-50/70 p-2 rounded border border-amber-200">
                        <span className="text-amber-600 font-bold shrink-0">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actual Embedded PDF Iframe / Object */}
          <div className="flex-1 h-full w-full relative flex flex-col bg-slate-800">
            <iframe
              src={`${paper.viewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full flex-1 border-0"
              title={paper.title}
            />

            {/* Quick helper fallback bottom bar */}
            <div className="bg-slate-900 text-slate-400 text-xs px-4 py-2 flex items-center justify-between border-t border-slate-700 shrink-0">
              <span className="flex items-center gap-1.5 truncate">
                <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Viewing {paper.filename} ({paper.sizeString})</span>
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={paper.viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-1"
                >
                  Open in separate tab <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
