import React, { useState, useRef, useCallback } from "react";
import "./App.css";
import useQuiz from "./hooks/useQuiz";
import SelectScreen from "./components/SelectScreen/SelectScreen";
import QuizScreen from "./components/QuizScreen/QuizScreen";
import ResultsScreen from "./components/ResultsScreen/ResultsScreen";

const App: React.FC = () => {
  // Quiz-logik från custom hook
  const quiz = useQuiz();

  // Bilden som visas i zoom-läge (null = ingen bild visas)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Textstorlek för frågor (1 = normal, 0.85 = liten, 1.3 = stor)
  const [fontSize, setFontSize] = useState<number>(1);

  // State för zoom & panorering
  const [scale, setScale] = useState(1); // Zoom-nivå (1 = normal, 8 = max zoom)
  const [pos, setPos] = useState({ x: 0, y: 0 }); // Position för panorering
  const dragStart = useRef<{ x: number; y: number } | null>(null); // Startposition för drag
  const posRef = useRef({ x: 0, y: 0 }); // Ref för att undvika stale state

  // Öppnar en bild i zoom-läge
  const openZoom = useCallback((src: string) => {
    setZoomedImage(src);
    setScale(1);
    setPos({ x: 0, y: 0 });
    posRef.current = { x: 0, y: 0 };
    document.body.style.overflow = "hidden"; // Förhindra scrollning bakom
  }, []);

  // Stänger zoom-läget
  const closeZoom = useCallback(() => {
    setZoomedImage(null);
    setScale(1);
    setPos({ x: 0, y: 0 });
    document.body.style.overflow = ""; // Återställ scrollning
  }, []);

  // Native event listener för scroll-zoom (preventDefault fungerar inte med React's onWheel)
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const setOverlayRef = useCallback((el: HTMLDivElement | null) => {
    // Ta bort gammal listener
    if (overlayRef.current) {
      overlayRef.current.removeEventListener(
        "wheel",
        handleWheel as EventListener,
      );
    }
    overlayRef.current = el;
    // Lägg till ny listener
    if (el) {
      el.addEventListener("wheel", handleWheel as EventListener, {
        passive: false, // Krävs för preventDefault
      });
    }
  }, []);

  // Hanterar scroll-zoom (ctrl+scroll eller trackpad pinch)
  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Zooma in/ut baserat på scroll-riktning, begränsat mellan 1x och 8x
    setScale((s) => Math.min(8, Math.max(1, s - e.deltaY * 0.001 * s)));
  }

  // Startar drag-panorering
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStart.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
  }, []);

  // Uppdaterar position under drag
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const next = {
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    };
    posRef.current = next;
    setPos(next);
  }, []);

  // Avslutar drag
  const onMouseUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  // Dubbel-klick: växla mellan 1x och 2.5x zoom
  const onDblClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((s) => {
      const next = s > 1 ? 1 : 2.5;
      if (next === 1) {
        // Återställ position vid 1x zoom
        setPos({ x: 0, y: 0 });
        posRef.current = { x: 0, y: 0 };
      }
      return next;
    });
  }, []);

  // Touch pinch-to-zoom för mobil
  const lastDist = useRef<number | null>(null);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Beräkna avstånd mellan två fingrar
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastDist.current !== null) {
        // Zooma baserat på förändring i avstånd
        const delta = dist - lastDist.current;
        setScale((s) => Math.min(8, Math.max(1, s + delta * 0.01)));
      }
      lastDist.current = dist;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    lastDist.current = null;
  }, []);

  // Nuvarande fråga (används för att visa quiz-screen)
  const q = quiz.questions[quiz.current];

  return (
    <>
      {/* Zoom-overlay (visas när en bild klickas) */}
      {zoomedImage && (
        <div
          className="zoom-overlay"
          ref={setOverlayRef}
          onClick={closeZoom}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button className="zoom-close" onClick={closeZoom}>
            ✕
          </button>
          <div className="zoom-hint">
            {scale <= 1
              ? "Scrolla eller dubbeltryck för att zooma"
              : "Scrolla för att zooma · Dra för att panorera"}
          </div>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="zoom-img"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              cursor:
                scale > 1
                  ? dragStart.current
                    ? "grabbing"
                    : "grab"
                  : "zoom-in",
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={onDblClick}
            onMouseDown={onMouseDown}
            draggable={false}
          />
        </div>
      )}

      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="header-logo">Högskoleverket</div>
          <div className="header-dot" />
        </div>

        {/* Urvalssskärm: Välj läge, kategorier och inställningar */}
        {quiz.screen === "select" && (
          <SelectScreen
            mode={quiz.mode}
            setMode={quiz.setMode}
            selectedCats={quiz.selectedCats}
            toggleCat={quiz.toggleCat}
            setSelectedCats={quiz.setSelectedCats}
            allCategories={quiz.allCategories}
            loadingCats={quiz.loadingCats}
            settings={quiz.settings}
            setSettings={quiz.setSettings}
            onStart={quiz.startQuiz}
          />
        )}

        {/* Quiz-skärm: Visa frågor och svarsalternativ */}
        {quiz.screen === "quiz" && q && (
          <QuizScreen
            questions={quiz.questions}
            materialsMap={quiz.materialsMap}
            current={quiz.current}
            chosen={quiz.chosen}
            results={quiz.results}
            timer={quiz.timer}
            totalSeconds={quiz.totalSeconds}
            fontSize={fontSize}
            setFontSize={setFontSize}
            onBack={() => quiz.setScreen("select")}
            onAnswer={quiz.handleAnswer}
            onNext={quiz.handleNext}
            onZoom={openZoom}
          />
        )}

        {/* Resultatskärm: Visa poäng och genomgång */}
        {quiz.screen === "results" && (
          <ResultsScreen
            results={quiz.results}
            questions={quiz.questions}
            userAnswers={quiz.userAnswers}
            materialsMap={quiz.materialsMap}
            onRestart={quiz.restartQuiz}
            onBack={() => quiz.setScreen("select")}
            onZoom={openZoom}
          />
        )}
      </div>
    </>
  );
};

export default App;
