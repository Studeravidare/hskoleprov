import { Option } from "../../constants";
import "./OptionsList.css";

const LETTERS = ["A", "B", "C", "D", "E"] as const;

interface OptionsListProps {
  options:       Option[];
  chosen:        number | null;
  correctIndex:  number;
  onAnswer:      (idx: number) => void;
  onNext:        () => void;
  isLast:        boolean;
  explanation:   string;
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
  const isImageOptions = Boolean(options[0]?.image);

  return (
    <>
      <div className={`options-list${isImageOptions ? " image-options" : ""}`}>
        {options.map((opt, i) => {
          let cls = "option-btn";
          if (chosen !== null) {
            if (i === correctIndex) cls += " correct";
            else if (i === chosen)  cls += " wrong";
            else                    cls += " dimmed";
          }
          return (
            <button
              key={i}
              className={cls}
              disabled={chosen !== null}
              onClick={() => onAnswer(i)}
            >
              <div className="option-letter">{LETTERS[i]}</div>
              {opt.image ? (
                <img
                  src={opt.image}
                  alt={`Alternativ ${LETTERS[i]}`}
                  style={{ maxHeight: "120px", maxWidth: "100%", objectFit: "contain", borderRadius: "6px" }}
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              ) : (
                opt.text?.replace(/^[A-E]: /, "")
              )}
            </button>
          );
        })}
      </div>

      {chosen !== null && (
        <>
          <div className="explanation-box">
            <strong>Förklaring</strong>
            <p>{explanation}</p>
          </div>
          <button className="next-btn" onClick={onNext}>
            {isLast ? "Se resultat" : "Nästa fråga"} →
          </button>
        </>
      )}
    </>
  );
}
