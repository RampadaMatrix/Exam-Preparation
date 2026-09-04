import { Subject } from '../types';

export interface SubjectGuide {
  subject: Subject;
  theoryMarks: number;
  internalMarks: number;
  timeLimit: string;
  questionStructure: string;
  importantTopics: string[];
  preparationTips: string[];
}

export const SUBJECT_GUIDES: Record<Subject, SubjectGuide> = {
  Bengali: {
    subject: 'Bengali',
    theoryMarks: 90,
    internalMarks: 10,
    timeLimit: '3 Hours 15 Minutes',
    questionStructure: 'MCQ (17 marks), VSA (19 marks), SA (3-mark questions), LA (5-mark descriptive), Grammar (16 marks), Composition/Writing (20 marks).',
    importantTopics: [
      'Gyan Chakshu, Bahurupi, Pather Dabi (Stories)',
      'Oikotan, Asukhi Ekjon, Ay Aro Bendhe Bendhe Thaki (Poems)',
      'Koni (Supplementary text - questions carry 10 marks)',
      'Bangla Byakoron (Samas, Karak-Bibhakti, Bakya Poriborton)',
      'Writing: Protibedon (Report), Songlap (Dialogue), Rochona'
    ],
    preparationTips: [
      'Practice writing descriptive answers adhering to word limits.',
      'Solve previous year grammar questions repeatedly to ensure 100% accuracy in objective sections.',
      'Prepare 4-5 contemporary essay topics for the composition section.'
    ]
  },
  English: {
    subject: 'English',
    theoryMarks: 90,
    internalMarks: 10,
    timeLimit: '3 Hours 15 Minutes',
    questionStructure: 'Reading Comprehension Seen (20 marks), Reading Comprehension Unseen (20 marks), Grammar & Vocabulary (20 marks), Writing Skills (30 marks).',
    importantTopics: [
      'Father\'s Help, The Passing Away of Bapu, The Cat (Prose)',
      'Fable, My Own True Family, Sea Fever (Poetry)',
      'Unseen passage comprehension with vocabulary matching (8 marks in vocab)',
      'Grammar: Voice Change, Narration, Phrasal Verbs, Transformation of Sentences',
      'Writing Skills: Letter (Editorial/Personal), Notice, Paragraph, Process Writing, Report'
    ],
    preparationTips: [
      'Focus heavily on the 8 marks vocabulary test in the Unseen passage section.',
      'Master the standard formats for Editorial Letters, School Notices, and Process Writing.',
      'Revise phrasal verbs from previous 10 years papers—frequently repeated!'
    ]
  },
  Mathematics: {
    subject: 'Mathematics',
    theoryMarks: 90,
    internalMarks: 10,
    timeLimit: '3 Hours 15 Minutes',
    questionStructure: 'Arithmetic (10 marks), Algebra (15 marks), Geometry (Theorems 5, Applications 3, Constructions 5 marks), Mensuration (15 marks), Trigonometry (18 marks), Statistics (14 marks).',
    importantTopics: [
      'Arithmetic: Simple & Compound Interest, Partnership Business',
      'Algebra: Quadratic Equations, Ratio & Proportion, Quadratic Surds, Variations',
      'Geometry Theorems: Pythagoras, Circle Theorems, Tangents to a Circle',
      'Trigonometric Ratios, Complementary Angles, Heights and Distances',
      'Mensuration: Sphere, Cone, Cylinder, Combined Solids',
      'Statistics: Mean, Median, Mode, Ogive'
    ],
    preparationTips: [
      'Memorize textbook theorem statements and standard construction steps.',
      'Solve previous 7 years of Heights & Distances and Compound Interest problems.',
      'Do not skip Statistics (Mean, Median, Mode)—it provides easy, scoring 14 marks!'
    ]
  },
  'Physical Science': {
    subject: 'Physical Science',
    theoryMarks: 90,
    internalMarks: 10,
    timeLimit: '3 Hours 15 Minutes',
    questionStructure: 'Group A: 15 MCQs (15 marks); Group B: 21 VSAs (21 marks); Group C: 9 Short questions of 2 marks each (18 marks); Group D: 12 Explanatory/Numerical questions of 3 marks each (36 marks).',
    importantTopics: [
      'Environment: Ozone layer depletion, Greenhouse effect, Behavior of Gases (PV = nRT, Charles & Boyle\'s laws)',
      'Chemical Calculations (Stoichiometry problems)',
      'Thermal Physics: Expansion of solids, liquids, thermal conductivity',
      'Light: Spherical mirrors, refraction through prism/lens, dispersion',
      'Current Electricity: Ohm\'s law, Joule\'s law, Fleming\'s left hand rule, household circuits',
      'Atomic Nucleus & Radioactivity',
      'Chemistry: Periodic Table trends, Chemical Bonding, Electrolysis, Metallurgy, Organic Chemistry (Functional groups, IUPAC nomenclature)'
    ],
    preparationTips: [
      'Practice numerical problems from Behavior of Gases, Current Electricity, and Stoichiometry.',
      'Draw neat ray diagrams for convex and concave lenses.',
      'Remember Periodic Table properties (atomic radius, ionization energy, electronegativity variation across periods and groups).'
    ]
  },
  'Life Science': {
    subject: 'Life Science',
    theoryMarks: 90,
    internalMarks: 10,
    timeLimit: '3 Hours 15 Minutes',
    questionStructure: 'Group A: 15 MCQs (15 marks); Group B: 21 VSAs (21 marks); Group C: 12 Short questions of 2 marks each (24 marks); Group D: 6 Descriptive questions of 5 marks each (30 marks, including compulsory diagram).',
    importantTopics: [
      'Control & Coordination: Plant hormones (Auxin, Gibberellin, Cytokinin), Animal hormones (Thyroid, Pituitary, Adrenal), Human Eye anatomy and Neuron structure',
      'Continuity of Life: Mitosis vs Meiosis, Cell division phases, Sexual vs Asexual reproduction, Pollination',
      'Heredity: Mendel\'s laws (Monohybrid & Dihybrid cross), Sex determination in humans, Genetic diseases (Thalassemia, Hemophilia, Color Blindness)',
      'Evolution & Adaptation: Lamarckism vs Darwinism, Homologous vs Analogous organs, Swim bladder of Rohu fish, Sundari pneumatophores, Honeybee dance',
      'Environment & Biodiversity: Nitrogen cycle, Water & air pollution, In-situ vs Ex-situ conservation, JFM and PBR'
    ],
    preparationTips: [
      'Master the compulsory diagrams: Human Eye, Neuron, Metaphase chromosome, or Reflex Arc.',
      'Practice Mendel’s punnett squares and genetic cross notations carefully.',
      'Learn the steps and flowchart of the Nitrogen Cycle.'
    ]
  },
  History: {
    subject: 'History',
    theoryMarks: 90,
    internalMarks: 10,
    timeLimit: '3 Hours 15 Minutes',
    questionStructure: 'Group A: 20 MCQs (20 marks); Group B: 16 VSAs including map pointing (16 marks); Group C: 11 Short questions of 2 marks each (22 marks); Group D: 6 Analytical questions of 4 marks each (24 marks); Group E: 1 Essay question of 8 marks (8 marks).',
    importantTopics: [
      'Ideas of History: Subaltern history, history of sports, food, and attire',
      'Reform: Brahma Samaj, Vidyasagar and Women\'s Education, Wood\'s Despatch, Young Bengal',
      'Rebellion & Resistance: Santhal Rebellion, Indigo Revolt (Nilbidroho), Munda Rebellion',
      'Early Nationalism: Great Revolt of 1857, Hindu Mela, Bharat Sabha, Anandamath',
      'Alternative Ideas & Science: Calcutta Science College, Visva Bharati, J.C. Bose, P.C. Ray',
      'Working Class & Peasant Movements: Eka Movement, Bardoli Satyagraha, Workers & Peasants Party',
      'Map Pointing: Historical places (Meerut, Jhansi, Dandi, Santhal Pargana, Barasat)'
    ],
    preparationTips: [
      'Practice historical map pointing thoroughly—guaranteed 4 marks!',
      'Prepare chronological timelines for 19th-century peasant and tribal uprisings.',
      'Structure 8-mark answers with an introduction, analytical bullet points, and concluding impact.'
    ]
  },
  Geography: {
    subject: 'Geography',
    theoryMarks: 90,
    internalMarks: 10,
    timeLimit: '3 Hours 15 Minutes',
    questionStructure: 'Group A: 14 MCQs (14 marks); Group B: 22 VSAs (22 marks); Group C: 6 Short questions of 2 marks each (12 marks); Group D: 4 Explanatory questions of 3 marks each (12 marks); Group E: 4 Descriptive questions of 5 marks each (20 marks); Group F: Topographical Map Pointing of India (10 marks).',
    importantTopics: [
      'Exogenetic Processes: Landforms carved by rivers (gorges, ox-bow lake, delta), glaciers (hanging valley, cirque), and wind (yardang, barchan)',
      'Atmosphere: Insolation, heat budget, planetary winds, cyclones vs anticyclones',
      'Hydrosphere: Ocean currents, tides (spring & neap tides)',
      'Waste Management: Concept, 3Rs (Reduce, Reuse, Recycle)',
      'India Physical: Himalayas division, Northern plains, Drainage system (North vs South Indian rivers)',
      'India Economic: Agriculture (Tea, Cotton, Wheat conditions), Iron & Steel and Automobile industries, Population density factors',
      'Satellite Imagery & Topographical Maps: Conventional symbols, False Color Composite (FCC)'
    ],
    preparationTips: [
      'Practice Map Pointing of India with standard symbols (mountains, rivers, mineral belts, ports)—10 full marks!',
      'Draw neat illustrative diagrams for landforms (cirque, waterfall, delta, mushroom rock).',
      'Compare North Indian and South Indian rivers, or Tropical vs Temperate cyclones.'
    ]
  }
};
