import React from 'react';
import { BookOpen, CheckSquare, GraduationCap, ShieldCheck, Download, Search } from 'lucide-react';

interface HeaderProps {
  onOpenExamGuide: () => void;
  onOpenTracker: () => void;
  practicedCount: number;
  totalCount: number;
  bookmarkedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExamGuide,
  onOpenTracker,
  practicedCount,
  totalCount,
  bookmarkedCount
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Madhyamik Exam Archive
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> 2010–2026 Verified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                West Bengal Board of Secondary Education (WBBSE) • Class 10 Previous Years' Papers
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              onClick={onOpenExamGuide}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="View Subject Syllabus & Marks Pattern"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Exam Pattern Guide</span>
            </button>

            <button
              onClick={onOpenTracker}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer"
              title="Track Your Practice Progress"
            >
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span>Revision Tracker</span>
              {practicedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-blue-600 text-white">
                  {practicedCount}/{totalCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
