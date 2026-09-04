export type Subject =
  | 'Bengali'
  | 'English'
  | 'Mathematics'
  | 'Physical Science'
  | 'Life Science'
  | 'History'
  | 'Geography';

export type PaperCategory =
  | 'Compilations (2017–2025)'
  | 'Madhyamik 2026'
  | 'Madhyamik 2025'
  | 'Archives (2010–2016)';

export type Medium = 'Bengali' | 'English' | 'Both / Standard';

export interface QuestionPaper {
  id: string;
  title: string;
  subject: Subject;
  year: string; // e.g. '2026', '2025', '2017–2025', '2010'
  medium: Medium;
  category: PaperCategory;
  filename: string;
  relativePath: string;
  viewUrl: string;
  downloadUrl: string;
  sizeString: string;
  sizeBytes: number;
  pattern: 'New Syllabus Pattern (90+10)' | 'Old Syllabus Pattern (90 Marks)';
  isCompilation?: boolean;
  isLatest?: boolean;
}

export interface PaperProgress {
  paperId: string;
  status: 'not_started' | 'practicing' | 'completed';
  notes?: string;
  score?: number;
  completedAt?: string;
  isBookmarked?: boolean;
}

export interface ParsedDiagram {
  id: string;
  title: string;
  svg: string;
  caption?: string;
}

export interface ParsedPaperData {
  paperId: string;
  title: string;
  year: string;
  subject: Subject;
  medium: Medium;
  category: PaperCategory;
  markdown: string;
  diagrams?: ParsedDiagram[];
  isParsed: boolean;
  pageCount?: number;
  lastParsedAt?: string;
}
