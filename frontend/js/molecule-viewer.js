import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ATOM_COLORS = {
  C: 0x60a5fa,
  N: 0x8b5cf6,
  O: 0xfb7185,
  S: 0xfacc15,
  P: 0xf97316,
  H: 0xe5e7eb,
  CL: 0x22c55e,
  BR: 0xb45309,
  F: 0x84cc16,
  I: 0xa855f7,
};

const MIN_VISUALIZED_ATOMS = 3;
const MAX_VISUALIZED_ATOMS = 64;
const ORBIT_DAMPING_FACTOR = 0.06;

/**
 * Lightweight atom token extraction for demo visualization.
 * This is not a full SMILES parser and intentionally ignores bonds,
 * branches, aromatic notation, ring closures, and stereochemistry.
 */
function parseAtomsFromSmiles(smiles = "") {
  const tokens = smiles.match(/Cl|Br|I|[A-Z][a-z]?/g) || [];
  return tokens.map((t) => t.toUpperCase());
}

export function initMoleculeViewer(container, options = {}) {
  if (!container) return () => {};
  const drugName = options?.drugName || "Candidate";
  const smiles = options?.smiles || "";

  container.innerHTML = "";
  if (!smiles) {
    container.innerHTML = `<div class="molecule-fallback"><strong>${drugName}</strong><br><span>SMILES not available</span></div>`;
    return () => {};
  }

  const canvas = document.createElement("canvas");
  canvas.className = "molecule-canvas";
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(
    48,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = ORBIT_DAMPING_FACTOR;
  controls.minDistance = 3;
  controls.maxDistance = 20;

  scene.add(new THREE.AmbientLight(0x334155, 0.8));
  const light = new THREE.PointLight(0x22d3ee, 1.8, 50, 2);
  light.position.set(3, 5, 8);
  scene.add(light);

  const atoms = parseAtomsFromSmiles(smiles);
  const atomGroup = new THREE.Group();
  const bondGroup = new THREE.Group();

  const count = Math.max(MIN_VISUALIZED_ATOMS, Math.min(atoms.length, MAX_VISUALIZED_ATOMS));
  const points = [];
  for (let i = 0; i < count; i++) {
    const atom = atoms[i] || "C";
    const angle = (i / count) * Math.PI * 2;
    const radius = 1.6 + Math.sin(i * 0.35) * 0.45;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(i * 0.7) * 1.4;
    const z = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, y, z));

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 20, 20),
      new THREE.MeshStandardMaterial({
        color: ATOM_COLORS[atom] || ATOM_COLORS.C,
        metalness: 0.25,
        roughness: 0.35,
      })
    );
    sphere.position.set(x, y, z);
    atomGroup.add(sphere);
  }

  for (let i = 0; i < points.length - 1; i++) {
    const geometry = new THREE.BufferGeometry().setFromPoints([points[i], points[i + 1]]);
    const bond = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.8 })
    );
    bondGroup.add(bond);
  }

  scene.add(atomGroup);
  scene.add(bondGroup);

  let raf = 0;
  const clock = new THREE.Clock();
  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = clock.getDelta();
    atomGroup.rotation.y += dt * 0.24;
    bondGroup.rotation.y += dt * 0.24;
    controls.update();
    renderer.render(scene, camera);
  }
  tick();

  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(container);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    renderer.dispose();
  };
}
