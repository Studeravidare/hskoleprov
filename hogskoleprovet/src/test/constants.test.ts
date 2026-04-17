// Tester för hjälpfunktioner och konstanter i constants.ts.
// Täcker tre områden:
//   1. parseOptions  – omvandlar rå data till Option[]-arrays
//   2. shuffle       – Fisher-Yates-blankning av arrayer
//   3. CATEGORY_META – metadata för alla frågekategorier
import { describe, it, expect } from "vitest";
import {
  parseOptions,
  shuffle,
  CATEGORY_META,
  DEFAULT_NUM_QUESTIONS,
  DEFAULT_TOTAL_MINUTES,
} from "../constants";

// ─── parseOptions ─────────────────────────────────────────────────────────────
// parseOptions tar emot data från databasen (kan vara array, JSON-sträng eller
// ogiltigt värde) och returnerar alltid en Option[]-array.

describe("parseOptions", () => {
  it("returns array as-is when already an array", () => {
    const options = [{ text: "A" }, { text: "B" }];
    expect(parseOptions(options)).toEqual(options);
  });

  it("parses a valid JSON string into an array", () => {
    // Supabase kan returnera alternativ som en JSON-sträng – den ska parsas korrekt
    const json = JSON.stringify([{ text: "X" }, { image: "http://img.png" }]);
    expect(parseOptions(json)).toEqual([
      { text: "X" },
      { image: "http://img.png" },
    ]);
  });

  it("returns empty array for invalid JSON string", () => {
    // Felaktig JSON ska inte krascha appen – returnera tom array istället
    expect(parseOptions("not json {")).toEqual([]);
  });

  it("returns empty array for null", () => {
    // null kan komma från databasen om kolumnen är tom
    expect(parseOptions(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(parseOptions(undefined)).toEqual([]);
  });

  it("returns empty array for a number", () => {
    // Icke-sträng, icke-array-värden ska aldrig behandlas som alternativ
    expect(parseOptions(42)).toEqual([]);
  });

  it("returns empty array for an empty string", () => {
    expect(parseOptions("")).toEqual([]);
  });
});

// ─── shuffle ──────────────────────────────────────────────────────────────────
// shuffle används för att slumpa frågornas ordning med Fisher-Yates-algoritmen.
// Viktigt att den inte muterar originalarray och bevarar alla element.

describe("shuffle", () => {
  it("returns an array of the same length", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr)).toHaveLength(arr.length);
  });

  it("contains all original elements", () => {
    // Inga element får försvinna eller dupliceras vid blandning
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr).sort()).toEqual([...arr].sort());
  });

  it("does not mutate the original array", () => {
    // shuffle ska returnera en ny array, inte ändra originalet
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });

  it("returns empty array for empty input", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("returns single-element array unchanged", () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it("produces different orderings over many runs (statistical)", () => {
    // Statistiskt test: 50 körningar av en 5-elements array bör ge mer än en unik ordning.
    // Med 120 möjliga permutationer är sannolikheten att alltid få samma ordning extremt liten.
    const arr = [1, 2, 3, 4, 5];
    const results = new Set(
      Array.from({ length: 50 }, () => shuffle(arr).join(",")),
    );
    // With 5 elements there are 120 permutations; 50 runs should produce >1
    expect(results.size).toBeGreaterThan(1);
  });
});

// ─── CATEGORY_META ────────────────────────────────────────────────────────────
// CATEGORY_META innehåller visningsdata (label, färg osv.) för varje frågekategori.
// Testerna säkerställer att inga kategorier saknas och att strukturen är korrekt.

describe("CATEGORY_META", () => {
  const expectedCategories = [
    "XYZ",
    "KVA",
    "DTK",
    "NOG",
    "ORD",
    "LÄS",
    "MEK",
    "ELF",
  ];

  it("contains all expected categories", () => {
    // Om en kategori läggs till i databasen måste den också finnas i CATEGORY_META
    expectedCategories.forEach((cat) => {
      expect(CATEGORY_META).toHaveProperty(cat);
    });
  });

  it("each category has required fields", () => {
    // Alla kategorier måste ha label, desc, color och light för att UI ska fungera
    Object.values(CATEGORY_META).forEach((meta) => {
      expect(meta).toHaveProperty("label");
      expect(meta).toHaveProperty("desc");
      expect(meta).toHaveProperty("color");
      expect(meta).toHaveProperty("light");
      expect(typeof meta.label).toBe("string");
      expect(typeof meta.color).toBe("string");
    });
  });
});

// ─── Defaults ─────────────────────────────────────────────────────────────────
// Grundvärden som används när användaren inte ändrat inställningarna.

describe("defaults", () => {
  it("DEFAULT_NUM_QUESTIONS is a positive number", () => {
    expect(DEFAULT_NUM_QUESTIONS).toBeGreaterThan(0);
  });

  it("DEFAULT_TOTAL_MINUTES is a positive number", () => {
    expect(DEFAULT_TOTAL_MINUTES).toBeGreaterThan(0);
  });
});

// ─── parseOptions ─────────────────────────────────────────────────────────────

describe("parseOptions", () => {
  it("returns array as-is when already an array", () => {
    const options = [{ text: "A" }, { text: "B" }];
    expect(parseOptions(options)).toEqual(options);
  });

  it("parses a valid JSON string into an array", () => {
    const json = JSON.stringify([{ text: "X" }, { image: "http://img.png" }]);
    expect(parseOptions(json)).toEqual([
      { text: "X" },
      { image: "http://img.png" },
    ]);
  });

  it("returns empty array for invalid JSON string", () => {
    expect(parseOptions("not json {")).toEqual([]);
  });

  it("returns empty array for null", () => {
    expect(parseOptions(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(parseOptions(undefined)).toEqual([]);
  });

  it("returns empty array for a number", () => {
    expect(parseOptions(42)).toEqual([]);
  });

  it("returns empty array for an empty string", () => {
    expect(parseOptions("")).toEqual([]);
  });
});

// ─── shuffle ──────────────────────────────────────────────────────────────────

describe("shuffle", () => {
  it("returns an array of the same length", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr)).toHaveLength(arr.length);
  });

  it("contains all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr).sort()).toEqual([...arr].sort());
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });

  it("returns empty array for empty input", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("returns single-element array unchanged", () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it("produces different orderings over many runs (statistical)", () => {
    const arr = [1, 2, 3, 4, 5];
    const results = new Set(
      Array.from({ length: 50 }, () => shuffle(arr).join(",")),
    );
    // With 5 elements there are 120 permutations; 50 runs should produce >1
    expect(results.size).toBeGreaterThan(1);
  });
});

// ─── CATEGORY_META ────────────────────────────────────────────────────────────

describe("CATEGORY_META", () => {
  const expectedCategories = [
    "XYZ",
    "KVA",
    "DTK",
    "NOG",
    "ORD",
    "LÄS",
    "MEK",
    "ELF",
  ];

  it("contains all expected categories", () => {
    expectedCategories.forEach((cat) => {
      expect(CATEGORY_META).toHaveProperty(cat);
    });
  });

  it("each category has required fields", () => {
    Object.values(CATEGORY_META).forEach((meta) => {
      expect(meta).toHaveProperty("label");
      expect(meta).toHaveProperty("desc");
      expect(meta).toHaveProperty("color");
      expect(meta).toHaveProperty("light");
      expect(typeof meta.label).toBe("string");
      expect(typeof meta.color).toBe("string");
    });
  });
});

// ─── Defaults ─────────────────────────────────────────────────────────────────

describe("defaults", () => {
  it("DEFAULT_NUM_QUESTIONS is a positive number", () => {
    expect(DEFAULT_NUM_QUESTIONS).toBeGreaterThan(0);
  });

  it("DEFAULT_TOTAL_MINUTES is a positive number", () => {
    expect(DEFAULT_TOTAL_MINUTES).toBeGreaterThan(0);
  });
});
