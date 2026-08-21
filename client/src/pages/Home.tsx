/**
 * Dice6 / Black Void — reference-driven minimalism.
 * Pure black space, one softly lit white die, and a nearly silent Recent record.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

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
    <span className={`dice-face ${className}`} aria-hidden="true">
      {pips[value].map((position) => <i className={`pip ${position}`} key={position} />)}
    </span>
  );
}

export default function Home() {
  const [value, setValue] = useState<DiceValue>(1);
  const [history, setHistory] = useState<DiceValue[]>([]);
  const [rolling, setRolling] = useState(false);
  const [angles, setAngles] = useState({ x: -16, y: 28 });

  const roll = useCallback(() => {
    if (rolling) return;

    const next = (Math.floor(Math.random() * 6) + 1) as DiceValue;
    const target = faceAngles[next];
    const baseX = Math.ceil((angles.x - target.x) / 360) * 360;
    const baseY = Math.ceil((angles.y - target.y) / 360) * 360;

    setRolling(true);
    setValue(next);
    setAngles({ x: target.x + baseX + 720, y: target.y + baseY + 1080 });
    navigator.vibrate?.(10);

    window.setTimeout(() => {
      setRolling(false);
      setHistory((items) => [next, ...items].slice(0, 6));
    }, 920);
  }, [angles, rolling]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        roll();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [roll]);

  const cubeStyle = useMemo(
    () => ({ transform: `rotateX(${angles.x}deg) rotateY(${angles.y}deg)` }),
    [angles],
  );

  return (
    <main className="black-void">
      <button
        className={`die-button ${rolling ? "is-rolling" : ""}`}
        type="button"
        onClick={roll}
        disabled={rolling}
        aria-label={rolling ? "骰子正在投掷" : `投掷骰子，当前为 ${value} 点`}
      >
        <span className="die-scene">
          <span className="soft-glow" aria-hidden="true" />
          <span className="dice-cube" style={cubeStyle}>
            <Face value={1} className="face-front" />
            <Face value={2} className="face-right" />
            <Face value={6} className="face-back" />
            <Face value={5} className="face-left" />
            <Face value={3} className="face-top" />
            <Face value={4} className="face-bottom" />
          </span>
        </span>
      </button>

      <aside className="recent" aria-label="最近投掷记录">
        <span className="recent-label">RECENT</span>
        <span className="recent-values">
          {history.length
            ? history.map((item, index) => <i key={`${item}-${index}`}>{item}</i>)
            : <i className="recent-empty">—</i>}
        </span>
      </aside>

      <span className="sr-only" aria-live="polite">
        {rolling ? "骰子投掷中" : `当前骰子为 ${value} 点`}
      </span>
    </main>
  );
}
