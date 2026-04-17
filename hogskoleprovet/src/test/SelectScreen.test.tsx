import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelectScreen from "../components/SelectScreen/SelectScreen";
import type { QuizSettings } from "../constants";

const defaultSettings: QuizSettings = { numQuestions: 10, totalMinutes: 15 };

function renderSelect(overrides = {}) {
  const defaults = {
    mode: null as "individual" | "group" | null,
    setMode: vi.fn(),
    selectedCats: [] as string[],
    toggleCat: vi.fn(),
    setSelectedCats: vi.fn(),
    allCategories: {
      individual: { XYZ: 45, KVA: 30 },
      group: { LÄS: 20, DTK: 15 },
    },
    loadingCats: false,
    settings: defaultSettings,
    setSettings: vi.fn(),
    onStart: vi.fn(),
  };
  return render(<SelectScreen {...defaults} {...overrides} />);
}

// ─── Initial state ────────────────────────────────────────────────────────────

describe("SelectScreen – initial state", () => {
  it("renders the page title", () => {
    renderSelect();
    expect(screen.getByText(/Välj vad du vill/)).toBeInTheDocument();
  });

  it("renders both mode buttons", () => {
    renderSelect();
    expect(screen.getByText("Individuella")).toBeInTheDocument();
    expect(screen.getByText("Textbaserade")).toBeInTheDocument();
  });

  it("start button is disabled when no mode is selected", () => {
    renderSelect();
    expect(
      screen.getByRole("button", { name: /Välj typ av frågor/ }),
    ).toBeDisabled();
  });

  it('shows "Laddar kategorier..." while loading', () => {
    renderSelect({ loadingCats: true });
    expect(screen.getByText("Laddar kategorier...")).toBeInTheDocument();
  });
});

// ─── Mode selection ───────────────────────────────────────────────────────────

describe("SelectScreen – mode selection", () => {
  it('calls setMode with "individual" when that button is clicked', async () => {
    const setMode = vi.fn();
    renderSelect({ setMode });
    await userEvent.click(screen.getByText("Individuella"));
    expect(setMode).toHaveBeenCalledWith("individual");
  });

  it('calls setMode with "group" when that button is clicked', async () => {
    const setMode = vi.fn();
    renderSelect({ setMode });
    await userEvent.click(screen.getByText("Textbaserade"));
    expect(setMode).toHaveBeenCalledWith("group");
  });

  it("calls setSelectedCats([]) when switching mode", async () => {
    const setSelectedCats = vi.fn();
    renderSelect({ setSelectedCats });
    await userEvent.click(screen.getByText("Individuella"));
    expect(setSelectedCats).toHaveBeenCalledWith([]);
  });

  it('applies "selected" class to the active mode button', () => {
    renderSelect({ mode: "individual" });
    const btn = screen.getByText("Individuella").closest("button");
    expect(btn?.className).toContain("selected");
  });

  it('does not apply "selected" class to the inactive mode button', () => {
    renderSelect({ mode: "individual" });
    const btn = screen.getByText("Textbaserade").closest("button");
    expect(btn?.className).not.toContain("selected");
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────

describe("SelectScreen – categories", () => {
  it("shows individual categories when individual mode is selected", () => {
    renderSelect({ mode: "individual" });
    expect(screen.getByText("XYZ")).toBeInTheDocument();
    expect(screen.getByText("KVA")).toBeInTheDocument();
  });

  it("shows group categories when group mode is selected", () => {
    renderSelect({ mode: "group" });
    expect(screen.getByText("LÄS")).toBeInTheDocument();
    expect(screen.getByText("DTK")).toBeInTheDocument();
  });

  it("shows no category cards when no mode is selected", () => {
    renderSelect({ mode: null });
    expect(screen.queryByText("XYZ")).not.toBeInTheDocument();
  });

  it("shows question count for each category", () => {
    renderSelect({ mode: "individual" });
    expect(screen.getByText("45 fr.")).toBeInTheDocument();
    expect(screen.getByText("30 fr.")).toBeInTheDocument();
  });

  it("calls toggleCat when a category is clicked", async () => {
    const toggleCat = vi.fn();
    renderSelect({ mode: "individual", toggleCat });
    await userEvent.click(screen.getByText("XYZ").closest("button")!);
    expect(toggleCat).toHaveBeenCalledWith("XYZ");
  });

  it('applies "selected" class to selected category', () => {
    renderSelect({ mode: "individual", selectedCats: ["XYZ"] });
    const btn = screen.getByText("XYZ").closest("button");
    expect(btn?.className).toContain("selected");
  });
});

// ─── Settings ─────────────────────────────────────────────────────────────────

describe("SelectScreen – settings", () => {
  it("renders question count options", () => {
    renderSelect();
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
  });

  it('active numQuestions pill has "active" class', () => {
    renderSelect({ settings: { numQuestions: 10, totalMinutes: 15 } });
    const btn = screen.getByRole("button", { name: "10" });
    expect(btn.className).toContain("active");
  });

  it("calls setSettings when a question count pill is clicked", async () => {
    const setSettings = vi.fn();
    renderSelect({ setSettings });
    await userEvent.click(screen.getByRole("button", { name: "5" }));
    expect(setSettings).toHaveBeenCalledWith(
      expect.objectContaining({ numQuestions: 5 }),
    );
  });

  it("calls setSettings when a time pill is clicked", async () => {
    const setSettings = vi.fn();
    renderSelect({ setSettings });
    await userEvent.click(screen.getByRole("button", { name: "30 min" }));
    expect(setSettings).toHaveBeenCalledWith(
      expect.objectContaining({ totalMinutes: 30 }),
    );
  });
});

// ─── Start button ─────────────────────────────────────────────────────────────

describe("SelectScreen – start button", () => {
  it("is disabled when mode is set but no category selected", () => {
    renderSelect({ mode: "individual", selectedCats: [] });
    expect(
      screen.getByRole("button", { name: /Välj minst en kategori/ }),
    ).toBeDisabled();
  });

  it("is enabled and shows quiz info when mode and category are selected", () => {
    renderSelect({
      mode: "individual",
      selectedCats: ["XYZ"],
    });
    const btn = screen.getByRole("button", { name: /Starta/ });
    expect(btn).not.toBeDisabled();
    expect(btn.textContent).toContain("10 frågor");
    expect(btn.textContent).toContain("15 min");
  });

  it("calls onStart when start button is clicked", async () => {
    const onStart = vi.fn();
    renderSelect({ mode: "individual", selectedCats: ["XYZ"], onStart });
    await userEvent.click(screen.getByRole("button", { name: /Starta/ }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
