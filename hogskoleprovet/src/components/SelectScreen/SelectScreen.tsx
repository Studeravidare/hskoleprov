import { CATEGORY_META, QuizSettings } from "../../constants";
import "./SelectScreen.css";

type Mode = "individual" | "group" | null;

interface SelectScreenProps {
  mode: Mode;
  setMode: (m: Mode) => void;
  selectedCats: string[];
  toggleCat: (cat: string) => void;
  setSelectedCats: (cats: string[]) => void;
  allCategories: {
    individual: Record<string, number>;
    group: Record<string, number>;
  };
  loadingCats: boolean;
  settings: QuizSettings;
  setSettings: (s: QuizSettings) => void;
  onStart: () => void;
}

// Konstanter för inställningar
const QUESTION_OPTIONS = [5, 10, 15, 20, 30];
const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export default function SelectScreen({
  mode,
  setMode,
  selectedCats,
  toggleCat,
  setSelectedCats,
  allCategories,
  loadingCats,
  settings,
  setSettings,
  onStart,
}: SelectScreenProps) {
  return (
    <div className="select-container">
      <h1 className="select-title">
        Välj vad du vill
        <br />
        <em>öva på idag.</em>
      </h1>
      <p className="select-subtitle">Anpassa ditt träningspass.</p>

      {/* ── Mode ── */}
      <div className="section-label">Typ av frågor</div>
      <div className="mode-grid">
        {/* ── Individual button ── */}
        <button
          className={`mode-card${mode === "individual" ? " selected" : ""}`}
          onClick={() => {
            setMode("individual");
            setSelectedCats([]);
          }}
        >
          <div className="mode-icon">⚡</div>
          <div className="mode-title">Individuella</div>
          <div className="mode-desc">
            Fristående frågor, en i taget. Snabb träning.
          </div>
        </button>
        {/* ── Group questions ── */}
        <button
          className={`mode-card${mode === "group" ? " selected" : ""}`}
          onClick={() => {
            setMode("group");
            setSelectedCats([]);
          }}
        >
          <div className="mode-icon">📄</div>
          <div className="mode-title">Textbaserade</div>
          <div className="mode-desc">
            Frågor kopplade till en text eller bild. Hela gruppen kommer med.
          </div>
        </button>
      </div>

      {/* ── Categories ── */}
      <div className="section-label">Kategori</div>
      {loadingCats ? (
        <p className="loading">Laddar kategorier...</p>
      ) : (
        <div className="category-grid">
          {Object.entries(mode ? allCategories[mode] : {}).map(
            ([cat, count]) => {
              const meta = CATEGORY_META[cat] ?? {
                label: cat,
                desc: "",
                color: "#035c67",
                light: "#f0f8f8",
              };
              return (
                <button
                  key={cat}
                  className={`category-card${selectedCats.includes(cat) ? " selected" : ""}`}
                  style={
                    {
                      "--cat-color": meta.color,
                      "--cat-light": meta.light,
                    } as React.CSSProperties
                  }
                  onClick={() => toggleCat(cat)}
                >
                  <div className="cat-badge">{cat}</div>
                  <div className="cat-count">{count} fr.</div>
                  <div className="cat-label">{meta.label}</div>
                  <div className="cat-desc">{meta.desc}</div>
                </button>
              );
            },
          )}
        </div>
      )}

      {/* ── Settings ── */}
      <div className="section-label">Inställningar</div>
      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-label">Antal frågor</div>
          <div className="settings-pills">
            {QUESTION_OPTIONS.map((n) => (
              <button
                key={n}
                className={`pill${settings.numQuestions === n ? " active" : ""}`}
                onClick={() => setSettings({ ...settings, numQuestions: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-label">Total tid</div>
          <div className="settings-pills">
            {TIME_OPTIONS.map((m) => (
              <button
                key={m}
                className={`pill${settings.totalMinutes === m ? " active" : ""}`}
                onClick={() => setSettings({ ...settings, totalMinutes: m })}
              >
                {m} min
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Start ── */}
      <button
        className="start-btn"
        disabled={selectedCats.length === 0 || !mode}
        onClick={onStart}
      >
        {!mode
          ? "Välj typ av frågor"
          : selectedCats.length === 0
            ? "Välj minst en kategori"
            : `Starta — ${settings.numQuestions} frågor · ${settings.totalMinutes} min`}
      </button>
    </div>
  );
}
