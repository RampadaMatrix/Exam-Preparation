import React from 'react';
import { Search, X, LayoutGrid, List, Filter, Bookmark, CheckCircle2 } from 'lucide-react';
import { Subject, PaperCategory } from '../types';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedMedium: string;
  setSelectedMedium: (medium: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  showBookmarkedOnly: boolean;
  setShowBookmarkedOnly: (val: boolean) => void;
  showPracticedOnly: boolean;
  setShowPracticedOnly: (val: boolean) => void;
  availableYears: string[];
  totalResults: number;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const SUBJECTS: Subject[] = [
  'Bengali',
  'English',
  'Mathematics',
  'Physical Science',
  'Life Science',
  'History',
  'Geography'
];

const CATEGORIES: string[] = [
  'All',
  'Madhyamik 2026',
  'Madhyamik 2025',
  'Madhyamik 2017–2024',
  'Archives (2010–2016)',
  'Compilations (2017–2025)',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSubject,
  setSelectedSubject,
  selectedYear,
  setSelectedYear,
  selectedMedium,
  setSelectedMedium,
  viewMode,
  setViewMode,
  showBookmarkedOnly,
  setShowBookmarkedOnly,
  showPracticedOnly,
  setShowPracticedOnly,
  availableYears,
  totalResults,
  onResetFilters,
  hasActiveFilters
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-xs space-y-4">
      
      {/* Top Search & Primary Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by subject, year (e.g. 2026, Bengali, Math)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls: Year, Medium & View Mode */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
          
          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          {/* Medium Dropdown */}
          <select
            value={selectedMedium}
            onChange={(e) => setSelectedMedium(e.target.value)}
            className="text-xs sm:text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Mediums</option>
            <option value="Bengali">Bengali Medium</option>
            <option value="English">English Medium</option>
          </select>

          {/* Bookmark filter toggle */}
          <button
            onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showBookmarkedOnly
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Show Bookmarked Papers"
          >
            <Bookmark className={`w-3.5 h-3.5 ${showBookmarkedOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden sm:inline">Saved</span>
          </button>

          {/* Practiced filter toggle */}
          <button
            onClick={() => setShowPracticedOnly(!showPracticedOnly)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showPracticedOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Show Completed/Practiced Papers"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${showPracticedOnly ? 'fill-emerald-500 text-white' : ''}`} />
            <span className="hidden sm:inline">Solved</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 sm:p-2 transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 sm:p-2 transition cursor-pointer ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs sm:text-sm font-medium no-scrollbar">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline shrink-0">
          Cycle:
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs sm:text-sm font-medium no-scrollbar">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline shrink-0">
          Subject:
        </span>
        <button
          onClick={() => setSelectedSubject('All')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap transition cursor-pointer shrink-0 ${
            selectedSubject === 'All'
              ? 'bg-slate-900 text-white font-semibold'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          All Subjects
        </button>
        {SUBJECTS.map((sub) => (
          <button
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition cursor-pointer shrink-0 ${
              selectedSubject === sub
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Results Count & Clear Filters */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>
          Showing <strong className="text-slate-800 font-semibold">{totalResults}</strong> question paper{totalResults === 1 ? '' : 's'}
        </span>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            <X className="w-3 h-3" /> Clear all filters
          </button>
        )}
      </div>

    </div>
  );
};
