// Tester för QuestionCard-komponenten.
// QuestionCard visar metadata (kategori, frågenummer), eventuell bild och frågetexten.
// Frågetexten renderas olika beroende på kategori:
//   - KVA: delar upp i "Kvantitet I / II"-layout
//   - NOG: delar upp i påståenden (1) och (2) med fast informationsrad
//   - Övriga: visar texten som en vanlig paragraf
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionCard from "../components/QuestionCard/QuestionCard";
import type { Question } from "../constants";

// Skapar ett fråge-objekt med rimliga standardvärden.
// Enskilda tester kan skriva över specifika fält via overrides.
function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    category: "XYZ",
    question_number: 3,
    question_text: "Vad är 2 + 2?",
    image_url: null,
    material_id: null,
    options: [{ text: "A: 3" }, { text: "B: 4" }, { text: "C: 5" }],
    correct_index: 1,
    explanation: "Fyra.",
    ...overrides,
  };
}

// ─── Basic rendering ──────────────────────────────────────────────────────────
// Grundläggande rendering som gäller för alla kategorier

describe("QuestionCard – basic rendering", () => {
  it("shows category label", () => {
    // Kategoriförkortningen (t.ex. "XYZ") ska visas i metadata-raden
    render(<QuestionCard question={makeQuestion()} onZoom={vi.fn()} />);
    expect(screen.getByText("XYZ")).toBeInTheDocument();
  });

  it("shows question number", () => {
    // Frågenumret ska visas som "Fråga N"
    render(<QuestionCard question={makeQuestion()} onZoom={vi.fn()} />);
    expect(screen.getByText("Fråga 3")).toBeInTheDocument();
  });

  it("renders default category question text as paragraph", () => {
    // Icke-specialkategorier ska rendera frågetexten rakt av
    render(<QuestionCard question={makeQuestion()} onZoom={vi.fn()} />);
    expect(screen.getByText("Vad är 2 + 2?")).toBeInTheDocument();
  });

  it("does not render an image when image_url is null", () => {
    // Inget <img>-element ska renderas om frågan saknar bild
    render(<QuestionCard question={makeQuestion()} onZoom={vi.fn()} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

// ─── Image ────────────────────────────────────────────────────────────────────
// Tester för frågor som har en tillhörande bild (t.ex. geometri-figurer)

describe("QuestionCard – with image", () => {
  it("renders image when image_url is set", () => {
    // Bilden ska renderas med rätt src-attribut
    const q = makeQuestion({ image_url: "http://example.com/fig.png" });
    render(<QuestionCard question={q} onZoom={vi.fn()} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "http://example.com/fig.png");
  });

  it("shows zoom hint text when image is present", () => {
    // Användaren ska informeras om att bilden kan zoomas in
    const q = makeQuestion({ image_url: "http://example.com/fig.png" });
    render(<QuestionCard question={q} onZoom={vi.fn()} />);
    expect(screen.getByText("Klicka för att zooma")).toBeInTheDocument();
  });

  it("calls onZoom with image URL when image is clicked", async () => {
    // Klick på bilden ska anropa onZoom med bildens URL
    const onZoom = vi.fn();
    const q = makeQuestion({ image_url: "http://example.com/fig.png" });
    render(<QuestionCard question={q} onZoom={onZoom} />);
    await userEvent.click(screen.getByRole("img"));
    expect(onZoom).toHaveBeenCalledWith("http://example.com/fig.png");
  });
});

// ─── KVA category ─────────────────────────────────────────────────────────────
// KVA-frågor (Kvantitativ jämförelse) har en speciell layout där två kvantiteter
// ställs mot varandra i ett rutnät.

describe("QuestionCard – KVA category", () => {
  const kvaText = "x > 0\nKvantitet I: x\nKvantitet II: x²";

  it("renders kva-quantities container", () => {
    // Kvantiteterna ska omges av en container med klassen kva-quantities
    const q = makeQuestion({ category: "KVA", question_text: kvaText });
    const { container } = render(
      <QuestionCard question={q} onZoom={vi.fn()} />,
    );
    expect(container.querySelector(".kva-quantities")).toBeInTheDocument();
  });

  it("renders both kvantitet entries", () => {
    // Båda kvantiteterna ska finnas synliga i DOM
    const q = makeQuestion({ category: "KVA", question_text: kvaText });
    render(<QuestionCard question={q} onZoom={vi.fn()} />);
    expect(screen.getByText(/Kvantitet\s*I:/i)).toBeInTheDocument();
    expect(screen.getByText(/Kvantitet\s*II:/i)).toBeInTheDocument();
  });
});

// ─── NOG category ─────────────────────────────────────────────────────────────
// NOG-frågor (Nödvändig och tillräcklig information) har två påståenden (1) och (2)
// samt en fast informationsrad som alltid visas längst ned.

describe("QuestionCard – NOG category", () => {
  const nogText = "Är x positivt? (1) x > 5 (2) x < 10";

  it("renders nog-statements container", () => {
    // Påståendena ska omges av en container med klassen nog-statements
    const q = makeQuestion({ category: "NOG", question_text: nogText });
    const { container } = render(
      <QuestionCard question={q} onZoom={vi.fn()} />,
    );
    expect(container.querySelector(".nog-statements")).toBeInTheDocument();
  });

  it("renders the fixed NOG info label", () => {
    // Den fasta textraden om tillräcklig information ska alltid visas för NOG-frågor
    const q = makeQuestion({ category: "NOG", question_text: nogText });
    render(<QuestionCard question={q} onZoom={vi.fn()} />);
    expect(
      screen.getByText(/Tillräcklig information för lösningen erhålls/i),
    ).toBeInTheDocument();
  });

  it("renders statement (1)", () => {
    // Påstående (1) ska vara synligt i DOM
    const q = makeQuestion({ category: "NOG", question_text: nogText });
    render(<QuestionCard question={q} onZoom={vi.fn()} />);
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
  });
});
