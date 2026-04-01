import { Option } from "../../constants";
import "./OptionsList.css";

// Svarsalternativ i bokstavsform
const LETTERS = ["A", "B", "C", "D", "E"] as const;

// Props för svar
interface OptionsListProps {
  options: Option[]; // Lista med svarsalternativ
  chosen: number | null; // Index för valt svar (eller null om inget valt)
  correctIndex: number; // Index för rätt svar
  onAnswer: (idx: number) => void; // Funktion som körs när användaren svarar
  onNext: () => void; // Funktion för att gå till nästa fråga
  isLast: boolean; // Om detta är sista frågan
  explanation: string; // Förklaring till rätt svar
}

/* Visar svarsalternativen samt förklaring och nästa-knapp efter svar. */
export default function OptionsList({
  options,
  chosen,
  correctIndex,
  onAnswer,
  onNext,
  isLast,
  explanation,
}: OptionsListProps) {
  // Kollar om svaren innehåller bilder (baserat på första alternativet)
  const isImageOptions = Boolean(options[0]?.image);

  return (
    <>
      {/* Wrapper för alla svarsalternativ */}
      <div className={`options-list${isImageOptions ? " image-options" : ""}`}>
        {options.map((opt, i) => {
          // Sätter CSS-klasser beroende på svarstillstånd
          let cls = "option-btn";
          if (chosen !== null) {
            if (i === correctIndex)
              cls += " correct"; // Rätt svar
            else if (i === chosen)
              cls += " wrong"; // Fel valt svar
            else cls += " dimmed"; // Övriga tonas ner
          }

          return (
            <button
              key={i}
              className={cls}
              disabled={chosen !== null} // Inaktivera efter svar
              onClick={() => onAnswer(i)} // Skicka index på klick
            >
              {/* Visar bokstav (A, B, C...) */}
              <div className="option-letter">{LETTERS[i]}</div>

              {/* Om alternativet har bild, visa bild */}
              {opt.image ? (
                <img
                  src={opt.image}
                  alt={`Alternativ ${LETTERS[i]}`}
                  style={{
                    maxHeight: "120px",
                    maxWidth: "100%",
                    objectFit: "contain",
                    borderRadius: "6px",
                  }}
                  // Döljer bilden om den inte kan laddas
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              ) : (
                // Annars visa text (tar bort ev. "A: ", "B: " prefix)
                opt.text?.replace(/^[A-E]: /, "")
              )}
            </button>
          );
        })}
      </div>

      {/* Visas endast efter att ett svar valts */}
      {chosen !== null && (
        <>
          {/* Förklaringsruta */}
          <div className="explanation-box">
            <strong>Förklaring</strong>
            <p>{explanation}</p>
          </div>

          {/* Knapp för nästa fråga / resultat */}
          <button className="next-btn" onClick={onNext}>
            {isLast ? "Se resultat" : "Nästa fråga"} →
          </button>
        </>
      )}
    </>
  );
}
