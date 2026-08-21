/**
 * Dice6 / Black Void — pure roll edition.
 * A single softly lit ceramic die remains the entire interface: tap to roll, with only an edge-revealed fullscreen control.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Maximize2, Minimize2 } from "lucide-react";

type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
type DiceState = { value: DiceValue; angles: { x: number; y: number } };

const faceAngles: Record<DiceValue, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: 90, y: 0 },
  4: { x: -90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
};

const pipPoints: Record<DiceValue, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, 1], [1, -1]],
  3: [[-1, 1], [0, 0], [1, -1]],
  4: [[-1, 1], [1, 1], [-1, -1], [1, -1]],
  5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]],
  6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]],
};

function createDiceStates(count: number): DiceState[] {
  return Array.from({ length: count }, () => ({ value: 1, angles: { x: 0, y: 0 } }));
}

function addPips(group: THREE.Group, value: DiceValue, face: DiceValue, material: THREE.Material, rimMaterial: THREE.Material) {
  const discGeometry = new THREE.CircleGeometry(0.145, 48);
  const rimGeometry = new THREE.RingGeometry(0.145, 0.165, 48);
  const depth = 1.405;
  const spacing = 0.57;

  pipPoints[value].forEach(([u, v]) => {
    const pipGroup = new THREE.Group();
    const pip = new THREE.Mesh(discGeometry, material);
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.z = -0.002;
    pipGroup.add(rim, pip);
    if (face === 1) pipGroup.position.set(u * spacing, v * spacing, depth);
    if (face === 6) { pipGroup.position.set(-u * spacing, v * spacing, -depth); pipGroup.rotation.y = Math.PI; }
    if (face === 2) { pipGroup.position.set(depth, v * spacing, -u * spacing); pipGroup.rotation.y = Math.PI / 2; }
    if (face === 5) { pipGroup.position.set(-depth, v * spacing, u * spacing); pipGroup.rotation.y = -Math.PI / 2; }
    if (face === 3) { pipGroup.position.set(u * spacing, depth, -v * spacing); pipGroup.rotation.x = -Math.PI / 2; }
    if (face === 4) { pipGroup.position.set(u * spacing, -depth, v * spacing); pipGroup.rotation.x = Math.PI / 2; }
    group.add(pipGroup);
  });
}

function addTopHighlight(group: THREE.Group, face: DiceValue, material: THREE.Material) {
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.78, 0.022), material);
  const depth = 1.407;
  const inset = 1.09;
  if (face === 1) strip.position.set(0, inset, depth);
  if (face === 6) { strip.position.set(0, inset, -depth); strip.rotation.y = Math.PI; }
  if (face === 2) { strip.position.set(depth, inset, 0); strip.rotation.y = Math.PI / 2; }
  if (face === 5) { strip.position.set(-depth, inset, 0); strip.rotation.y = -Math.PI / 2; }
  if (face === 3) { strip.position.set(0, depth, -inset); strip.rotation.x = -Math.PI / 2; }
  if (face === 4) { strip.position.set(0, -depth, inset); strip.rotation.x = Math.PI / 2; }
  group.add(strip);
}

function DiceRender({ angles, rolling }: { angles: { x: number; y: number }; rolling: boolean }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const targetRef = useRef(new THREE.Euler(0, 0, 0));
  const rollStartedAt = useRef(0);
  const driftRef = useRef({ x: 0, y: 0, phase: 0 });

  useEffect(() => {
    targetRef.current.set(THREE.MathUtils.degToRad(angles.x), THREE.MathUtils.degToRad(angles.y), 0);
    if (rolling) {
      rollStartedAt.current = performance.now();
      driftRef.current = {
        x: (Math.random() > 0.5 ? 1 : -1) * (0.095 + Math.random() * 0.035),
        y: (Math.random() - 0.5) * 0.045,
        phase: Math.random() * 0.45,
      };
    }
  }, [angles, rolling]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 100);
    camera.position.set(0, 0, 8.65);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    host.appendChild(renderer.domElement);

    const die = new THREE.Group();
    die.rotation.set(0, 0, 0);
    scene.add(die);

    const ceramic = new THREE.MeshPhysicalMaterial({
      color: 0xf2f5f6,
      roughness: 0.46,
      metalness: 0,
      clearcoat: 0.07,
      clearcoatRoughness: 0.36,
    });
    const pipMaterial = new THREE.MeshStandardMaterial({ color: 0x111416, roughness: 0.48, metalness: 0 });
    const pipRimMaterial = new THREE.MeshBasicMaterial({ color: 0x87949a, transparent: true, opacity: 0.075, side: THREE.DoubleSide });
    const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false });
    const body = new THREE.Mesh(new RoundedBoxGeometry(2.8, 2.8, 2.8, 18, 0.52), ceramic);
    die.add(body);
    addPips(die, 1, 1, pipMaterial, pipRimMaterial);
    addPips(die, 2, 2, pipMaterial, pipRimMaterial);
    addPips(die, 3, 3, pipMaterial, pipRimMaterial);
    addPips(die, 4, 4, pipMaterial, pipRimMaterial);
    addPips(die, 5, 5, pipMaterial, pipRimMaterial);
    addPips(die, 6, 6, pipMaterial, pipRimMaterial);
    addTopHighlight(die, 1, highlightMaterial);
    addTopHighlight(die, 2, highlightMaterial);
    addTopHighlight(die, 3, highlightMaterial);
    addTopHighlight(die, 4, highlightMaterial);
    addTopHighlight(die, 5, highlightMaterial);
    addTopHighlight(die, 6, highlightMaterial);

    const keyLight = new THREE.DirectionalLight(0xf9fbfb, 3.75);
    keyLight.position.set(-0.65, 4.8, 6.5);
    scene.add(keyLight);
    const coolFill = new THREE.DirectionalLight(0xf0f6f8, 1.08);
    coolFill.position.set(-4.2, 1.8, 4.3);
    scene.add(coolFill);
    const rimLight = new THREE.DirectionalLight(0xd8e5e9, 0.68);
    rimLight.position.set(3.8, 3.6, -3.8);
    scene.add(rimLight);
    const topGlow = new THREE.SpotLight(0xffffff, 1.5, 13, 0.62, 0.9, 1.8);
    topGlow.position.set(0, 5.2, 5.2);
    topGlow.target.position.set(0, 0.55, 0);
    scene.add(topGlow, topGlow.target);
    scene.add(new THREE.HemisphereLight(0xf8fafb, 0xe9eff1, 1.55));

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const width = Math.max(1, bounds.width || 300);
      const height = Math.max(1, bounds.height || width);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    renderer.render(scene, camera);

    let frameId = 0;
    let previousTime = performance.now();
    let lastRenderTime = 0;
    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      if (now - lastRenderTime < 22) return;
      const delta = Math.min(0.04, Math.max(0.001, (now - previousTime) / 1000));
      previousTime = now;
      lastRenderTime = now;
      const target = targetRef.current;
      const elapsed = now - rollStartedAt.current;
      const isRolling = rolling && elapsed < 800;
      const isSettling = rolling && elapsed >= 800 && elapsed < 920;
      const progress = isRolling ? Math.min(elapsed / 800, 1) : 1;
      const pauseFactor = isRolling && progress > 0.44 && progress < 0.56 ? 0.16 : 1;
      const drift = driftRef.current;
      const sway = isRolling ? Math.sin(progress * Math.PI) * (1 - progress * 0.25) : 0;
      const settleDamping = isSettling ? 30 : 12;
      die.rotation.x = THREE.MathUtils.damp(die.rotation.x, target.x, isRolling ? 11 * pauseFactor : settleDamping, delta);
      die.rotation.y = THREE.MathUtils.damp(die.rotation.y, target.y, isRolling ? 11 * pauseFactor : settleDamping, delta);
      die.position.x = THREE.MathUtils.damp(die.position.x, drift.x * sway, isRolling ? 16 : settleDamping, delta);
      die.position.y = THREE.MathUtils.damp(die.position.y, drift.y * sway, isRolling ? 16 : settleDamping, delta);
      die.rotation.z = THREE.MathUtils.damp(die.rotation.z, isRolling ? Math.sin((progress + drift.phase) * Math.PI * 2) * 0.035 * (1 - progress) : 0, isSettling ? 32 : 10, delta);
      die.scale.setScalar(1);
      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      body.geometry.dispose();
      ceramic.dispose();
      pipMaterial.dispose();
      pipRimMaterial.dispose();
      highlightMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <span ref={hostRef} className="die-render" aria-hidden="true" />;
}

export default function Home() {
  const rootRef = useRef<HTMLElement>(null);
  const [diceCount, setDiceCount] = useState(1);
  const [diceStates, setDiceStates] = useState<DiceState[]>(() => createDiceStates(1));
  const [rolling, setRolling] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenControlVisible, setFullscreenControlVisible] = useState(false);
  const [showIntroPulse, setShowIntroPulse] = useState(() => localStorage.getItem("dice6-intro-pulse") !== "seen");
  const fullscreenHideTimer = useRef<number | null>(null);

  const triggerLandingHaptic = useCallback(() => {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    try {
      navigator.vibrate(10);
    } catch {
      // Unsupported browsers, including iPhone Safari, silently retain the visual-only experience.
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const root = rootRef.current;
    if (!root) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.requestFullscreen();
    } catch {
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const updateFullscreenState = () => {
      const active = document.fullscreenElement === rootRef.current;
      setIsFullscreen(active);
      setFullscreenControlVisible(false);
    };
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  const revealFullscreenControl = useCallback(() => {
    setFullscreenControlVisible(true);
    if (fullscreenHideTimer.current !== null) window.clearTimeout(fullscreenHideTimer.current);
    fullscreenHideTimer.current = window.setTimeout(() => setFullscreenControlVisible(false), 1500);
  }, []);

  useEffect(() => () => {
    if (fullscreenHideTimer.current !== null) window.clearTimeout(fullscreenHideTimer.current);
  }, []);

  useEffect(() => {
    if (!showIntroPulse) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem("dice6-intro-pulse", "seen");
      setShowIntroPulse(false);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [showIntroPulse]);

  const selectDiceCount = (count: number) => {
    if (rolling) return;
    setDiceCount(count);
    setDiceStates(createDiceStates(count));
    revealFullscreenControl();
  };

  const roll = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    setDiceStates((current) => current.map((dice, index) => {
      const next = (Math.floor(Math.random() * 6) + 1) as DiceValue;
      const target = faceAngles[next];
      const baseX = Math.ceil((dice.angles.x - target.x) / 360) * 360;
      const baseY = Math.ceil((dice.angles.y - target.y) / 360) * 360;
      return { value: next, angles: { x: target.x + baseX + 720 + index * 34, y: target.y + baseY + 1080 + index * 48 } };
    }));
    window.setTimeout(() => {
      triggerLandingHaptic();
      setRolling(false);
    }, 920);
  }, [rolling, triggerLandingHaptic]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        roll();
      }
      if (event.code === "KeyF") {
        event.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [roll, toggleFullscreen]);

  const currentLabel = useMemo(() => (rolling ? "骰子正在投掷" : `投掷 ${diceCount} 枚骰子，当前为 ${diceStates.map((dice) => dice.value).join("、")} 点`), [diceCount, diceStates, rolling]);

  const revealControlFromEdge = (event: React.PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const nearTopOrRightEdge = event.clientX > bounds.right - 56 || event.clientY < bounds.top + 56;
    if (nearTopOrRightEdge) revealFullscreenControl();
  };

  return (
    <main ref={rootRef} className={`black-void ${isFullscreen ? "is-fullscreen" : ""} ${showIntroPulse ? "intro-pulse" : ""}`} onPointerMove={revealControlFromEdge} onPointerDown={revealControlFromEdge}>
      <div className={`dice-mode-picker ${fullscreenControlVisible ? "is-visible" : ""}`} role="group" aria-label="骰子数量">
        {[1, 2, 3, 4].map((count) => <button key={count} type="button" onClick={() => selectDiceCount(count)} aria-pressed={diceCount === count} tabIndex={fullscreenControlVisible ? 0 : -1}>{count}</button>)}
      </div>
      <button className={`fullscreen-button ${fullscreenControlVisible ? "is-visible" : ""}`} type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? "退出全屏" : "进入全屏"} title={isFullscreen ? "退出全屏" : "进入全屏（F）"} tabIndex={fullscreenControlVisible ? 0 : -1}>
        {isFullscreen ? <Minimize2 size={17} strokeWidth={1.5} /> : <Maximize2 size={17} strokeWidth={1.5} />}
      </button>
      <div className={`dice-cluster count-${diceCount}`} aria-label={currentLabel}>
        {diceStates.map((dice, index) => (
          <button className={`die-button ${rolling ? "is-rolling" : ""}`} key={index} type="button" onClick={roll} disabled={rolling} aria-label={currentLabel}>
            <DiceRender angles={dice.angles} rolling={rolling} />
          </button>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">{rolling ? "骰子投掷中" : `当前骰子为 ${diceStates.map((dice) => dice.value).join("、")} 点`}</span>
    </main>
  );
}
