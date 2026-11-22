import { useState, useSyncExternalStore } from "react";
import { hasWebGL } from "../utils/capabilities";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(callback: () => void): () => void {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

const getReduced = () => window.matchMedia(REDUCED_QUERY).matches;

/** Live `prefers-reduced-motion` preference. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, getReduced, () => false);
}

/** Detects WebGL once per mount; components fall back to 2D when false. */
export function useWebGL(): boolean {
  const [supported] = useState(() => hasWebGL());
  return supported;
}
