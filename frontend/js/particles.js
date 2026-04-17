/**
 * Lightweight floating DOM particles (complements WebGL background).
 */
export function initParticles(container, count = 24) {
  if (!container) return;
  const types = ["", "particle--violet", "particle--pink"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = `particle ${types[i % types.length]}`.trim();
    el.style.left = `${Math.random() * 100}%`;
    el.style.top = `${Math.random() * 100}%`;
    el.style.animationDelay = `${Math.random() * 12}s`;
    el.style.animationDuration = `${12 + Math.random() * 10}s`;
    container.appendChild(el);
  }
}
