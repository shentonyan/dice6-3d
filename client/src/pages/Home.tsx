/**
 * Dice6 / Black Void — continuous geometry edition.
 * One Three.js rounded-box mesh replaces stitched CSS faces, so all eight corners remain continuous.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

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

function createShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Texture();
  const gradient = context.createRadialGradient(80, 80, 2, 80, 80, 78);
  gradient.addColorStop(0, "rgba(172, 208, 224, 0.54)");
  gradient.addColorStop(0.34, "rgba(111, 148, 165, 0.22)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 160, 160);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

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
  const discGeometry = new THREE.CircleGeometry(0.145, 28);
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
  const targetRef = useRef(new THREE.Euler(-0.28, 0.48, 0));
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
    camera.position.set(0, 0.72, 8.65);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;
    host.appendChild(renderer.domElement);

    const die = new THREE.Group();
    die.rotation.set(-0.28, 0.48, 0);
    scene.add(die);

    const ceramic = new THREE.MeshPhysicalMaterial({
      color: 0xf7fcff,
      roughness: 0.3,
      metalness: 0,
      clearcoat: 0.12,
      clearcoatRoughness: 0.3,
    });
    const pipMaterial = new THREE.MeshStandardMaterial({ color: 0x090a0b, roughness: 0.32, metalness: 0 });
    const body = new THREE.Mesh(new RoundedBoxGeometry(2.8, 2.8, 2.8, 12, 0.44), ceramic);
    die.add(body);
    addPips(die, 1, 1, pipMaterial);
    addPips(die, 2, 2, pipMaterial);
    addPips(die, 3, 3, pipMaterial);
    addPips(die, 4, 4, pipMaterial);
    addPips(die, 5, 5, pipMaterial);
    addPips(die, 6, 6, pipMaterial);

    const shadowTexture = createShadowTexture();
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0.9 });
    const groundShadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.2), shadowMaterial);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = -1.49;
    groundShadow.scale.set(1.12, 0.64, 1);
    scene.add(groundShadow);

    const keyLight = new THREE.DirectionalLight(0xffffff, 5.5);
    keyLight.position.set(-3.5, 4.2, 6);
    scene.add(keyLight);
    const coolFill = new THREE.DirectionalLight(0xd7edff, 1.8);
    coolFill.position.set(4, 0.4, 3);
    scene.add(coolFill);
    const rimLight = new THREE.DirectionalLight(0xbfd9e8, 2.2);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0xffffff, 1.45));

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frameId = 0;
    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      const target = targetRef.current;
      die.rotation.x = THREE.MathUtils.damp(die.rotation.x, target.x, 10, 1 / 60);
      die.rotation.y = THREE.MathUtils.damp(die.rotation.y, target.y, 10, 1 / 60);
      const remaining = Math.max(0, rollingUntil.current - now);
      const progress = 1 - remaining / 920;
      const lift = remaining ? Math.sin(progress * Math.PI) : 0;
      die.position.y = lift * 0.22;
      die.scale.setScalar(1 - lift * 0.018);
      groundShadow.scale.set(1.12 - lift * 0.32, 0.64 - lift * 0.19, 1);
      shadowMaterial.opacity = 0.88 - lift * 0.56;
      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      body.geometry.dispose();
      ceramic.dispose();
      pipMaterial.dispose();
      groundShadow.geometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <span ref={hostRef} className="die-render" aria-hidden="true" />;
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
    navigator.vibrate?.(8);
    playDiceSound();
    window.setTimeout(() => {
      navigator.vibrate?.([6, 24, 12]);
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

  const currentLabel = useMemo(() => (rolling ? "骰子正在投掷" : `投掷骰子，当前为 ${value} 点`), [rolling, value]);

  return (
    <main className="black-void">
      <button className={`die-button ${rolling ? "is-rolling" : ""}`} type="button" onClick={roll} disabled={rolling} aria-label={currentLabel}>
        <span className="ambient-contact-shadow" aria-hidden="true" />
        <DiceRender angles={angles} rolling={rolling} />
      </button>
      <aside className="recent" aria-label="最近投掷记录">
        <span className="recent-label">RECENT</span>
        <span className="recent-values">
          {history.length ? history.map((item, index) => <i key={`${item}-${index}`}>{item}</i>) : <i className="recent-empty">—</i>}
        </span>
      </aside>
      <span className="sr-only" aria-live="polite">{rolling ? "骰子投掷中" : `当前骰子为 ${value} 点`}</span>
    </main>
  );
}
