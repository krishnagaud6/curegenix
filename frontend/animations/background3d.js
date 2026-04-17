import * as THREE from "three";

/**
 * Full-screen biotech background: molecular graph, grid, particles (no WebGL DNA —
 * DNA is drawn on lightweight 2D canvas in js/dna-canvas.js for smoother UX).
 */
export function initBackground(canvas) {
  const BG = 0x0b0f19;
  const CYAN = 0x06b6d4;
  const VIOLET = 0x8b5cf6;
  const PINK = 0xec4899;
  const CYAN_SOFT = 0x22d3ee;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, 0.034);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 3.5, 16);
  camera.lookAt(0, 1, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(BG, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.AmbientLight(0x334455, 0.42));

  const key = new THREE.PointLight(CYAN, 2.1, 80, 2);
  key.position.set(8, 10, 12);
  scene.add(key);

  const fill = new THREE.PointLight(VIOLET, 1.5, 70, 2);
  fill.position.set(-10, 4, -6);
  scene.add(fill);

  const accent = new THREE.PointLight(PINK, 0.9, 50, 2);
  accent.position.set(2, -2, 8);
  scene.add(accent);

  const rim = new THREE.DirectionalLight(CYAN_SOFT, 0.32);
  rim.position.set(0, 20, -15);
  scene.add(rim);

  const proteinGroup = new THREE.Group();
  const nodeCount = 48;
  const sphereR = 2.8;
  const positions = [];

  for (let i = 0; i < nodeCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = sphereR * (0.55 + Math.random() * 0.45);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.85;
    const z = r * Math.cos(phi);
    positions.push(new THREE.Vector3(x, y, z));
  }

  const atomGeo = new THREE.SphereGeometry(0.16, 14, 14);
  const atomMat = new THREE.MeshStandardMaterial({
    color: CYAN_SOFT,
    metalness: 0.35,
    roughness: 0.25,
    emissive: 0x061820,
    emissiveIntensity: 0.45,
  });

  positions.forEach((p, idx) => {
    const atom = new THREE.Mesh(atomGeo, atomMat.clone());
    atom.position.copy(p);
    const hue = 0.52 + (idx % 5) * 0.04;
    atom.material.color.setHSL(hue, 0.75, 0.58);
    atom.material.emissive.copy(atom.material.color).multiplyScalar(0.12);
    proteinGroup.add(atom);
  });

  const bondMat = new THREE.LineBasicMaterial({
    color: CYAN,
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
  });

  const maxDist = 1.15;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      if (positions[i].distanceTo(positions[j]) < maxDist) {
        const geom = new THREE.BufferGeometry().setFromPoints([
          positions[i],
          positions[j],
        ]);
        proteinGroup.add(new THREE.Line(geom, bondMat));
      }
    }
  }

  proteinGroup.position.set(6, 1.2, -1);
  scene.add(proteinGroup);

  const gridSize = 90;
  const gridDiv = 56;
  const gridColor = new THREE.Color(CYAN);
  const gridHelper = new THREE.GridHelper(
    gridSize,
    gridDiv,
    gridColor.getHex(),
    0x1a2435
  );
  gridHelper.position.y = -4.2;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.32;
  scene.add(gridHelper);

  const gridGlow = new THREE.GridHelper(gridSize, gridDiv, 0x06b6d4, BG);
  gridGlow.position.y = -4.18;
  gridGlow.scale.set(1.02, 1.02, 1.02);
  const glowMats = Array.isArray(gridGlow.material)
    ? gridGlow.material
    : [gridGlow.material];
  glowMats.forEach((mat) => {
    mat.transparent = true;
    mat.opacity = 0.12;
    mat.blending = THREE.AdditiveBlending;
  });
  scene.add(gridGlow);

  const particleCount = 1800;
  const pPositions = new Float32Array(particleCount * 3);
  const pSizes = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 70;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 35;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 45;
    pSizes[i] = Math.random() * 1.2 + 0.2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  pGeo.setAttribute("size", new THREE.BufferAttribute(pSizes, 1));

  const pMat = new THREE.PointsMaterial({
    color: VIOLET,
    size: 0.06,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  particles.position.y = 2;
  scene.add(particles);

  let t = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    t += dt;

    proteinGroup.rotation.y += dt * 0.12;
    proteinGroup.rotation.x += dt * 0.05;
    const pulse = 1 + Math.sin(t * 1.4) * 0.035;
    proteinGroup.scale.setScalar(pulse);

    particles.rotation.y += dt * 0.018;
    particles.position.y = 2 + Math.sin(t * 0.4) * 0.25;

    const gridPulse = 0.3 + Math.sin(t * 0.8) * 0.04;
    const ghMats = Array.isArray(gridHelper.material)
      ? gridHelper.material
      : [gridHelper.material];
    ghMats.forEach((mat) => {
      mat.opacity = gridPulse;
    });
    const glowPulse = 0.09 + Math.sin(t * 0.8) * 0.02;
    glowMats.forEach((mat) => {
      mat.opacity = glowPulse;
    });

    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);

  return { dispose: () => window.removeEventListener("resize", onResize) };
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("bg-canvas");
  if (canvas) initBackground(canvas);
});
