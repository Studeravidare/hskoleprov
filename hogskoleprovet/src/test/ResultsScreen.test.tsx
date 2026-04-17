// Tester för ResultsScreen-komponenten.
// ResultsScreen visas efter att quizet är klart och innehåller:
//   - Poängsammanfattning (rätt/fel-antal och motiverande meddelande)
//   - Knappar för att köra om quizet eller välja nya kategorier
//   - En expanderbar genomgångslista med alla frågor och rätta svar
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResultsScreen from "../components/ResultsScreen/ResultsScreen";
import type { Question, Material } from "../constants";

// Skapar en minimal testfråga med angivet id och valfri kategori
function makeQuestion(id: string, category = "XYZ"): Question {
  return {
    id,
    category,
    question_number: 1,
    question_text: "Testfråga " + id,
    image_url: null,
    material_id: null,
    options: [{ text: "A: Fel" }, { text: "B: Rätt" }],
    correct_index: 1,
    explanation: "Förklaring " + id,
  };
}

// Hjälpfunktion som renderar ResultsScreen med 3 frågor (2 rätt, 1 fel).
// Enskilda tester kan skriva över props via overrides.
function renderResults(overrides = {}) {
  const questions = [makeQuestion("1"), makeQuestion("2"), makeQuestion("3")];
  const defaults = {
    results: [true, false, true], // fråga 1 och 3 rätt, fråga 2 fel
    questions,
    userAnswers: [1, 0, 1], // användaren svarade B, A, B
    materialsMap: {} as Record<string, Material>,
    onRestart: vi.fn(),
    onBack: vi.fn(),
    onZoom: vi.fn(),
  };
  return render(<ResultsScreen {...defaults} {...overrides} />);
}

// ─── Score display ────────────────────────────────────────────────────────────
// Testar att rätt poäng visas i sammanfattningskortet

describe("ResultsScreen – score display", () => {
  it("shows correct score out of total", () => {
    renderResults();
    // Poängelementet innehåller både antalet rätt och totalen som "2/3"
    const scoreEl = document.querySelector(".results-score");
    expect(scoreEl).toBeInTheDocument();
    expect(scoreEl?.textContent).toContain("2");
    expect(scoreEl?.textContent).toContain("/3");
  });

  it('shows "Rätt svar" count', () => {
    renderResults();
    const breakdown = screen.getAllByText("2");
    expect(breakdown.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Fel svar" count', () => {
    renderResults();
    // 1 wrong answer
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

// ─── Message thresholds ───────────────────────────────────────────────────────
// Testar de tre motivationsmeddelandena baserat på poängprocent:
//   ≥ 80%  → "Utmärkt jobbat!"
//   50–79% → "Bra kämpat, fortsätt öva!"
//   < 50%  → "Ge det ett till försök!"

describe("ResultsScreen – result messages", () => {
  it('shows "Utmärkt jobbat!" for ≥80% score', () => {
    const questions = [
      makeQuestion("1"),
      makeQuestion("2"),
      makeQuestion("3"),
      makeQuestion("4"),
      makeQuestion("5"),
    ];
    render(
      <ResultsScreen
        results={[true, true, true, true, true]} // 5/5 = 100%
        questions={questions}
        userAnswers={[1, 1, 1, 1, 1]}
        materialsMap={{}}
        onRestart={vi.fn()}
        onBack={vi.fn()}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText(/Utmärkt jobbat!/)).toBeInTheDocument();
  });

  it('shows "Bra kämpat" for 50–79% score', () => {
    const questions = [makeQuestion("1"), makeQuestion("2")];
    render(
      <ResultsScreen
        results={[true, false]} // 1/2 = 50%
        questions={questions}
        userAnswers={[1, 0]}
        materialsMap={{}}
        onRestart={vi.fn()}
        onBack={vi.fn()}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText(/Bra kämpat/)).toBeInTheDocument();
  });

  it('shows "Ge det ett till försök!" for <50% score', () => {
    const questions = [makeQuestion("1"), makeQuestion("2"), makeQuestion("3")];
    render(
      <ResultsScreen
        results={[false, false, false]} // 0/3 = 0%
        questions={questions}
        userAnswers={[0, 0, 0]}
        materialsMap={{}}
        onRestart={vi.fn()}
        onBack={vi.fn()}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText(/Ge det ett till försök!/)).toBeInTheDocument();
  });
});

// ─── Action buttons ───────────────────────────────────────────────────────────
// Testar att knapparna längst ned anropar rätt callbacks

describe("ResultsScreen – action buttons", () => {
  it("calls onRestart when restart button is clicked", async () => {
    // "Kör om samma kategorier" ska starta om quizet med samma inställningar
    const onRestart = vi.fn();
    renderResults({ onRestart });
    await userEvent.click(screen.getByText(/Kör om samma kategorier/));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when back button is clicked", async () => {
    // "Välj nya kategorier" ska ta tillbaka användaren till startsidan
    const onBack = vi.fn();
    renderResults({ onBack });
    await userEvent.click(screen.getByText(/Välj nya kategorier/));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ─── Review list ──────────────────────────────────────────────────────────────
// Testar genomgångslistan där varje fråga kan expanderas för att se detaljer

describe("ResultsScreen – review list", () => {
  it("renders a review item for each question", () => {
    renderResults();
    // 3 questions → 3 "Fråga N" headings
    expect(screen.getByText("Fråga 1")).toBeInTheDocument();
    expect(screen.getByText("Fråga 2")).toBeInTheDocument();
    expect(screen.getByText("Fråga 3")).toBeInTheDocument();
  });

  it("expands a question when its header is clicked", async () => {
    // Klick på en frågerad ska visa förklaringen och svarsalternativen
    renderResults();
    const header = screen.getByText("Fråga 1").closest("button")!;
    await userEvent.click(header);
    expect(screen.getByText("Förklaring 1")).toBeInTheDocument();
  });

  it("collapses an expanded question when clicked again", async () => {
    // Andra klick på samma rad ska dölja detaljerna igen (toggle-beteende)
    renderResults();
    const header = screen.getByText("Fråga 1").closest("button")!;
    await userEvent.click(header); // expand
    await userEvent.click(header); // collapse
    expect(screen.queryByText("Förklaring 1")).not.toBeInTheDocument();
  });

  it("marks correct answers with ✓ Rätt", () => {
    renderResults();
    // results[0] = true and results[2] = true
    const correct = screen.getAllByText("✓ Rätt");
    expect(correct).toHaveLength(2);
  });

  it("marks wrong answers with ✗ Fel", () => {
    renderResults();
    const wrong = screen.getAllByText("✗ Fel");
    expect(wrong).toHaveLength(1);
  });
});
