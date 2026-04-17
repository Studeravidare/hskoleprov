import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizScreen from "../components/QuizScreen/QuizScreen";
import type { Question, Material } from "../constants";

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    category: "XYZ",
    question_number: 1,
    question_text: "Vad är 2+2?",
    image_url: null,
    material_id: null,
    options: [{ text: "A: 3" }, { text: "B: 4" }, { text: "C: 5" }],
    correct_index: 1,
    explanation: "Fyra.",
    ...overrides,
  };
}

function renderQuizScreen(overrides = {}) {
  const q = makeQuestion();
  const defaults = {
    questions: [q, makeQuestion({ id: "q2", question_text: "Q2" })],
    materialsMap: {} as Record<string, Material>,
    current: 0,
    chosen: null,
    results: [] as boolean[],
    timer: 300,
    totalSeconds: 600,
    fontSize: 1,
    setFontSize: vi.fn(),
    onBack: vi.fn(),
    onAnswer: vi.fn(),
    onNext: vi.fn(),
    onZoom: vi.fn(),
  };
  return render(<QuizScreen {...defaults} {...overrides} />);
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

describe("QuizScreen – top bar", () => {
  it("shows progress as current/total", () => {
    renderQuizScreen({ current: 0 });
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("shows updated progress on later question", () => {
    renderQuizScreen({ current: 1 });
    expect(screen.getByText("2/2")).toBeInTheDocument();
  });

  it("renders the timer", () => {
    renderQuizScreen({ timer: 300, totalSeconds: 600 });
    expect(screen.getByText("5:00")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", async () => {
    const onBack = vi.fn();
    renderQuizScreen({ onBack });
    await userEvent.click(screen.getByText("←"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders font size selector", () => {
    renderQuizScreen();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("calls setFontSize when font size is changed", async () => {
    const setFontSize = vi.fn();
    renderQuizScreen({ setFontSize });
    await userEvent.selectOptions(screen.getByRole("combobox"), "1.3");
    expect(setFontSize).toHaveBeenCalledWith(1.3);
  });
});

// ─── Score dots ───────────────────────────────────────────────────────────────

describe("QuizScreen – score dots", () => {
  it("renders a dot for each question", () => {
    const { container } = renderQuizScreen();
    expect(container.querySelectorAll(".score-dot")).toHaveLength(2);
  });

  it('marks answered correct questions with "correct" class', () => {
    const { container } = renderQuizScreen({ results: [true] });
    expect(container.querySelector(".score-dot.correct")).toBeInTheDocument();
  });

  it('marks answered wrong questions with "wrong" class', () => {
    const { container } = renderQuizScreen({ results: [false] });
    expect(container.querySelector(".score-dot.wrong")).toBeInTheDocument();
  });
});

// ─── Question rendering ───────────────────────────────────────────────────────

describe("QuizScreen – question rendering", () => {
  it("renders the current question text", () => {
    renderQuizScreen({ current: 0 });
    expect(screen.getByText("Vad är 2+2?")).toBeInTheDocument();
  });

  it("renders answer options", () => {
    renderQuizScreen();
    expect(
      screen.getAllByRole("button").some((b) => b.textContent?.includes("3")),
    ).toBe(true);
  });

  it("uses quiz-single layout when no material", () => {
    const { container } = renderQuizScreen();
    expect(container.querySelector(".quiz-single")).toBeInTheDocument();
  });
});

// ─── With material ────────────────────────────────────────────────────────────

describe("QuizScreen – with material", () => {
  const material: Material = {
    id: "m1",
    title: "Tabellrubrik",
    text_content: "Materialtexten här.",
    image_urls: null,
  };

  it("uses quiz-layout (split) when material is present", () => {
    const qWithMaterial = makeQuestion({ material_id: "m1" });
    const { container } = render(
      <QuizScreen
        questions={[qWithMaterial]}
        materialsMap={{ m1: material }}
        current={0}
        chosen={null}
        results={[]}
        timer={300}
        totalSeconds={600}
        fontSize={1}
        setFontSize={vi.fn()}
        onBack={vi.fn()}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onZoom={vi.fn()}
      />,
    );
    expect(container.querySelector(".quiz-layout")).toBeInTheDocument();
    expect(container.querySelector(".quiz-left")).toBeInTheDocument();
    expect(container.querySelector(".quiz-right")).toBeInTheDocument();
  });

  it("renders the MaterialCard with material content", () => {
    const qWithMaterial = makeQuestion({ material_id: "m1" });
    render(
      <QuizScreen
        questions={[qWithMaterial]}
        materialsMap={{ m1: material }}
        current={0}
        chosen={null}
        results={[]}
        timer={300}
        totalSeconds={600}
        fontSize={1}
        setFontSize={vi.fn()}
        onBack={vi.fn()}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onZoom={vi.fn()}
      />,
    );
    expect(screen.getByText("Tabellrubrik")).toBeInTheDocument();
    expect(screen.getByText("Materialtexten här.")).toBeInTheDocument();
  });
});

// ─── Answer interaction ───────────────────────────────────────────────────────

describe("QuizScreen – answering", () => {
  it("calls onAnswer when an option is clicked", async () => {
    const onAnswer = vi.fn();
    renderQuizScreen({ onAnswer });
    const optionBtns = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("option-btn"));
    await userEvent.click(optionBtns[0]);
    expect(onAnswer).toHaveBeenCalledWith(0);
  });

  it('shows "Nästa fråga" button after answering', () => {
    renderQuizScreen({ chosen: 1 });
    expect(screen.getByText(/Nästa fråga/)).toBeInTheDocument();
  });

  it('shows "Se resultat" on the last question after answering', () => {
    renderQuizScreen({ current: 1, chosen: 0 });
    expect(screen.getByText(/Se resultat/)).toBeInTheDocument();
  });
});
