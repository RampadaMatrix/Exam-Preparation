import React, { useState } from 'react';
import { X, BookOpen, Clock, CheckCircle2, Award, FileText } from 'lucide-react';
import { Subject } from '../types';
import { SUBJECT_GUIDES } from '../data/examInfo';
import { getSubjectColor } from './PaperCard';

interface ExamGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_SUBJECTS: Subject[] = [
  'Bengali',
  'English',
  'Mathematics',
  'Physical Science',
  'Life Science',
  'History',
  'Geography'
];

export const ExamGuideModal: React.FC<ExamGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');

  if (!isOpen) return null;

  const currentGuide = SUBJECT_GUIDES[selectedSubject];
  const color = getSubjectColor(selectedSubject);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                WBBSE Madhyamik Exam Blueprint & Syllabus Guide
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Official Marks Distribution, Question Structure & Revision Guidelines
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

        {/* Global Exam Blueprint Overview */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-blue-50/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 font-semibold">Total Duration</div>
              <div className="text-sm font-bold text-slate-900">3 Hours 15 Mins</div>
              <div className="text-[11px] text-blue-600">15m reading + 3h writing</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
            <Award className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 font-semibold">Marks Distribution</div>
              <div className="text-sm font-bold text-slate-900">90 Theory + 10 Internal</div>
              <div className="text-[11px] text-emerald-600">Pass marks: 25% aggregate</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
            <FileText className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <div className="text-xs text-slate-500 font-semibold">Question Blueprint</div>
              <div className="text-sm font-bold text-slate-900">MCQ, VSA, SA & LA</div>
              <div className="text-[11px] text-purple-600">Strict internal choice rules</div>
            </div>
          </div>
        </div>

        {/* Subject Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 border-b border-slate-200 overflow-x-auto bg-white no-scrollbar">
          {ALL_SUBJECTS.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Selected Subject Details */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-md ${color.tag}`}>
                {currentGuide.subject}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Theory: <strong className="text-slate-800">{currentGuide.theoryMarks} Marks</strong> | Internal: <strong className="text-slate-800">{currentGuide.internalMarks} Marks</strong>
              </span>
            </div>
          </div>

          {/* Question Paper Pattern */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Question Paper Structure
            </h3>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {currentGuide.questionStructure}
            </div>
          </div>

          {/* Important Chapters & Topics */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-600" />
              High-Yield Chapters & Topics to Prioritize
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentGuide.importantTopics.map((topic, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revision & Preparation Tips */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Scoring Strategy & Exam Day Advice
            </h3>
            <div className="space-y-2">
              {currentGuide.preparationTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs sm:text-sm text-amber-900">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
