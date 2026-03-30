import { Material } from "../../constants";
import "./MaterialCard.css";

interface MaterialCardProps {
  material: Material;
  onZoom: (src: string) => void;
}

/* Visar ett material-kort med titel, text och/eller bilder. */
export default function MaterialCard({ material, onZoom }: MaterialCardProps) {
  const imgs: string[] = Array.isArray(material.image_urls)
    ? material.image_urls
    : material.image_urls
      ? JSON.parse(material.image_urls as string)
      : [];

  return (
    <div className="material-card">
      <div className="material-label">Material</div>
      {material.title && <div className="material-title">{material.title}</div>}
      {material.text_content && (
        <p className="material-text">{material.text_content}</p>
      )}
      {imgs.length > 0 && (
        <div className="material-imgs">
          {imgs.map((url, i) => {
            return (
              <div key={i}>
                <img
                  src={url}
                  alt={`Material ${i + 1}`}
                  className="zoomable"
                  onClick={() => onZoom(url)}
                  onError={(e) =>
                    ((e.target as HTMLElement).parentElement!.style.display =
                      "none")
                  }
                />
                <div className="zoom-hint">Klicka för att zooma</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
