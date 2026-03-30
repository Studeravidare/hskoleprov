import { useState, useEffect, useRef } from "react";
import supabase from "../supabaseClient";
import {
  DEFAULT_NUM_QUESTIONS,
  DEFAULT_TOTAL_MINUTES,
  parseOptions,
  shuffle,
  Question,
  Material,
  QuizSettings,
} from "../constants";

// De olika delar av sidan
// Select = Val innan quiz, välj frågetyp, kategorier, antal frågor och tid
// Quiz = Frågedelen, visar frågor och svarsalternativ
// Results = Visar resultat av Quiz
type Screen = "select" | "quiz" | "results";

// Typer av frågor
// Individual är individuella frågor (En fråga/Bild med ett svar till)
// Group är text + bilder med flera frågor kopplad till material. (Exempel är diagram med 3 frågor)
type Mode = "individual" | "group" | null;

// Typ för antal kategorier (t.ex. { "XYZ": 45, "KVA": 30 })
type CategoryCounts = Record<string, number>;

// Antal kategorier per läge
interface AllCategories {
  individual: CategoryCounts; // Frågor utan material
  group: CategoryCounts; // Frågor med material
}

// Resultat från att hämta frågor från databasen
interface FetchResult {
  questions: Question[]; // Alla frågor
  materialsMap: Record<string, Material>; // Material-lookup via ID
}

// All state och funktioner som quiz-komponenter behöver
export interface QuizState {
  screen: Screen; // Vilken skärm som visas
  setScreen: (s: Screen) => void; // Byt screen
  mode: Mode; // Valt läge
  setMode: (m: Mode) => void; // Byt läge
  selectedCats: string[]; // Valda kategorier (t.ex. ["XYZ", "KVA"])
  toggleCat: (cat: string) => void; // Växla kategori på/av
  setSelectedCats: (cats: string[]) => void; // Ändra sparade kategorier
  allCategories: AllCategories; // Alla tillgängliga kategorier
  loadingCats: boolean; // Laddas kategorier?
  questions: Question[]; // Alla frågor i quizet
  materialsMap: Record<string, Material>; // Material kopplade till frågor
  current: number; // Index för nuvarande fråga
  chosen: number | null; // Valt svarsalternativ (0=A, 1=B, null=inget val)
  results: boolean[]; // Resultat per fråga (true=rätt, false=fel)
  userAnswers: (number | null)[]; // Vad användaren svarade på varje fråga
  timer: number; // Återstående sekunder för hela quizet
  totalSeconds: number; // Total tid i sekunder
  settings: QuizSettings; // Nuvarande inställningar
  setSettings: (s: QuizSettings) => void; // Byt inställningar
  startQuiz: () => Promise<void>; // Starta nytt quiz
  handleAnswer: (idx: number) => void; // Användaren väljer svar
  handleNext: () => void; // Gå till nästa fråga
  restartQuiz: () => void; // Kör om quizet (blandar frågor)
}

export default function useQuiz(): QuizState {
  // State för vilken skärm som visas
  const [screen, setScreen] = useState<Screen>("select");

  // State för vilket läge som valts
  const [mode, setMode] = useState<Mode>(null);

  // State för valda kategorier
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  // State för alla tillgängliga kategorier
  const [allCategories, setAllCategories] = useState<AllCategories>({
    individual: {},
    group: {},
  });

  // State för om kategorier laddas från databasen
  const [loadingCats, setLoadingCats] = useState<boolean>(true);

  // State för quiz-frågor och material
  const [questions, setQuestions] = useState<Question[]>([]);
  const [materialsMap, setMaterialsMap] = useState<Record<string, Material>>(
    {},
  );

  // State för nuvarande fråga och användarens val
  const [current, setCurrent] = useState<number>(0);
  const [chosen, setChosen] = useState<number | null>(null);

  // State för resultat
  const [results, setResults] = useState<boolean[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);

  // State för global timer (hela quizet)
  const [timer, setTimer] = useState<number>(DEFAULT_TOTAL_MINUTES * 60);
  const [totalSeconds, setTotalSeconds] = useState<number>(
    DEFAULT_TOTAL_MINUTES * 60,
  );

  // State för quiz-inställningar
  const [settings, setSettings] = useState<QuizSettings>({
    numQuestions: DEFAULT_NUM_QUESTIONS,
    totalMinutes: DEFAULT_TOTAL_MINUTES,
  });

  // Ref för timer-intervallet (så vi kan stoppa det)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hämtar antal frågor per kategori från databasen
  useEffect(() => {
    async function loadCategories() {
      // Hämta frågor parallellt: individuella (utan material) och grupp (med material)
      const [{ data: indData }, { data: grpData }] = await Promise.all([
        supabase.from("questions").select("category").is("material_id", null),
        supabase
          .from("questions")
          .select("category")
          .not("material_id", "is", null),
      ]);

      // Konvertera till objekt med antal per kategori
      const toMap = (rows: { category: string }[] | null): CategoryCounts => {
        const m: CategoryCounts = {};
        (rows ?? []).forEach(({ category }) => {
          m[category] = (m[category] ?? 0) + 1;
        });
        return m;
      };

      setAllCategories({ individual: toMap(indData), group: toMap(grpData) });
      setLoadingCats(false);
    }
    loadCategories();
  }, []);

  // Global nedräkning - körs medan quiz-skärmen visas
  useEffect(() => {
    // Stoppa timer om vi inte är på quiz-skärmen
    if (screen !== "quiz") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Starta intervall som tickar varje sekund
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          // Tiden är ute - stoppa timer och avsluta quiz
          if (timerRef.current) clearInterval(timerRef.current);
          finishOnTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Cleanup - stoppa timer när komponenten unmountas
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Anropas när tiden tar slut
  function finishOnTimeout() {
    setResults((prev) => {
      setQuestions((qs) => {
        // Räkna hur många obesvarade frågor som finns kvar
        const missing = qs.length - prev.length;

        // Markera alla obesvarade frågor som fel
        const filled = [...prev, ...Array(missing).fill(false)];

        // Fyll userAnswers med null för obesvarade frågor
        setUserAnswers((ua) => [...ua, ...Array(missing).fill(null)]);

        // Gå till resultatskärmen (setTimeout undviker setState-in-setState)
        setTimeout(() => setScreen("results"), 0);
        return qs;
      });
      return prev;
    });
  }

  // Hämtar frågor från databasen baserat på valda kategorier
  async function fetchQuestions(categories: string[]): Promise<FetchResult> {
    const { numQuestions } = settings;

    if (mode === "individual") {
      // Individuellt läge: Hämta frågor utan material
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .in("category", categories)
        .is("material_id", null);

      if (error) {
        console.error(error);
        return { questions: [], materialsMap: {} };
      }

      // Blanda frågorna och ta bara det antal som valts
      const shuffled = shuffle(
        (data ?? []).map((q) => ({ ...q, options: parseOptions(q.options) })),
      );
      return { questions: shuffled.slice(0, numQuestions), materialsMap: {} };
    } else {
      // Gruppläge: Hämta hela material-grupper
      const { data: selected, error } = await supabase
        .from("questions")
        .select("*")
        .in("category", categories)
        .not("material_id", "is", null);

      if (error) {
        console.error(error);
        return { questions: [], materialsMap: {} };
      }

      // Hitta alla unika material-ID:n
      const materialIds = [
        ...new Set((selected ?? []).map((q) => q.material_id as string)),
      ];

      // Hämta alla frågor för dessa material
      const { data: allMaterialQs } = await supabase
        .from("questions")
        .select("*")
        .in("material_id", materialIds);

      // Hämta själva materialen (texter, bilder, etc.)
      const { data: materials } = await supabase
        .from("materials")
        .select("*")
        .in("id", materialIds);

      // Bygg lookup-objekt för material
      const mMap: Record<string, Material> = {};
      if (materials)
        materials.forEach((m: Material) => {
          mMap[m.id] = m;
        });

      // Gruppera frågor per material och sortera efter frågenummer
      const groups: Record<string, Question[]> = {};
      (allMaterialQs ?? []).forEach((q) => {
        if (!groups[q.material_id]) groups[q.material_id] = [];
        groups[q.material_id].push({ ...q, options: parseOptions(q.options) });
      });

      // Sortera frågorna inom varje grupp
      Object.values(groups).forEach((g) =>
        g.sort((a, b) => a.question_number - b.question_number),
      );

      // Blanda gruppernas ordning och plocka hela grupper tills vi når numQuestions
      const shuffledGroups = shuffle(Object.values(groups));
      const picked: Question[] = [];
      for (const group of shuffledGroups) {
        if (picked.length >= numQuestions) break;
        picked.push(...group); // Lägg till hela gruppen
      }

      return { questions: picked, materialsMap: mMap };
    }
  }

  // Startar ett nytt quiz
  async function startQuiz(): Promise<void> {
    const secs = settings.totalMinutes * 60;
    const { questions: qs, materialsMap: mMap } =
      await fetchQuestions(selectedCats);

    // Sätt quiz-state
    setMaterialsMap(mMap);
    setQuestions(qs);
    setCurrent(0);
    setChosen(null);
    setResults([]);
    setUserAnswers([]);
    setTotalSeconds(secs);
    setTimer(secs);
    setScreen("quiz");
  }

  // Hanterar när användaren väljer ett svar
  function handleAnswer(idx: number): void {
    setChosen(idx);
  }

  // Hanterar när användaren går vidare till nästa fråga
  function handleNext(): void {
    const q = questions[current];
    const correct = chosen === q.correct_index;
    const newResults = [...results, correct];
    const newUserAnswers = [...userAnswers, chosen];

    if (current + 1 >= questions.length) {
      // Sista frågan - gå till resultatskärmen
      if (timerRef.current) clearInterval(timerRef.current);
      setResults(newResults);
      setUserAnswers(newUserAnswers);
      setScreen("results");
    } else {
      // Fler frågor kvar - gå till nästa
      setResults(newResults);
      setUserAnswers(newUserAnswers);
      setCurrent((c) => c + 1);
      setChosen(null);
    }
  }

  // Växlar en kategori på/av i listan
  function toggleCat(cat: string): void {
    setSelectedCats((s) =>
      s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat],
    );
  }

  // Kör om quizet med samma frågor (men i ny ordning)
  function restartQuiz(): void {
    const secs = settings.totalMinutes * 60;
    setCurrent(0);
    setChosen(null);
    setResults([]);
    setUserAnswers([]);
    setTotalSeconds(secs);
    setTimer(secs);
    setQuestions((qs) => shuffle(qs)); // Blanda frågorna
    setScreen("quiz");
  }

  // Returnera allt state och alla funktioner
  return {
    screen,
    setScreen,
    mode,
    setMode,
    selectedCats,
    toggleCat,
    setSelectedCats,
    allCategories,
    loadingCats,
    questions,
    materialsMap,
    current,
    chosen,
    results,
    userAnswers,
    timer,
    totalSeconds,
    settings,
    setSettings,
    startQuiz,
    handleAnswer,
    handleNext,
    restartQuiz,
  };
}
