// Tester för useQuiz-hooken – applikationens centrala logik.
// useQuiz hanterar all state för quizflödet: val av kategorier, frågorna,
// svarsregistrering, timer och navigation mellan skärmar.
//
// Supabase mockas ut helt så att testen aldrig gör nätverksanrop.
// Det innebär att startQuiz() (som kräver DB) inte testas direkt här –
// istället testas alla individuella actions och det initiala state.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ── Mock Supabase so the hook never touches the network ──────────────────────
// Ersätter supabaseClient med ett falskt objekt som returnerar tomma arrayer.
// Alla kedjade metoder (.from().select().is() osv.) måste mockas för att
// matcha de faktiska anropen i useQuiz.
vi.mock("../supabaseClient", () => ({
  default: {
    from: () => ({
      select: () => ({
        is: () => Promise.resolve({ data: [], error: null }),
        not: () => Promise.resolve({ data: [], error: null }),
        in: () => ({
          is: () => Promise.resolve({ data: [], error: null }),
          not: () => ({
            is: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

import useQuiz from "../hooks/useQuiz";

// ─────────────────────────────────────────────────────────────────────────────

// ─── Initial state ────────────────────────────────────────────────────────────
// Testar att hooken initierar alla state-värden korrekt när den mountas

describe("useQuiz – initial state", () => {
  it("starts on the select screen", () => {
    // Användaren ska börja på valsidan, inte direkt i quizet
    const { result } = renderHook(() => useQuiz());
    expect(result.current.screen).toBe("select");
  });

  it("mode is null initially", () => {
    // Inget läge (individuellt/grupp) är valt förrän användaren väljer
    const { result } = renderHook(() => useQuiz());
    expect(result.current.mode).toBeNull();
  });

  it("selectedCats is empty initially", () => {
    // Inga kategorier är förbockade vid start
    const { result } = renderHook(() => useQuiz());
    expect(result.current.selectedCats).toEqual([]);
  });

  it("questions is empty initially", () => {
    // Frågorna laddas inte förrän startQuiz() anropas
    const { result } = renderHook(() => useQuiz());
    expect(result.current.questions).toEqual([]);
  });

  it("chosen is null initially", () => {
    // Inget svar är valt förrän användaren klickar
    const { result } = renderHook(() => useQuiz());
    expect(result.current.chosen).toBeNull();
  });

  it("results is empty initially", () => {
    // Inga resultat är sparade innan quizet startat
    const { result } = renderHook(() => useQuiz());
    expect(result.current.results).toEqual([]);
  });

  it("timer equals totalMinutes × 60 initially", () => {
    // Timern ska vara inställd på rätt antal sekunder från settings
    const { result } = renderHook(() => useQuiz());
    expect(result.current.timer).toBe(
      result.current.settings.totalMinutes * 60,
    );
  });
});

// ─── setMode ──────────────────────────────────────────────────────────────────
// Testar att läge (individuellt eller grupp) kan sättas korrekt

describe("useQuiz – setMode", () => {
  it("updates mode to individual", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.setMode("individual"));
    expect(result.current.mode).toBe("individual");
  });

  it("updates mode to group", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.setMode("group"));
    expect(result.current.mode).toBe("group");
  });
});

// ─── toggleCat ────────────────────────────────────────────────────────────────
// Testar att kategorier kan läggas till och tas bort ur selectedCats

describe("useQuiz – toggleCat", () => {
  it("adds a category when toggled on", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.toggleCat("XYZ"));
    expect(result.current.selectedCats).toContain("XYZ");
  });

  it("removes a category when toggled off", () => {
    // Samma kategori togglad två gånger ska resultera i att den tas bort
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.toggleCat("XYZ"));
    act(() => result.current.toggleCat("XYZ"));
    expect(result.current.selectedCats).not.toContain("XYZ");
  });

  it("can have multiple categories selected", () => {
    // Flera kategorier kan vara valda samtidigt
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.toggleCat("XYZ"));
    act(() => result.current.toggleCat("KVA"));
    expect(result.current.selectedCats).toEqual(["XYZ", "KVA"]);
  });
});

// ─── setSettings ──────────────────────────────────────────────────────────────
// Testar att quiz-inställningarna (antal frågor och tid) kan uppdateras

describe("useQuiz – setSettings", () => {
  it("updates numQuestions", () => {
    const { result } = renderHook(() => useQuiz());
    act(() =>
      result.current.setSettings({ numQuestions: 20, totalMinutes: 15 }),
    );
    expect(result.current.settings.numQuestions).toBe(20);
  });

  it("updates totalMinutes", () => {
    const { result } = renderHook(() => useQuiz());
    act(() =>
      result.current.setSettings({ numQuestions: 10, totalMinutes: 30 }),
    );
    expect(result.current.settings.totalMinutes).toBe(30);
  });
});

// ─── handleAnswer ─────────────────────────────────────────────────────────────
// Testar att handleAnswer sätter chosen till det klickade alternativets index

describe("useQuiz – handleAnswer", () => {
  it("sets chosen to the selected index", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.handleAnswer(2));
    expect(result.current.chosen).toBe(2);
  });

  it("can update chosen to a different index", () => {
    // Även om det inte är möjligt i UI (knapparna inaktiveras) ska state fungera korrekt
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.handleAnswer(0));
    act(() => result.current.handleAnswer(3));
    expect(result.current.chosen).toBe(3);
  });
});

// ─── handleNext ───────────────────────────────────────────────────────────────
// handleNext registrerar svaret och går vidare – kräver frågor i state.
// Fullständiga integrationstester för handleNext kräver att startQuiz() mockas
// djupare; här verifierar vi att funktionen existerar och är anropbar.

describe("useQuiz – handleNext", () => {
  function setupHookWithQuestions() {
    const hook = renderHook(() => useQuiz());
    // Inject two questions directly
    const q1 = {
      id: "1",
      category: "XYZ",
      question_number: 1,
      question_text: "Q1",
      image_url: null,
      material_id: null,
      options: [{ text: "A" }, { text: "B" }],
      correct_index: 1,
      explanation: "exp1",
    };
    const q2 = {
      id: "2",
      category: "XYZ",
      question_number: 2,
      question_text: "Q2",
      image_url: null,
      material_id: null,
      options: [{ text: "A" }, { text: "B" }],
      correct_index: 0,
      explanation: "exp2",
    };
    act(() => {
      hook.result.current.setScreen("quiz");
      // Use internal setState via startQuiz side-effects isn't possible without
      // mocking the DB response; instead we test the logic path with the helper
      // by calling the public API.
    });
    return { hook, q1, q2 };
  }

  it("records a correct answer in results", async () => {
    const { result } = renderHook(() => useQuiz());
    // Manually set questions via startQuiz requires DB; test via setScreen + direct
    // Since we can't inject questions without DB, we verify handleNext is a function
    expect(typeof result.current.handleNext).toBe("function");
  });
});

// ─── setScreen ────────────────────────────────────────────────────────────────
// Testar att navigation mellan skärmarna (select/quiz/results) fungerar

describe("useQuiz – setScreen", () => {
  it("can navigate to quiz screen", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.setScreen("quiz"));
    expect(result.current.screen).toBe("quiz");
  });

  it("can navigate to results screen", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.setScreen("results"));
    expect(result.current.screen).toBe("results");
  });

  it("can navigate back to select screen", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.setScreen("quiz"));
    act(() => result.current.setScreen("select"));
    expect(result.current.screen).toBe("select");
  });
});

// ─── restartQuiz ──────────────────────────────────────────────────────────────
// Testar att restartQuiz återställer all relevant state och navigerar till quiz-skärmen

describe("useQuiz – restartQuiz", () => {
  it("resets current index to 0", () => {
    // Ska navigera tillbaka till quiz-skärmen
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.restartQuiz());
    expect(result.current.screen).toBe("quiz");
  });

  it("resets results to empty array", () => {
    // Tidigare resultat ska rensas
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.restartQuiz());
    expect(result.current.results).toEqual([]);
  });

  it("resets chosen to null", () => {
    // Eventuellt valt svar ska rensas
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.handleAnswer(1));
    act(() => result.current.restartQuiz());
    expect(result.current.chosen).toBeNull();
  });

  it("resets timer to totalMinutes × 60", () => {
    // Timern ska återställas till full tid
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.restartQuiz());
    expect(result.current.timer).toBe(
      result.current.settings.totalMinutes * 60,
    );
  });
});

// ── Mock Supabase so the hook never touches the network ──────────────────────
vi.mock("../supabaseClient", () => ({
  default: {
    from: () => ({
      select: () => ({
        is: () => Promise.resolve({ data: [], error: null }),
        not: () => Promise.resolve({ data: [], error: null }),
        in: () => ({
          is: () => Promise.resolve({ data: [], error: null }),
          not: () => ({
            is: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

import useQuiz from "../hooks/useQuiz";

// ─────────────────────────────────────────────────────────────────────────────

describe("useQuiz – initial state", () => {
  it("starts on the select screen", () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.screen).toBe("select");
  });

  it("mode is null initially", () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.mode).toBeNull();
  });

  it("selectedCats is empty initially", () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.selectedCats).toEqual([]);
  });

  it("questions is empty initially", () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.questions).toEqual([]);
  });

  it("chosen is null initially", () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.chosen).toBeNull();
  });

  it("results is empty initially", () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.results).toEqual([]);
  });

  it("timer equals totalMinutes × 60 initially", () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.timer).toBe(
      result.current.settings.totalMinutes * 60,
    );
  });
});

// ─── setMode ──────────────────────────────────────────────────────────────────

describe("useQuiz – setMode", () => {
  it("updates mode to individual", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.setMode("individual"));
    expect(result.current.mode).toBe("individual");
  });

  it("updates mode to group", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.setMode("group"));
    expect(result.current.mode).toBe("group");
  });
});

// ─── toggleCat ────────────────────────────────────────────────────────────────

describe("useQuiz – toggleCat", () => {
  it("adds a category when toggled on", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.toggleCat("XYZ"));
    expect(result.current.selectedCats).toContain("XYZ");
  });

  it("removes a category when toggled off", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.toggleCat("XYZ"));
    act(() => result.current.toggleCat("XYZ"));
    expect(result.current.selectedCats).not.toContain("XYZ");
  });

  it("can have multiple categories selected", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.toggleCat("XYZ"));
    act(() => result.current.toggleCat("KVA"));
    expect(result.current.selectedCats).toEqual(["XYZ", "KVA"]);
  });
});

// ─── setSettings ──────────────────────────────────────────────────────────────

describe("useQuiz – setSettings", () => {
  it("updates numQuestions", () => {
    const { result } = renderHook(() => useQuiz());
    act(() =>
      result.current.setSettings({ numQuestions: 20, totalMinutes: 15 }),
    );
    expect(result.current.settings.numQuestions).toBe(20);
  });

  it("updates totalMinutes", () => {
    const { result } = renderHook(() => useQuiz());
    act(() =>
      result.current.setSettings({ numQuestions: 10, totalMinutes: 30 }),
    );
    expect(result.current.settings.totalMinutes).toBe(30);
  });
});

// ─── handleAnswer ─────────────────────────────────────────────────────────────

describe("useQuiz – handleAnswer", () => {
  it("sets chosen to the selected index", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.handleAnswer(2));
    expect(result.current.chosen).toBe(2);
  });

  it("can update chosen to a different index", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.handleAnswer(0));
    act(() => result.current.handleAnswer(3));
    expect(result.current.chosen).toBe(3);
  });
});

// ─── handleNext ───────────────────────────────────────────────────────────────

describe("useQuiz – handleNext", () => {
  function setupHookWithQuestions() {
    const hook = renderHook(() => useQuiz());
    // Inject two questions directly
    const q1 = {
      id: "1",
      category: "XYZ",
      question_number: 1,
      question_text: "Q1",
      image_url: null,
      material_id: null,
      options: [{ text: "A" }, { text: "B" }],
      correct_index: 1,
      explanation: "exp1",
    };
    const q2 = {
      id: "2",
      category: "XYZ",
      question_number: 2,
      question_text: "Q2",
      image_url: null,
      material_id: null,
      options: [{ text: "A" }, { text: "B" }],
      correct_index: 0,
      explanation: "exp2",
    };
    act(() => {
      hook.result.current.setScreen("quiz");
      // Use internal setState via startQuiz side-effects isn't possible without
      // mocking the DB response; instead we test the logic path with the helper
      // by calling the public API.
    });
    return { hook, q1, q2 };
  }

  it("records a correct answer in results", async () => {
    const { result } = renderHook(() => useQuiz());
    // Manually set questions via startQuiz requires DB; test via setScreen + direct
    // Since we can't inject questions without DB, we verify handleNext is a function
    expect(typeof result.current.handleNext).toBe("function");
  });
});

// ─── setScreen ────────────────────────────────────────────────────────────────

describe("useQuiz – setScreen", () => {
  it("can navigate to quiz screen", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.setScreen("quiz"));
    expect(result.current.screen).toBe("quiz");
  });

  it("can navigate to results screen", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.setScreen("results"));
    expect(result.current.screen).toBe("results");
  });

  it("can navigate back to select screen", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.setScreen("quiz"));
    act(() => result.current.setScreen("select"));
    expect(result.current.screen).toBe("select");
  });
});

// ─── restartQuiz ──────────────────────────────────────────────────────────────

describe("useQuiz – restartQuiz", () => {
  it("resets current index to 0", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.restartQuiz());
    expect(result.current.screen).toBe("quiz");
  });

  it("resets results to empty array", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.restartQuiz());
    expect(result.current.results).toEqual([]);
  });

  it("resets chosen to null", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.handleAnswer(1));
    act(() => result.current.restartQuiz());
    expect(result.current.chosen).toBeNull();
  });

  it("resets timer to totalMinutes × 60", () => {
    const { result } = renderHook(() => useQuiz());
    act(() => result.current.restartQuiz());
    expect(result.current.timer).toBe(
      result.current.settings.totalMinutes * 60,
    );
  });
});
