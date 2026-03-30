import "./TimerRing.css";

interface TimerRingProps {
  seconds: number;
  totalSeconds: number;
}

/** Formaterar Sekunder till M:SS */
function fmt(s: number): string {
  const minute = Math.floor(s / 60);
  const second = s % 60;
  return `${minute}:${second.toString().padStart(2, "0")}`;
}

/* Cirkulär quiz-timer som visar återstående tid för hela quizet (MM:SS).
   Färgen ändras: teal → gold → red baserat på andel tid kvar. */
export default function TimerRing({ seconds, totalSeconds }: TimerRingProps) {
  // Radius av cirkel
  const radius = 17;
  // Cirkel omkrets
  const circle = 2 * Math.PI * radius;
  // procent av tiden
  const percentTime = totalSeconds > 0 ? seconds / totalSeconds : 0;
  // Snurra på cirkeln beroende på hur mycket tid som är kvar
  const offset = circle * (1 - percentTime);
  // Byt färg beroende på tid kvar, 100-50% -> Teal. 50-25% -> Gold. 25-0% Röd
  const color =
    percentTime > 0.5 ? "#035c67" : percentTime > 0.25 ? "#ffb71b" : "#991b1b";

  return (
    // Wrapper för hela timer-komponenten (ringen + siffran i mitten)
    <div className="timer-ring">
      {/* SVG används för att rita den cirkulära timern */}
      <svg width="44" height="44" viewBox="0 0 44 44">
        {/* Bakgrundscirkel (spåret som timern fylls ovanpå) */}
        <circle
          className="track" // CSS-klass för bakgrundsstyling
          cx="22" // x-position för cirkel (centrum)
          cy="22" // y-position för cirkel (centrum)
          r={radius} // radie på cirkeln
          strokeWidth="3" // tjocklek på cirkelns kant
        />

        {/* Den cirkel som fylls/töms beroende på hur mycket tid som är kvar */}
        <circle
          className="fill" // CSS-klass för den aktiva timer-linjen
          cx="22" // centrum x
          cy="22" // centrum y
          r={radius} // samma radie som bakgrundscirkeln
          strokeWidth="3" // kanttjocklek
          stroke={color} // färgen på timerns progress
          strokeDasharray={circle} // totala längden på cirkelns kant
          strokeDashoffset={offset} // hur mycket av cirkeln som ska vara "gömd" (används för progress)
        />
      </svg>

      {/* Texten i mitten som visar återstående sekunder */}
      <div className="timer-num">
        {fmt(seconds)} {/* formatterar sekunder till t.ex. 01:23 */}
      </div>
    </div>
  );
}
