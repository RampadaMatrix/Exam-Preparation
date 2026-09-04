import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
import { PaperCard } from './components/PaperCard';
import { PaperListRow } from './components/PaperListRow';
import { PdfViewerModal } from './components/PdfViewerModal';
import { MarkdownViewerModal } from './components/MarkdownViewerModal';
import { ExamGuideModal } from './components/ExamGuideModal';
import { StudyTrackerModal } from './components/StudyTrackerModal';
import { QUESTION_PAPERS } from './data/papers';
import { QuestionPaper, PaperProgress } from './types';
import { FileQuestion, AlertTriangle, ShieldCheck, BookOpen, GraduationCap, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'wbbse_madhyamik_progress_v1';

export const App: React.FC = () => {
  const [papers] = useState<QuestionPaper[]>(QUESTION_PAPERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMedium, setSelectedMedium] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [showPracticedOnly, setShowPracticedOnly] = useState(false);

  // Modals
  const [activePaperForViewer, setActivePaperForViewer] = useState<QuestionPaper | null>(null);
  const [activePaperForMarkdown, setActivePaperForMarkdown] = useState<QuestionPaper | null>(null);
  const [isExamGuideOpen, setIsExamGuideOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [parsedStatusMap, setParsedStatusMap] = useState<Record<string, { isParsed: boolean; diagramsCount: number }>>({});

  // Fetch parsed status map from backend
  const fetchParsedStatus = async () => {
    try {
      const res = await fetch('/api/parsed-status');
      if (res.ok) {
        const data = await res.json();
        setParsedStatusMap(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchParsedStatus();
  }, []);

  // Local storage progress tracking
  const [progressMap, setProgressMap] = useState<Record<string, PaperProgress>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
    } catch (e) {
      console.error('Failed to save study progress:', e);
    }
  }, [progressMap]);

  // Available unique years list (sorted newest first)
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(papers.map((p) => p.year)));
    return years.sort((a, b) => {
      if (a === '2017–2025') return -1;
      if (b === '2017–2025') return 1;
      return b.localeCompare(a);
    });
  }, [papers]);

  // Statistics counts
  const compilationCount = useMemo(() => papers.filter((p) => p.category === 'Compilations (2017–2025)').length, [papers]);
  const latestCount = useMemo(() => papers.filter((p) => p.category === 'Madhyamik 2026').length, [papers]);
  const historicalCount = useMemo(() => papers.filter((p) => p.category === 'Archives (2010–2016)').length, [papers]);

  const practicedCount = useMemo(() => {
    return Object.values(progressMap).filter((p) => p.status === 'completed').length;
  }, [progressMap]);

  const bookmarkedCount = useMemo(() => {
    return Object.values(progressMap).filter((p) => p.isBookmarked).length;
  }, [progressMap]);

  // Filter papers
  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      // Category
      if (selectedCategory !== 'All' && paper.category !== selectedCategory) {
        return false;
      }
      // Subject
      if (selectedSubject !== 'All' && paper.subject !== selectedSubject) {
        return false;
      }
      // Year
      if (selectedYear !== 'All' && paper.year !== selectedYear) {
        return false;
      }
      // Medium
      if (selectedMedium !== 'All') {
        if (selectedMedium === 'Bengali' && !paper.medium.includes('Bengali') && paper.medium !== 'Both / Standard') {
          return false;
        }
        if (selectedMedium === 'English' && !paper.medium.includes('English') && paper.medium !== 'Both / Standard') {
          return false;
        }
      }
      // Bookmarked filter
      if (showBookmarkedOnly && !progressMap[paper.id]?.isBookmarked) {
        return false;
      }
      // Practiced filter
      if (showPracticedOnly && progressMap[paper.id]?.status !== 'completed') {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = paper.title.toLowerCase().includes(query);
        const matchesSubject = paper.subject.toLowerCase().includes(query);
        const matchesYear = paper.year.toLowerCase().includes(query);
        const matchesMedium = paper.medium.toLowerCase().includes(query);
        const matchesCategory = paper.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubject && !matchesYear && !matchesMedium && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [
    papers,
    selectedCategory,
    selectedSubject,
    selectedYear,
    selectedMedium,
    showBookmarkedOnly,
    showPracticedOnly,
    searchQuery,
    progressMap
  ]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All' ||
    selectedSubject !== 'All' ||
    selectedYear !== 'All' ||
    selectedMedium !== 'All' ||
    showBookmarkedOnly ||
    showPracticedOnly;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedSubject('All');
    setSelectedYear('All');
    setSelectedMedium('All');
    setShowBookmarkedOnly(false);
    setShowPracticedOnly(false);
  };

  const handleToggleBookmark = (paperId: string) => {
    setProgressMap((prev) => {
      const current = prev[paperId] || { paperId, status: 'not_started' };
      return {
        ...prev,
        [paperId]: {
          ...current,
          isBookmarked: !current.isBookmarked
        }
      };
    });
  };

  const handleTogglePracticed = (paperId: string) => {
    setProgressMap((prev) => {
      const current = prev[paperId] || { paperId, status: 'not_started' };
      const nextStatus = current.status === 'completed' ? 'not_started' : 'completed';
      return {
        ...prev,
        [paperId]: {
          ...current,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined
        }
      };
    });
  };

  const handleClearAllProgress = () => {
    if (window.confirm('Are you sure you want to reset your practice progress and bookmarks?')) {
      setProgressMap({});
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      
      {/* App Header */}
      <Header
        onOpenExamGuide={() => setIsExamGuideOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
        practicedCount={practicedCount}
        totalCount={papers.length}
        bookmarkedCount={bookmarkedCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Intro notice bar */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-5 sm:p-7 mb-6 sm:mb-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-100 border border-blue-400/30">
              West Bengal Board of Secondary Education (WBBSE)
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Official Madhyamik Question Papers (2010 – 2026)
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Explore 80 verified board examination papers spanning 17 examination cycles. Includes complete 2017–2025 multi-year subject compilations, latest 2026 examination papers in Bengali and English mediums, and historical archives from 2010 to 2016.
            </p>

            {/* Quick launch for digitized papers with vector diagrams */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-blue-200 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Featured AI Digitized Papers:
              </span>
              <button
                onClick={() => {
                  const p = papers.find((item) => item.filename === 'Life_Science_English.pdf');
                  if (p) setActivePaperForMarkdown(p);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition cursor-pointer flex items-center gap-1.5 backdrop-blur-xs"
              >
                <span>🔬 Life Science 2026 (Neuron & Chromosome SVGs)</span>
              </button>
              <button
                onClick={() => {
                  const p = papers.find((item) => item.filename === 'Mathematics_English.pdf');
                  if (p) setActivePaperForMarkdown(p);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition cursor-pointer flex items-center gap-1.5 backdrop-blur-xs"
              >
                <span>📐 Mathematics 2026 (Geometric Circle SVG)</span>
              </button>
              <button
                onClick={() => {
                  const p = papers.find((item) => item.filename === 'Physical_Science_English.pdf');
                  if (p) setActivePaperForMarkdown(p);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition cursor-pointer flex items-center gap-1.5 backdrop-blur-xs"
              >
                <span>⚡ Physical Science 2026 (Optics & Circuits SVGs)</span>
              </button>
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <GraduationCap className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Stats Summary Bar */}
        <StatsBar
          totalPapers={papers.length}
          compilationCount={compilationCount}
          latestCount={latestCount}
          historicalCount={historicalCount}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setSelectedSubject('All');
            setSelectedYear('All');
          }}
          activeCategory={selectedCategory}
        />

        {/* Filters & Search Controls */}
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMedium={selectedMedium}
          setSelectedMedium={setSelectedMedium}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showBookmarkedOnly={showBookmarkedOnly}
          setShowBookmarkedOnly={setShowBookmarkedOnly}
          showPracticedOnly={showPracticedOnly}
          setShowPracticedOnly={setShowPracticedOnly}
          availableYears={availableYears}
          totalResults={filteredPapers.length}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Papers Listing: Grid or List */}
        {filteredPapers.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPapers.map((paper) => {
                const baseId = paper.filename.replace('.pdf', '');
                const status = parsedStatusMap[baseId];
                return (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    progress={progressMap[paper.id]}
                    isParsed={status?.isParsed}
                    diagramsCount={status?.diagramsCount}
                    onView={(p) => setActivePaperForViewer(p)}
                    onViewMarkdown={(p) => setActivePaperForMarkdown(p)}
                    onToggleBookmark={handleToggleBookmark}
                    onTogglePracticed={handleTogglePracticed}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPapers.map((paper) => {
                const baseId = paper.filename.replace('.pdf', '');
                const status = parsedStatusMap[baseId];
                return (
                  <PaperListRow
                    key={paper.id}
                    paper={paper}
                    progress={progressMap[paper.id]}
                    isParsed={status?.isParsed}
                    diagramsCount={status?.diagramsCount}
                    onView={(p) => setActivePaperForViewer(p)}
                    onViewMarkdown={(p) => setActivePaperForMarkdown(p)}
                    onToggleBookmark={handleToggleBookmark}
                    onTogglePracticed={handleTogglePracticed}
                  />
                );
              })}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
            <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No question papers match your filters</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, selecting "All Subjects", or resetting applied filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Archive verified: 80 Authentic WBBSE Madhyamik PDFs (~251 MB)</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsExamGuideOpen(true)}
              className="hover:text-blue-600 font-medium transition cursor-pointer"
            >
              Exam Pattern Guide
            </button>
            <button
              onClick={() => setIsTrackerOpen(true)}
              className="hover:text-blue-600 font-medium transition cursor-pointer"
            >
              Practice Tracker
            </button>
            <span>•</span>
            <span>Class 10 Board Exam Preparation</span>
          </div>
        </div>
      </footer>

      {/* Digitized Markdown & Interactive SVG Diagrams Modal */}
      {activePaperForMarkdown && (
        <MarkdownViewerModal
          paper={activePaperForMarkdown}
          onClose={() => {
            setActivePaperForMarkdown(null);
            fetchParsedStatus();
          }}
        />
      )}

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        paper={activePaperForViewer}
        progress={activePaperForViewer ? progressMap[activePaperForViewer.id] : undefined}
        onClose={() => setActivePaperForViewer(null)}
        onToggleBookmark={handleToggleBookmark}
        onTogglePracticed={handleTogglePracticed}
      />

      {/* Exam Pattern & Syllabus Guide Modal */}
      <ExamGuideModal
        isOpen={isExamGuideOpen}
        onClose={() => setIsExamGuideOpen(false)}
      />

      {/* Revision Tracker Modal */}
      <StudyTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        papers={papers}
        progressMap={progressMap}
        onToggleBookmark={handleToggleBookmark}
        onTogglePracticed={handleTogglePracticed}
        onClearAllProgress={handleClearAllProgress}
        onViewPaper={(p) => setActivePaperForViewer(p)}
      />

    </div>
  );
};

export default App;
