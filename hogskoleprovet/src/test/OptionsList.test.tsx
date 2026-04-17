// Tester för OptionsList-komponenten.
// OptionsList visar svarsalternativen under en fråga och hanterar tre tillstånd:
//   1. Innan svar – knapparna är klickbara, ingen förklaring visas
//   2. Efter svar  – rätt/fel-färgning, förklaring visas, nästa-knapp visas
//   3. Bildalternativ – när svarsalternativen är bilder istället för text
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OptionsList from "../components/OptionsList/OptionsList";
import type { Option } from "../constants";

// Standardalternativ med text som används i de flesta tester
const textOptions: Option[] = [
  { text: "A: Alternativ ett" },
  { text: "B: Alternativ två" },
  { text: "C: Alternativ tre" },
  { text: "D: Alternativ fyra" },
];

// Hjälpfunktion som renderar OptionsList med standardvärden.
// Enskilda tester kan skriva över specifika props via overrides-parametern.
function renderOptionsList(overrides = {}) {
  const defaults = {
    options: textOptions,
    chosen: null, // null = inget svar valt än
    correctIndex: 1, // B är rätt svar
    onAnswer: vi.fn(),
    onNext: vi.fn(),
    isLast: false,
    explanation: "Det rätta svaret är B.",
  };
  return render(<OptionsList {...defaults} {...overrides} />);
}

// ─── Before answering ─────────────────────────────────────────────────────────
// Testar utseendet och beteendet innan användaren har svarat (chosen === null)

describe("OptionsList – before answering", () => {
  it("renders all option buttons", () => {
    renderOptionsList();
    // 4 options → 4 buttons (A B C D)
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it('strips "A: " prefix from option text', () => {
    // Komponenten tar bort "A: "-prefixet från texten innan den visas
    renderOptionsList();
    expect(screen.getByText("Alternativ ett")).toBeInTheDocument();
  });

  it("does not show explanation before answering", () => {
    // Förklaringen ska vara dold tills användaren svarat
    renderOptionsList();
    expect(screen.queryByText("Förklaring")).not.toBeInTheDocument();
  });

  it("does not show next button before answering", () => {
    // Nästa-knappen ska inte visas förrän ett svar är valt
    renderOptionsList();
    expect(screen.queryByText(/Nästa fråga/)).not.toBeInTheDocument();
  });

  it("calls onAnswer with correct index when a button is clicked", async () => {
    // Klick på knapp C (index 2) ska anropa onAnswer med index 2
    const onAnswer = vi.fn();
    renderOptionsList({ onAnswer });
    await userEvent.click(screen.getAllByRole("button")[2]); // option C
    expect(onAnswer).toHaveBeenCalledWith(2);
  });
});

// ─── After answering ──────────────────────────────────────────────────────────
// Testar vad som händer efter att användaren valt ett svar (chosen !== null)

describe("OptionsList – after answering", () => {
  it("shows explanation after answer is chosen", () => {
    // När chosen sätts ska förklaringsrutan visas
    renderOptionsList({ chosen: 1 });
    expect(screen.getByText("Förklaring")).toBeInTheDocument();
    expect(screen.getByText("Det rätta svaret är B.")).toBeInTheDocument();
  });

  it('shows "Nästa fråga" when not last question', () => {
    renderOptionsList({ chosen: 1, isLast: false });
    expect(screen.getByText(/Nästa fråga/)).toBeInTheDocument();
  });

  it('shows "Se resultat" on last question', () => {
    // På sista frågan byts knappetiketten ut
    renderOptionsList({ chosen: 1, isLast: true });
    expect(screen.getByText(/Se resultat/)).toBeInTheDocument();
  });

  it("all option buttons are disabled after answering", () => {
    // Användaren ska inte kunna ändra sitt svar efter att ha svarat
    renderOptionsList({ chosen: 0 });
    screen.getAllByRole("button").forEach((btn) => {
      // next-btn is not disabled; only option buttons are
      if (btn.classList.contains("option-btn")) {
        expect(btn).toBeDisabled();
      }
    });
  });

  it("calls onNext when next button is clicked", async () => {
    const onNext = vi.fn();
    renderOptionsList({ chosen: 1, onNext });
    await userEvent.click(screen.getByText(/Nästa fråga/));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('applies "correct" class to correct answer button', () => {
    // Det rätta svaret (index 1) ska markeras med grön "correct"-klass
    renderOptionsList({ chosen: 0, correctIndex: 1 });
    const buttons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("option-btn"));
    expect(buttons[1].className).toContain("correct");
  });

  it('applies "wrong" class to incorrectly chosen button', () => {
    // Det felaktigt valda svaret (index 0) ska markeras med röd "wrong"-klass
    renderOptionsList({ chosen: 0, correctIndex: 1 });
    const buttons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("option-btn"));
    expect(buttons[0].className).toContain("wrong");
  });

  it('applies "dimmed" class to unchosen, wrong buttons', () => {
    // Övriga knappar (varken valda eller rätta) ska tonas ned med "dimmed"-klass
    renderOptionsList({ chosen: 0, correctIndex: 1 });
    const buttons = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("option-btn"));
    // buttons[2] and buttons[3] were neither chosen nor correct
    expect(buttons[2].className).toContain("dimmed");
    expect(buttons[3].className).toContain("dimmed");
  });
});

// ─── Image options ────────────────────────────────────────────────────────────
// Vissa frågor (t.ex. XYZ) har bilder som svarsalternativ istället för text.

describe("OptionsList – image options", () => {
  const imageOptions: Option[] = [
    { image: "http://example.com/a.png" },
    { image: "http://example.com/b.png" },
    { image: "http://example.com/c.png" },
  ];

  it("renders img elements for image options", () => {
    // Varje bildalternativ ska rendera ett <img>-element
    renderOptionsList({ options: imageOptions });
    const imgs = screen.getAllByRole("img");
    expect(imgs.length).toBeGreaterThanOrEqual(3);
  });

  it("adds image-options class to the wrapper", () => {
    // Wrappern får extra CSS-klass för att anpassa layouten för bildgrid
    const { container } = renderOptionsList({ options: imageOptions });
    expect(container.querySelector(".image-options")).toBeInTheDocument();
  });
});
