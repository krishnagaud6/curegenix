/**
 * Lightweight 2D animated double helix (same palette: cyan / violet / pink).
 * Subtle motion; respects prefers-reduced-motion.
 */
export function initDnaCanvas(canvas) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const reduce =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let phase = 0;
  let raf = 0;
  let stopped = false;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function helix(cx, cy, ampScale, phaseOff, turns, alphaMul) {
    const amp = Math.min(w, h) * ampScale;
    const steps = Math.min(96, Math.floor(h * 0.12));
    const y0 = cy - h * 0.2;
    const y1 = cy + h * 0.2;
    const vy = (y1 - y0) / steps;

    const drawStrand = (color, angExtra) => {
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = y0 + t * (y1 - y0);
        const ang = t * Math.PI * 2 * turns + phase + angExtra;
        const wobble = Math.sin(phase * 0.35 + t * 3.1) * (amp * 0.06);
        const x = cx + Math.cos(ang) * amp + wobble;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.35;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    const a = 0.38 * alphaMul;
    const b = 0.32 * alphaMul;
    const r = 0.22 * alphaMul;

    drawStrand(`rgba(6, 182, 212, ${a})`, phaseOff);
    drawStrand(`rgba(139, 92, 246, ${b})`, phaseOff + Math.PI + 0.22);

    ctx.lineWidth = 1;
    for (let i = 0; i <= steps; i += 5) {
      const t = i / steps;
      const y = y0 + t * (y1 - y0);
      const angA = t * Math.PI * 2 * turns + phase + phaseOff;
      const angB = t * Math.PI * 2 * turns + phase + phaseOff + Math.PI + 0.22;
      const wobble = Math.sin(phase * 0.35 + t * 3.1) * (amp * 0.06);
      const x1 = cx + Math.cos(angA) * amp + wobble;
      const x2 = cx + Math.cos(angB) * amp + wobble;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.strokeStyle = `rgba(236, 72, 153, ${r})`;
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(34, 211, 238, ${0.28 * alphaMul})`;
    for (let i = 0; i <= steps; i += 7) {
      const t = i / steps;
      const y = y0 + t * (y1 - y0);
      const ang = t * Math.PI * 2 * turns + phase + phaseOff;
      const wobble = Math.sin(phase * 0.35 + t * 3.1) * (amp * 0.06);
      const x = cx + Math.cos(ang) * amp + wobble;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, w, h);
    if (reduce) {
      helix(w * 0.42, h * 0.45, 0.085, 0, 2.2, 0.85);
      helix(w * 0.72, h * 0.52, 0.055, 1.2, 1.8, 0.55);
      return;
    }
    phase += 0.0028;
    helix(w * 0.38, h * 0.48, 0.09, 0, 2.35, 1);
    helix(w * 0.78, h * 0.55, 0.06, 0.9, 1.9, 0.65);
  }

  function loop() {
    if (stopped) return;
    raf = requestAnimationFrame(loop);
    drawFrame();
  }

  function onResize() {
    resize();
    if (reduce) drawFrame();
  }

  resize();
  window.addEventListener("resize", onResize);

  if (reduce) {
    drawFrame();
  } else {
    loop();
  }

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
  };
}
