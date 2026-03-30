import { CATEGORY_META, Question, Material } from "../../constants";
import TimerRing from "../TimerRing/TimerRing";
import MaterialCard from "../MaterialCard/MaterialCard";
import QuestionCard from "../QuestionCard/QuestionCard";
import OptionsList from "../OptionsList/OptionsList";
import "./QuizScreen.css";

interface QuizScreenProps {
  questions: Question[];
  materialsMap: Record<string, Material>;
  current: number;
  chosen: number | null;
  results: boolean[];
  timer: number;
  totalSeconds: number;
  fontSize: number;
  setFontSize: (size: number) => void;
  onBack: () => void;
  onAnswer: (idx: number) => void;
  onNext: () => void;
  onZoom: (src: string) => void;
}

export default function QuizScreen({
  questions,
  materialsMap,
  current,
  chosen,
  results,
  timer,
  totalSeconds,
  fontSize,
  setFontSize,
  onBack,
  onAnswer,
  onNext,
  onZoom,
}: QuizScreenProps) {
  // Frågan
  const q = questions[current];
  // Data
  const catMeta = CATEGORY_META[q.category] ?? {
    color: "#141414",
    light: "#F5F3EF",
  };
  // Om det finns material
  const material = q.material_id ? materialsMap[q.material_id] : null;
  // Kolla om det är sista fråga
  const isLast = current + 1 >= questions.length;

  return (
    <div
      style={
        {
          "--cat-color": catMeta.color,
          "--cat-light": catMeta.light,
          "--font-scale": fontSize,
        } as React.CSSProperties
      }
    >
      {/* Score dots */}
      <div className="score-mini">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`score-dot${i < results.length ? (results[i] ? " correct" : " wrong") : ""}`}
          />
        ))}
      </div>

      {/* Top bar */}
      <div className="quiz-topbar">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <div className="progress-wrap">
          <div
            className="progress-bar"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="progress-label">
          {current + 1}/{questions.length}
        </div>
        <div className="font-select-wrap">
          <span className="font-select-label">Textstorlek</span>
          <select
            className="font-select"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          >
            {/* Font sizes */}
            <option value={0.85}>Liten</option>
            <option value={1}>Mellan</option>
            <option value={1.3}>Stor</option>
          </select>
        </div>
        <TimerRing seconds={timer} totalSeconds={totalSeconds} />
      </div>

      {/* Med material, split höger och vänster */}
      {material ? (
        <div className="quiz-layout">
          <div className="quiz-left">
            <MaterialCard material={material} onZoom={onZoom} />
          </div>
          <div className="quiz-right">
            <QuestionCard question={q} onZoom={onZoom} />
            <OptionsList
              options={q.options}
              chosen={chosen}
              correctIndex={q.correct_index}
              onAnswer={onAnswer}
              onNext={onNext}
              isLast={isLast}
              explanation={q.explanation}
            />
          </div>
        </div>
      ) : (
        /* Utan material, fråga i en rad */
        <div className="quiz-single">
          <QuestionCard question={q} onZoom={onZoom} />
          <OptionsList
            options={q.options}
            chosen={chosen}
            correctIndex={q.correct_index}
            onAnswer={onAnswer}
            onNext={onNext}
            isLast={isLast}
            explanation={q.explanation}
          />
        </div>
      )}
    </div>
  );
}
