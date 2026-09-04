import React, { useState } from 'react';
import { X, CheckSquare, Bookmark, Play, RotateCcw, Trash2, Award, FileText, CheckCircle2 } from 'lucide-react';
import { QuestionPaper, PaperProgress } from '../types';

interface StudyTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: QuestionPaper[];
  progressMap: Record<string, PaperProgress>;
  onToggleBookmark: (paperId: string) => void;
  onTogglePracticed: (paperId: string) => void;
  onClearAllProgress: () => void;
  onViewPaper: (paper: QuestionPaper) => void;
}

export const StudyTrackerModal: React.FC<StudyTrackerModalProps> = ({
  isOpen,
  onClose,
  papers,
  progressMap,
  onToggleBookmark,
  onTogglePracticed,
  onClearAllProgress,
  onViewPaper
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'timer'>('progress');

  // Exam Practice Timer state (3 hours 15 minutes = 195 minutes = 11700 seconds)
  const [timerSeconds, setTimerSeconds] = useState(195 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  if (!isOpen) return null;

  const practicedPapers = papers.filter((p) => progressMap[p.id]?.status === 'completed');
  const bookmarkedPapers = papers.filter((p) => progressMap[p.id]?.isBookmarked);
  const totalCount = papers.length;
  const completedPercent = Math.round((practicedPapers.length / totalCount) * 100);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Personal Revision & Practice Tracker
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Track solved question papers and practice timed mock tests
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold border-b-2 text-center transition cursor-pointer ${
              activeTab === 'progress'
                ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Solved Papers ({practicedPapers.length}) & Bookmarks ({bookmarkedPapers.length})
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold border-b-2 text-center transition cursor-pointer ${
              activeTab === 'timer'
                ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Timed Mock Exam Timer (3h 15m)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {activeTab === 'progress' ? (
            <>
              {/* Overall Progress meter */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" />
                    Preparation Completion Status
                  </span>
                  <span className="text-blue-600 font-bold">
                    {practicedPapers.length} / {totalCount} Solved ({completedPercent}%)
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${completedPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Keep practicing full-length papers under timed conditions.</span>
                  {practicedPapers.length > 0 && (
                    <button
                      onClick={onClearAllProgress}
                      className="text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Reset Tracker
                    </button>
                  )}
                </div>
              </div>

              {/* Bookmarked Papers Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Bookmarked for Fast Revision ({bookmarkedPapers.length})
                  </h3>
                </div>

                {bookmarkedPapers.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                    No bookmarked papers yet. Click the bookmark icon on any paper to save it here.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {bookmarkedPapers.map((paper) => (
                      <div
                        key={paper.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-semibold text-slate-800 truncate">{paper.title}</div>
                          <div className="text-slate-400">{paper.year} • {paper.sizeString}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onClose();
                              onViewPaper(paper);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium cursor-pointer"
                          >
                            Solve
                          </button>
                          <button
                            onClick={() => onToggleBookmark(paper.id)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                            title="Remove bookmark"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Solved Papers Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-600 text-white" />
                    Completed & Practiced Papers ({practicedPapers.length})
                  </h3>
                </div>

                {practicedPapers.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                    No papers marked as practiced yet. As you solve questions, mark them solved to monitor your coverage!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {practicedPapers.map((paper) => (
                      <div
                        key={paper.id}
                        className="flex items-center justify-between p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-200 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-semibold text-slate-800 truncate">{paper.title}</div>
                          <div className="text-slate-500">{paper.year} • {paper.subject}</div>
                        </div>
                        <button
                          onClick={() => onTogglePracticed(paper.id)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                        >
                          Mark Unsolved
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Timer Tab */
            <div className="text-center py-6 space-y-6">
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-slate-900">Official Exam Simulation Timer</h3>
                <p className="text-xs text-slate-500">
                  Standard WBBSE Madhyamik duration is 3 Hours and 15 Minutes (15 minutes question paper reading time + 3 hours writing).
                </p>
              </div>

              {/* Huge Timer Display */}
              <div className="font-mono text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-wider bg-slate-100 py-6 px-4 rounded-2xl border border-slate-200 max-w-sm mx-auto shadow-inner">
                {formatTimer(timerSeconds)}
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition cursor-pointer shadow-md ${
                    isTimerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isTimerRunning ? 'Pause Timer' : 'Start Mock Exam'}
                </button>

                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(195 * 60);
                  }}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>

              <div className="text-xs text-slate-400">
                Tip: Choose any question paper from the archive, set your mock exam timer, and practice writing on physical answer sheets without distractions.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
