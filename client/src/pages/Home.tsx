/**
 * Dice6 / Monumental Object
 * Warm-white sculptural playing surface, strict monochrome information design,
 * and a single tactile 3D dice are the entire interface.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCw } from "lucide-react";

type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

const faceAngles: Record<DiceValue, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
};

const pips: Record<DiceValue, string[]> = {
  1: ["center"],
  2: ["top-left", "bottom-right"],
  3: ["top-left", "center", "bottom-right"],
  4: ["top-left", "top-right", "bottom-left", "bottom-right"],
  5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
  6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
};

function Face({ value, className }: { value: DiceValue; className: string }) {
  return (
    <div className={`dice-face ${className}`} aria-hidden="true">
      {pips[value].map((position) => (
        <span className={`pip ${position}`} key={position} />
      ))}
    </div>
  );
}

export default function Home() {
  const [value, setValue] = useState<DiceValue>(1);
  const [rolling, setRolling] = useState(false);
  const [angles, setAngles] = useState({ x: -18, y: 32 });
  const [history, setHistory] = useState<DiceValue[]>([]);

  const roll = useCallback(() => {
    if (rolling) return;

    const next = (Math.floor(Math.random() * 6) + 1) as DiceValue;
    const target = faceAngles[next];
    const normalizedX = Math.ceil((angles.x - target.x) / 360) * 360;
    const normalizedY = Math.ceil((angles.y - target.y) / 360) * 360;

    setRolling(true);
    setValue(next);
    setAngles({
      x: target.x + normalizedX + 720,
      y: target.y + normalizedY + 1080,
    });

    if ("vibrate" in navigator) navigator.vibrate?.(12);

    window.setTimeout(() => {
      setRolling(false);
      setHistory((items) => [next, ...items].slice(0, 6));
    }, 920);
  }, [angles, rolling]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        roll();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [roll]);

  const angleStyle = useMemo(
    () => ({ transform: `rotateX(${angles.x}deg) rotateY(${angles.y}deg)` }),
    [angles],
  );

  const actionLabel = history.length ? "再来一次" : "掷出这一面";

  return (
    <main className="dice-app">
      <div className="ambient-art ambient-plinth" aria-hidden="true" />
      <div className="ambient-art ambient-shadow" aria-hidden="true" />

      <header className="app-header">
        <div className="brand-lockup" aria-label="Dice6">
          <span className="brand-mark" aria-hidden="true">
            <img src="/manus-storage/dice6-mark_707d0c63.png" alt="" className="brand-mark-source" />
            <i /><i /><i /><i /><i /><i />
          </span>
          <span>DICE6</span>
        </div>
        <p className="status-line" aria-live="polite">
          {rolling ? "IN MOTION" : "READY"}
        </p>
      </header>

      <section className="throw-stage" aria-label="骰子投掷台">
        <div className="stage-index" aria-hidden="true">
          <span>01</span>
          <i />
          <span>06</span>
        </div>
        <p className="instruction">掷出这一面</p>

        <button
          type="button"
          className={`dice-trigger ${rolling ? "is-rolling" : ""}`}
          onClick={roll}
          aria-label={rolling ? "骰子正在投掷" : "投掷骰子"}
          disabled={rolling}
        >
          <span className="dice-scene">
            <span className="contact-shadow" />
            <span className="dice-cube" style={angleStyle}>
              <Face value={1} className="face-front" />
              <Face value={2} className="face-right" />
              <Face value={6} className="face-back" />
              <Face value={5} className="face-left" />
              <Face value={3} className="face-top" />
              <Face value={4} className="face-bottom" />
            </span>
          </span>
        </button>

        <div className="stage-floor" aria-hidden="true">
          <span className="floor-axis horizontal" />
          <span className="floor-axis vertical" />
          <span className="floor-line one" />
          <span className="floor-line two" />
          <span className="floor-line three" />
        </div>
      </section>

      <section className="result-dock" aria-label="投掷结果与控制">
        <div className="result-summary">
          <span className="eyebrow">ROLL READOUT</span>
          <strong className={rolling ? "is-changing" : ""}>{value}</strong>
          <span className="result-word">{rolling ? "落下中" : "这一面"}</span>
        </div>

        <button type="button" className="roll-button" onClick={roll} disabled={rolling}>
          {rolling && <RotateCw size={19} strokeWidth={1.8} className="spinning" />}
          <span>{rolling ? "落下中" : actionLabel}</span>
          <kbd>SPACE</kbd>
        </button>

        <div className="history" aria-label="最近投掷记录">
          <span className="history-label">RECENT</span>
          <div className="history-values">
            {history.length ? history.map((rollValue, index) => (
              <span key={`${rollValue}-${index}`}>{rollValue}</span>
            )) : <span className="empty-history">— — —</span>}
          </div>
        </div>
      </section>
    </main>
  );
}
