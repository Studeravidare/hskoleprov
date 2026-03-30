// ===== Quiz settings defaults =====
export const DEFAULT_NUM_QUESTIONS = 10;
export const DEFAULT_TOTAL_MINUTES = 15;

// Metadata-typ för en kategori
export interface CategoryMeta {
  label: string;
  desc: string;
  color: string;
  light: string;
}

// Kategorier med olika data
export const CATEGORY_META: Record<string, CategoryMeta> = {
  XYZ: {
    label: "Matematik XYZ",
    desc: "Geometri och algebra",
    color: "#035c67",
    light: "#f0f8f8",
  },
  KVA: {
    label: "Kvantitativ jämförelse",
    desc: "Jämför två kvantiteter",
    color: "#6b21a8",
    light: "#faf5ff",
  },
  DTK: {
    label: "Diagram & tabeller",
    desc: "Läsa och tolka data",
    color: "#166534",
    light: "#f0fdf4",
  },
  NOG: {
    label: "Matematisk problemlösning",
    desc: "Räcker informationen?",
    color: "#b45309",
    light: "#fef9f0",
  },
  ORD: {
    label: "Ordkunskap",
    desc: "Svenska ord och begrepp",
    color: "#991b1b",
    light: "#fef2f2",
  },
  LÄS: {
    label: "Läsförståelse",
    desc: "Förstå och analysera texter",
    color: "#0e7490",
    light: "#ecfeff",
  },
  MEK: {
    label: "Meningskomplettering",
    desc: "Välj rätt ord i meningar",
    color: "#9f1239",
    light: "#fdf2f8",
  },
  ELF: {
    label: "English",
    desc: "English language comprehension",
    color: "#374151",
    light: "#f9fafb",
  },
};

// Ta ut svarsalternativen
export function parseOptions(raw: unknown): Option[] {
  // If + try catch för säkerhet
  if (Array.isArray(raw)) return raw as Option[];
  try {
    return JSON.parse(raw as string) as Option[];
  } catch {
    return [];
  }
}

// Funktion för att blanda en array med Fisher-Yates
// Den används för att slumpa frågornas ordning
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Svarsalternativ interface där det kan vara text eller image, alternativen kan vara tomma "?"
export interface Option {
  text?: string;
  image?: string;
}

// Fråga interface, ta in frågan med information
export interface Question {
  id: string;
  category: string;
  question_number: number;
  question_text: string;
  image_url?: string | null;
  material_id?: string | null;
  options: Option[];
  correct_index: number;
  explanation: string;
}

// Material interface, detta är för de "större" frågor där det t.ex. är ett diagram eller lång text
export interface Material {
  id: string;
  title?: string;
  text_content?: string;
  image_urls?: string[] | string | null;
}

// Settings för frågorna. Väljer innan frågan startar
export interface QuizSettings {
  numQuestions: number;
  totalMinutes: number;
}
