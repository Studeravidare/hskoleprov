import { useState } from "react";
import { Question, Material, CATEGORY_META } from "../../constants";
import "./ResultsScreen.css";

const LETTERS = ["A", "B", "C", "D", "E"] as const;

interface ResultsScreenProps {
  results: boolean[];
  questions: Question[];
  userAnswers: (number | null)[];
  materialsMap: Record<string, Material>;
  onRestart: () => void;
  onBack: () => void;
  onZoom: (src: string) => void;
}

export default function ResultsScreen({
  results,
  questions,
  userAnswers,
  materialsMap,
  onRestart,
  onBack,
  onZoom,
}: ResultsScreenProps) {
  // useState för expandering av frågor
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  // Antal frågor som var rätt
  const correct = results.filter((r) => r).length;
  // Antal frågor
  const total = results.length;
  // Antal rätt i procent
  const ratio = correct / total;
  // Meddelande beroende på resultat
  const message =
    ratio >= 0.8
      ? "Utmärkt jobbat! 🎯"
      : ratio >= 0.5
        ? "Bra kämpat, fortsätt öva!"
        : "Ge det ett till försök!";

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="results-container">
      <div className="results-summary-card">
        <div className="results-score">
          {correct}
          <span>/{total}</span>
        </div>
        <p className="results-label">{message}</p>
        <div className="results-breakdown">
          <div className="breakdown-item">
            <div className="breakdown-num green">{correct}</div>
            <div className="breakdown-desc">Rätt svar</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-num red">{total - correct}</div>
            <div className="breakdown-desc">Fel svar</div>
          </div>
        </div>
      </div>

      <div className="results-review">
        <h3 className="review-title">Genomgång av dina svar</h3>
        <div className="review-list">
          {/* ── Utskrift av frågor/resultat ── */}
          {questions.map((q, i) => {
            const isCorrect = results[i];
            const userAnswer = userAnswers[i];
            const isExpanded = expandedIndex === i;
            const catMeta = CATEGORY_META[q.category] ?? {
              label: q.category,
              color: "#035c67",
              light: "#f0f8f8",
            };
            const material = q.material_id ? materialsMap[q.material_id] : null;

            return (
              <div key={i} className="review-item">
                <button
                  className={`review-header ${isCorrect ? "correct" : "wrong"}`}
                  onClick={() => toggleExpand(i)}
                >
                  <div className="review-number">
                    <span className="question-num">Fråga {i + 1}</span>
                    <span
                      className="category-badge"
                      style={{ color: catMeta.color }}
                    >
                      {q.category}
                    </span>
                  </div>
                  <div className="review-status">
                    <span
                      className={`status-badge ${isCorrect ? "correct" : "wrong"}`}
                    >
                      {isCorrect ? "✓ Rätt" : "✗ Fel"}
                    </span>
                    <span className="expand-icon">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="review-details">
                    {/* Material if exists */}
                    {material && (
                      <div className="review-material">
                        <div className="material-label-small">Material</div>
                        {material.title && (
                          <div className="material-title-small">
                            {material.title}
                          </div>
                        )}
                        {material.text_content && (
                          <p className="material-text-small">
                            {material.text_content}
                          </p>
                        )}
                        {material.image_urls &&
                          (() => {
                            const imgs: string[] = Array.isArray(
                              material.image_urls,
                            )
                              ? material.image_urls
                              : material.image_urls
                                ? JSON.parse(material.image_urls as string)
                                : [];
                            return (
                              imgs.length > 0 && (
                                <div className="material-imgs-small">
                                  {imgs.map((url, idx) => (
                                    <img
                                      key={idx}
                                      src={url}
                                      alt={`Material ${idx + 1}`}
                                      className="material-img-small zoomable"
                                      onClick={() => onZoom(url)}
                                    />
                                  ))}
                                </div>
                              )
                            );
                          })()}
                      </div>
                    )}

                    {/* Question */}
                    <div className="review-question">
                      {q.image_url && (
                        <img
                          src={q.image_url}
                          alt="Figur"
                          className="question-img-small zoomable"
                          onClick={() => onZoom(q.image_url!)}
                        />
                      )}
                      <p className="question-text-small">{q.question_text}</p>
                    </div>

                    {/* Options */}
                    <div className="review-options">
                      {q.options.map((opt, optIdx) => {
                        const isUserChoice = userAnswer === optIdx;
                        const isCorrectAnswer = optIdx === q.correct_index;
                        let className = "review-option";
                        if (isCorrectAnswer) className += " correct-answer";
                        if (isUserChoice && !isCorrectAnswer)
                          className += " wrong-answer";
                        if (!isUserChoice && !isCorrectAnswer)
                          className += " dimmed";

                        return (
                          <div key={optIdx} className={className}>
                            <span className="option-letter-small">
                              {LETTERS[optIdx]}
                            </span>
                            {opt.image ? (
                              <img
                                src={opt.image}
                                alt={`Alternativ ${LETTERS[optIdx]}`}
                                className="option-img-small"
                              />
                            ) : (
                              <span className="option-text-small">
                                {opt.text?.replace(/^[A-E]: /, "")}
                              </span>
                            )}
                            {isUserChoice && (
                              <span className="user-badge">Ditt svar</span>
                            )}
                            {isCorrectAnswer && (
                              <span className="correct-badge">Rätt svar</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="review-explanation">
                      <strong>Förklaring</strong>
                      <p>{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="results-actions">
        <button className="restart-btn" onClick={onRestart}>
          Kör om samma kategorier
        </button>
        <button className="back-select-btn" onClick={onBack}>
          Välj nya kategorier
        </button>
      </div>
    </div>
  );
}
