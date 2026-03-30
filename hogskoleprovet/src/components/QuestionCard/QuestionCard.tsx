import { Question } from "../../constants";
import "./QuestionCard.css";

// Props som komponenten tar emot
interface QuestionCardProps {
  question: Question; // Själva frågeobjektet
  onZoom: (src: string) => void; // Funktion för att zooma bild
}

/*
  Visar en enskild fråga med:
  - kategori (KVA, NOG, etc.)
  - frågenummer
  - eventuell bild
  - frågetext (formatteras olika beroende på kategori)
*/
export default function QuestionCard({ question, onZoom }: QuestionCardProps) {
  const { category, question_number, image_url, question_text } = question;

  /*
    Renderar frågetexten beroende på kategori.
    KVA och NOG har specialformat medan övriga visas som vanlig text.
  */
  const renderQuestionText = () => {
    // =========================
    // KVA (Kvantitativ jämförelse)
    // =========================
    if (category === "KVA") {
      // Dela upp texten i rader:
      // - vid radbrytningar
      // - eller innan "Kvantitet ..."
      const lines = question_text.split(/\n|(?<=\.)\s+(?=Kvantitet)/);

      // Intro = första raden som inte innehåller "Kvantitet"
      const intro = lines.find((line) => !line.includes("Kvantitet")) || "";

      // Hitta Kvantitet I
      const kvantitet1 =
        lines.find((line) => /Kvantitet\s*I+\s*:/i.test(line)) || "";

      // Hitta Kvantitet II
      const kvantitet2 =
        lines.find((line) => /Kvantitet\s*II+\s*:/i.test(line)) || "";

      // Om minst en kvantitet finns → rendera speciallayout
      if (kvantitet1 || kvantitet2) {
        return (
          <div className="question-text">
            {/* Introtext */}
            {intro && <div className="kva-intro">{intro.trim()}</div>}

            {/* Kvantiteter visas bredvid/under varandra */}
            <div className="kva-quantities">
              {kvantitet1 && (
                <div className="kva-quantity">{kvantitet1.trim()}</div>
              )}
              {kvantitet2 && (
                <div className="kva-quantity">{kvantitet2.trim()}</div>
              )}
            </div>
          </div>
        );
      }
    }

    // =========================
    // NOG (Nödvändig och tillräcklig information)
    // =========================
    if (category === "NOG") {
      // Dela upp texten vid (1), (2), etc.
      const parts = question_text.split(/(?=\(\d\))/);

      // Introtext (innan första påståendet)
      const intro = parts[0]?.trim() || "";

      // Hämta påstående (1)
      const statement1 = parts.find((p) => p.startsWith("(1)"))?.trim() || "";

      // Hämta påstående (2)
      const statement2 = parts.find((p) => p.startsWith("(2)"))?.trim() || "";

      return (
        <div className="question-text nog-question">
          {/* Intro */}
          {intro && <p className="nog-intro">{intro}</p>}

          {/* Påståenden */}
          {(statement1 || statement2) && (
            <div className="nog-statements">
              {statement1 && <div className="nog-statement">{statement1}</div>}
              {statement2 && <div className="nog-statement">{statement2}</div>}
            </div>
          )}

          {/* Fast informationsrad för svarsalternativ */}
          <div className="nog-info-label">
            Tillräcklig information för lösningen erhålls
          </div>
        </div>
      );
    }

    // =========================
    // Default (alla andra kategorier)
    // =========================
    // Behåller radbrytningar som vanlig text
    return <p className="question-text">{question_text}</p>;
  };

  return (
    <div className="question-card">
      {/* Metadata: kategori + frågenummer */}
      <div className="question-meta">
        {category}
        <span>Fråga {question_number}</span>
      </div>

      {/* Bild (om den finns) */}
      {image_url && (
        <div>
          <img
            src={image_url}
            alt="Figur"
            className="question-img zoomable"
            // Klick → zooma bilden
            onClick={() => onZoom(image_url)}
            // Om bilden inte laddar → dölj hela elementet
            onError={(e) =>
              ((e.target as HTMLElement).parentElement!.style.display = "none")
            }
          />

          {/* Hint till användaren */}
          <div className="zoom-hint">Klicka för att zooma</div>
        </div>
      )}

      {/* Rendera frågetexten */}
      {renderQuestionText()}
    </div>
  );
}
