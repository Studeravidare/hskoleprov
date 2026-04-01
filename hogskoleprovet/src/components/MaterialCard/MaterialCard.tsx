import { Material } from "../../constants";
import "./MaterialCard.css";

interface MaterialCardProps {
  material: Material;
  onZoom: (src: string) => void;
}

/* Visar ett material-kort med titel, text och/eller bilder. */
export default function MaterialCard({ material, onZoom }: MaterialCardProps) {
  /* Säkerställer att image_urls alltid blir en array av strängar */
  const imgs: string[] = Array.isArray(material.image_urls)
    ? material.image_urls
    : material.image_urls
      ? JSON.parse(material.image_urls as string)
      : [];

  return (
    <div className="material-card">
      {/* Etikett för kortet */}
      <div className="material-label">Material</div>

      {/* Visar titel om den finns */}
      {material.title && <div className="material-title">{material.title}</div>}

      {/* Visar textinnehåll om det finns */}
      {material.text_content && (
        <p className="material-text">{material.text_content}</p>
      )}

      {/* Visar bilder om det finns några */}
      {imgs.length > 0 && (
        <div className="material-imgs">
          {imgs.map((url, i) => {
            return (
              <div key={i}>
                {/* Bild som kan klickas för att zoomas */}
                <img
                  src={url}
                  alt={`Material ${i + 1}`}
                  className="zoomable"
                  onClick={() => onZoom(url)}
                  onError={(e) =>
                    /* Döljer bilden om den inte kan laddas */
                    ((e.target as HTMLElement).parentElement!.style.display =
                      "none")
                  }
                />

                {/* Hint till användaren */}
                <div className="zoom-hint">Klicka för att zooma</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
