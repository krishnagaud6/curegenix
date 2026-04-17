import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const CYAN = 0x06b6d4;
const VIOLET = 0x8b5cf6;

/**
 * Interactive Cα-style trace with orbit controls (placeholder for Mol*).
 */
export function initProteinViewer(canvas, options = {}) {
  if (!canvas) return () => {};
  const parent = canvas.parentElement;
  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(
    45,
    parent.clientWidth / parent.clientHeight,
    0.1,
    100
  );
  camera.position.set(4.5, 2.2, 6);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(parent.clientWidth, parent.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 3;
  controls.maxDistance = 18;
  controls.target.set(0, 0.5, 0);

  scene.add(new THREE.AmbientLight(0x445566, 0.5));
  const pt = new THREE.PointLight(CYAN, 1.8, 40, 2);
  pt.position.set(5, 8, 6);
  scene.add(pt);
  const pt2 = new THREE.PointLight(VIOLET, 1.2, 35, 2);
  pt2.position.set(-6, 2, -4);
  scene.add(pt2);

  const group = new THREE.Group();
  const sequenceLength = Number(options.sequenceLength || 72);
  const n = Math.max(36, Math.min(180, Math.floor(sequenceLength / 4) || 72));
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i * 0.42;
    const r = 1.35 + Math.sin(i * 0.15) * 0.35 + Math.cos(i * 0.08) * 0.2;
    const y = i * 0.11 - (n * 0.11) / 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }

  const atomGeo = new THREE.SphereGeometry(0.14, 18, 18);
  const atomMat = new THREE.MeshStandardMaterial({
    color: CYAN,
    metalness: 0.45,
    roughness: 0.22,
    emissive: 0x022028,
    emissiveIntensity: 0.5,
  });

  pts.forEach((p, i) => {
    const m = new THREE.Mesh(atomGeo, atomMat.clone());
    m.position.copy(p);
    const hue = 0.52 + (i % 7) * 0.02;
    m.material.color.setHSL(hue, 0.75, 0.62);
    m.material.emissive.copy(m.material.color).multiplyScalar(0.15);
    group.add(m);
  });

  const bondMat = new THREE.LineBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
  });

  for (let i = 0; i < pts.length - 1; i++) {
    const g = new THREE.BufferGeometry().setFromPoints([pts[i], pts[i + 1]]);
    group.add(new THREE.Line(g, bondMat));
  }
  for (let i = 0; i < pts.length - 4; i += 6) {
    if (pts[i].distanceTo(pts[i + 4]) < 2.2) {
      const g2 = new THREE.BufferGeometry().setFromPoints([pts[i], pts[i + 4]]);
      const bm = bondMat.clone();
      bm.opacity = 0.35;
      group.add(new THREE.Line(g2, bm));
    }
  }

  scene.add(group);

  let raf = 0;
  const clock = new THREE.Clock();

  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = clock.getDelta();
    group.rotation.y += dt * 0.18;
    controls.update();
    renderer.render(scene, camera);
  }
  tick();

  const ro = new ResizeObserver(() => {
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w < 1 || h < 1) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(parent);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    renderer.dispose();
  };
}
