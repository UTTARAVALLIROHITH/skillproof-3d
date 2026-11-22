export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export interface RenderQuality {
  tier: "high" | "medium" | "low";
  dpr: [number, number];
  particles: number;
  stars: number;
  shadows: boolean;
}

const PRESETS: Record<RenderQuality["tier"], Omit<RenderQuality, "tier">> = {
  high: { dpr: [1, 2], particles: 120, stars: 1600, shadows: true },
  medium: { dpr: [1, 1.5], particles: 70, stars: 800, shadows: true },
  low: { dpr: [1, 1], particles: 36, stars: 350, shadows: false },
};

let cachedQuality: RenderQuality | null = null;

/** Chooses a render budget from device hints. Computed once per session. */
export function getRenderQuality(): RenderQuality {
  if (cachedQuality) return cachedQuality;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  let tier: RenderQuality["tier"] = "high";
  if (isMobile && (cores <= 4 || memory <= 4)) tier = "low";
  else if (isMobile || cores <= 4 || memory <= 4) tier = "medium";
  cachedQuality = { tier, ...PRESETS[tier] };
  return cachedQuality;
}
