/**
 * Dice6 / Black Void — pure roll edition.
 * A single softly lit ceramic die remains the entire interface: tap to roll, with no persistent settings or feedback chrome.
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

function addPips(group: THREE.Group, value: DiceValue, face: DiceValue, material: THREE.Material) {
  const discGeometry = new THREE.CircleGeometry(0.145, 48);
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

function DiceRender({ angles }: { angles: { x: number; y: number } }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const targetRef = useRef(new THREE.Euler(0, 0, 0));

  useEffect(() => {
    targetRef.current.set(THREE.MathUtils.degToRad(angles.x), THREE.MathUtils.degToRad(angles.y), 0);
  }, [angles]);

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
      color: 0xfbfcfd,
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.3,
    });
    const pipMaterial = new THREE.MeshStandardMaterial({ color: 0x090a0b, roughness: 0.32, metalness: 0 });
    const body = new THREE.Mesh(new RoundedBoxGeometry(2.8, 2.8, 2.8, 18, 0.52), ceramic);
    die.add(body);
    addPips(die, 1, 1, pipMaterial);
    addPips(die, 2, 2, pipMaterial);
    addPips(die, 3, 3, pipMaterial);
    addPips(die, 4, 4, pipMaterial);
    addPips(die, 5, 5, pipMaterial);
    addPips(die, 6, 6, pipMaterial);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.25);
    keyLight.position.set(-0.65, 4.8, 6.5);
    scene.add(keyLight);
    const coolFill = new THREE.DirectionalLight(0xf3fbff, 1.45);
    coolFill.position.set(-4.2, 1.8, 4.3);
    scene.add(coolFill);
    const rimLight = new THREE.DirectionalLight(0xcfe7f4, 1.1);
    rimLight.position.set(3.8, 3.6, -3.8);
    scene.add(rimLight);
    const topGlow = new THREE.SpotLight(0xffffff, 2.1, 13, 0.62, 0.9, 1.8);
    topGlow.position.set(0, 5.2, 5.2);
    topGlow.target.position.set(0, 0.55, 0);
    scene.add(topGlow, topGlow.target);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xf9fcfd, 1.8));

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

  const roll = useCallback(() => {
    if (rolling) return;
    const next = (Math.floor(Math.random() * 6) + 1) as DiceValue;
    const target = faceAngles[next];
    const baseX = Math.ceil((angles.x - target.x) / 360) * 360;
    const baseY = Math.ceil((angles.y - target.y) / 360) * 360;
    setRolling(true);
    setValue(next);
    setAngles({ x: target.x + baseX + 720, y: target.y + baseY + 1080 });
    window.setTimeout(() => {
      setRolling(false);
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
      <button className="die-button" type="button" onClick={roll} disabled={rolling} aria-label={currentLabel}>
        <DiceRender angles={angles} />
      </button>
      <span className="sr-only" aria-live="polite">{rolling ? "骰子投掷中" : `当前骰子为 ${value} 点`}</span>
    </main>
  );
}
