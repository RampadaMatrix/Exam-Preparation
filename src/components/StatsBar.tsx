import React from 'react';
import { Files, Calendar, HardDrive, Sparkles, Award } from 'lucide-react';

interface StatsBarProps {
  totalPapers: number;
  compilationCount: number;
  latestCount: number;
  recentCount: number;
  historicalCount: number;
  onSelectCategory: (cat: string) => void;
  activeCategory: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalPapers,
  compilationCount,
  latestCount,
  recentCount,
  historicalCount,
  onSelectCategory,
  activeCategory
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      
      {/* Total Papers */}
      <button
        onClick={() => onSelectCategory('All')}
        className={`p-4 rounded-xl border text-left transition cursor-pointer ${
          activeCategory === 'All'
            ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collection</span>
          <Files className="w-5 h-5 text-blue-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{totalPapers}</span>
          <span className="text-xs text-slate-500">Papers</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">17 Cycles (2010–2026)</p>
      </button>

      {/* Latest Exam Papers (2026) */}
      <button
        onClick={() => onSelectCategory('Madhyamik 2026')}
        className={`p-4 rounded-xl border text-left transition cursor-pointer ${
          activeCategory === 'Madhyamik 2026'
            ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Latest 2026</span>
          <Award className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{latestCount}</span>
          <span className="text-xs text-emerald-600 font-medium">Papers</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">Bengali & English Medium</p>
      </button>

      {/* Recent Papers (2017-2024) */}
      <button
        onClick={() => onSelectCategory('Madhyamik 2017–2024')}
        className={`p-4 rounded-xl border text-left transition cursor-pointer ${
          activeCategory === 'Madhyamik 2017–2024'
            ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">2017–2024</span>
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{recentCount}</span>
          <span className="text-xs text-indigo-600 font-medium">Yearly Papers</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">8 Years × 7 Subjects</p>
      </button>

      {/* Historical Archives */}
      <button
        onClick={() => onSelectCategory('Archives (2010–2016)')}
        className={`p-4 rounded-xl border text-left transition cursor-pointer ${
          activeCategory === 'Archives (2010–2016)'
            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Archives</span>
          <Calendar className="w-5 h-5 text-amber-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{historicalCount}</span>
          <span className="text-xs text-amber-600 font-medium">Papers</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">2010 to 2016 Cycles</p>
      </button>

      {/* Multi-Year Compilations */}
      <button
        onClick={() => onSelectCategory('Compilations (2017–2025)')}
        className={`p-4 rounded-xl border text-left transition cursor-pointer ${
          activeCategory === 'Compilations (2017–2025)'
            ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Compilations</span>
          <Files className="w-5 h-5 text-purple-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{compilationCount}</span>
          <span className="text-xs text-purple-600 font-medium">Master Sets</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">All Subject Booklets</p>
      </button>

    </div>
  );
};
