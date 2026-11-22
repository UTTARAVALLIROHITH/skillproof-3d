import type { SkillCategory, VerificationLevel } from "../types";

/** Restrained, desaturated category colours — glow is subtle, never neon. */
export const CATEGORY_COLORS: Record<SkillCategory, string> = {
  Programming: "#9fb8ff",
  Frontend: "#b7d4ff",
  Backend: "#8fa8e6",
  "Web Development": "#c9b8ff",
  Database: "#f0cf9b",
  Cybersecurity: "#e5a3a3",
  Networking: "#8fd6cc",
  Cloud: "#a6e3f0",
  "UI/UX Design": "#e8b0c4",
  "Tools & Technologies": "#bfe3a6",
  Other: "#aab6cc",
};

export const VERIFICATION_COLORS: Record<VerificationLevel, string> = {
  Unverified: "#9aa4b8",
  "Credential linked": "#b7c8ff",
  "Issuer-checked": "#8fe3b4",
};
