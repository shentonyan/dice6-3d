/**
 * Dice6 / Black Void — hardware-soft edition.
 * A softly radiused, low-contrast ceramic die is paired with settings revealed only by a deliberate long press.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Volume2, VolumeX, Vibrate, X } from "lucide-react";

type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

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

function playDiceSound() {
  const AudioConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioConstructor) return;
  const context = new AudioConstructor();
  const now = context.currentTime;
  [
    { time: 0, frequency: 1180, duration: 0.025, gain: 0.035 },
    { time: 0.12, frequency: 920, duration: 0.03, gain: 0.028 },
    { time: 0.26, frequency: 680, duration: 0.06, gain: 0.045 },
  ].forEach(({ time, frequency, duration, gain }) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now + time);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.58, now + time + duration);
    envelope.gain.setValueAtTime(0.0001, now + time);
    envelope.gain.exponentialRampToValueAtTime(gain, now + time + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);
    oscillator.connect(envelope).connect(context.destination);
    oscillator.start(now + time);
    oscillator.stop(now + time + duration + 0.01);
  });
  window.setTimeout(() => void context.close(), 420);
}

function addPips(group: THREE.Group, value: DiceValue, face: DiceValue, material: THREE.Material) {
  const discGeometry = new THREE.CircleGeometry(0.145, 40);
  const depth = 1.408;
  const spacing = 0.57;

  pipPoints[value].forEach(([u, v]) => {
    const pip = new THREE.Mesh(discGeometry, material);
    if (face === 1) pip.position.set(u * spacing, v * spacing, depth);
    if (face === 6) { pip.position.set(-u * spacing, v * spacing, -depth); pip.rotation.y = Math.PI; }
    if (face === 2) { pip.position.set(depth, v * spacing, -u * spacing); pip.rotation.y = Math.PI / 2; }
    if (face === 5) { pip.position.set(-depth, v * spacing, u * spacing); pip.rotation.y = -Math.PI / 2; }
    if (face === 3) { pip.position.set(u * spacing, depth, -v * spacing); pip.rotation.x = -Math.PI / 2; }
    if (face === 4) { pip.position.set(u * spacing, -depth, v * spacing); pip.rotation.x = Math.PI / 2; }
    group.add(pip);
  });
}

function DiceRender({ angles, rolling }: { angles: { x: number; y: number }; rolling: boolean }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const targetRef = useRef(new THREE.Euler(0, 0, 0));
  const rollingUntil = useRef(0);

  useEffect(() => {
    targetRef.current.set(THREE.MathUtils.degToRad(angles.x), THREE.MathUtils.degToRad(angles.y), 0);
    if (rolling) rollingUntil.current = performance.now() + 920;
  }, [angles, rolling]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 100);
    camera.position.set(0, 0, 8.65);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    host.appendChild(renderer.domElement);

    const die = new THREE.Group();
    die.rotation.set(0, 0, 0);
    scene.add(die);

    const ceramic = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafb,
      roughness: 0.38,
      metalness: 0,
      clearcoat: 0.16,
      clearcoatRoughness: 0.42,
    });
    const pipMaterial = new THREE.MeshStandardMaterial({ color: 0x090a0b, roughness: 0.32, metalness: 0 });
    const body = new THREE.Mesh(new RoundedBoxGeometry(2.8, 2.8, 2.8, 16, 0.52), ceramic);
    die.add(body);
    addPips(die, 1, 1, pipMaterial);
    addPips(die, 2, 2, pipMaterial);
    addPips(die, 3, 3, pipMaterial);
    addPips(die, 4, 4, pipMaterial);
    addPips(die, 5, 5, pipMaterial);
    addPips(die, 6, 6, pipMaterial);

    const keyLight = new THREE.DirectionalLight(0xfffef9, 5.2);
    keyLight.position.set(-3.8, 4.6, 6);
    scene.add(keyLight);
    const coolFill = new THREE.DirectionalLight(0xddecf5, 1.15);
    coolFill.position.set(4.4, 0.8, 3.5);
    scene.add(coolFill);
    const rimLight = new THREE.DirectionalLight(0xd7ebf5, 1.8);
    rimLight.position.set(1.4, 3.8, -4.5);
    scene.add(rimLight);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x35414a, 1.35));

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const width = Math.max(1, bounds.width || 300);
      const height = Math.max(1, bounds.height || width);
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
      die.rotation.x = THREE.MathUtils.damp(die.rotation.x, target.x, 11, delta);
      die.rotation.y = THREE.MathUtils.damp(die.rotation.y, target.y, 11, delta);
      die.position.y = 0;
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
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <span ref={hostRef} className="die-render" aria-hidden="true" />;
}

export default function Home() {
  const [value, setValue] = useState<DiceValue>(1);
  const [rolling, setRolling] = useState(false);
  const [angles, setAngles] = useState({ x: 0, y: 0 });
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("dice6-sound") !== "off");
  const [hapticsEnabled, setHapticsEnabled] = useState(() => localStorage.getItem("dice6-haptics") !== "off");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  useEffect(() => {
    localStorage.setItem("dice6-sound", soundEnabled ? "on" : "off");
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("dice6-haptics", hapticsEnabled ? "on" : "off");
  }, [hapticsEnabled]);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }, []);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  const roll = useCallback(() => {
    if (rolling) return;
    const next = (Math.floor(Math.random() * 6) + 1) as DiceValue;
    const target = faceAngles[next];
    const baseX = Math.ceil((angles.x - target.x) / 360) * 360;
    const baseY = Math.ceil((angles.y - target.y) / 360) * 360;
    setRolling(true);
    setValue(next);
    setAngles({ x: target.x + baseX + 720, y: target.y + baseY + 1080 });
    if (hapticsEnabled) navigator.vibrate?.(8);
    if (soundEnabled) playDiceSound();
    window.setTimeout(() => {
      if (hapticsEnabled) navigator.vibrate?.([6, 24, 12]);
      setRolling(false);
    }, 920);
  }, [angles, hapticsEnabled, rolling, soundEnabled]);

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

  const currentLabel = useMemo(() => (rolling ? "骰子正在投掷" : `投掷骰子，当前为 ${value} 点`), [rolling, value]);

  const startLongPress = () => {
    if (rolling) return;
    longPressTriggered.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      setSettingsOpen(true);
      if (hapticsEnabled) navigator.vibrate?.(8);
    }, 650);
  };

  const handleDiceClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    roll();
  };

  return (
    <main className="black-void">
      <button className="die-button" type="button" onClick={handleDiceClick} onPointerDown={startLongPress} onPointerUp={clearLongPress} onPointerLeave={clearLongPress} onPointerCancel={clearLongPress} onContextMenu={(event) => event.preventDefault()} disabled={rolling} aria-label={currentLabel}>
        <DiceRender angles={angles} rolling={rolling} />
      </button>
      {settingsOpen && (
        <div className="settings-layer" role="presentation">
          <button className="settings-scrim" type="button" onClick={() => setSettingsOpen(false)} aria-label="关闭反馈设置" />
          <section className="settings-sheet" role="dialog" aria-modal="true" aria-label="投掷反馈设置">
            <header><span>FEEDBACK</span><button type="button" onClick={() => setSettingsOpen(false)} aria-label="关闭"><X size={16} strokeWidth={1.7} /></button></header>
            <button className="setting-row" type="button" onClick={() => setSoundEnabled((enabled) => !enabled)} aria-pressed={soundEnabled}>
              {soundEnabled ? <Volume2 size={17} strokeWidth={1.6} /> : <VolumeX size={17} strokeWidth={1.6} />}<span>音效</span><i>{soundEnabled ? "开" : "关"}</i>
            </button>
            <button className="setting-row" type="button" onClick={() => setHapticsEnabled((enabled) => !enabled)} aria-pressed={hapticsEnabled}>
              <Vibrate size={17} strokeWidth={1.6} /><span>震动</span><i>{hapticsEnabled ? "开" : "关"}</i>
            </button>
            <p>长按骰子以打开此设置</p>
          </section>
        </div>
      )}
      <span className="sr-only" aria-live="polite">{rolling ? "骰子投掷中" : `当前骰子为 ${value} 点`}</span>
    </main>
  );
}
