import { sampleData } from "../data/sampleData";
import { THEME_IDS, type AppData, type Profile, type ThemeId } from "../types";

export const STORAGE_KEY = "skillproof3d:v1";

/** Each account gets its own workspace; guest mode uses the original key. */
export function storageKeyFor(userId: string | null): string {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

export const emptyProfile: Profile = {
  name: "",
  headline: "",
  about: "",
  location: "",
  email: "",
  github: "",
  linkedin: "",
  website: "",
  avatar: "",
  education: [],
  experience: [],
  languages: [],
  links: [],
  phone: "",
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

export function isAppData(v: unknown): v is AppData {
  return (
    isObj(v) &&
    isObj(v.profile) &&
    Array.isArray(v.skills) &&
    Array.isArray(v.projects) &&
    Array.isArray(v.certificates) &&
    Array.isArray(v.evidence) &&
    Array.isArray(v.achievements)
  );
}

export function normalizeData(raw: AppData): AppData {
  const theme: ThemeId = (THEME_IDS as readonly string[]).includes(String(raw.theme)) ? raw.theme : "midnight";
  return {
    version: 1,
    profile: {
      ...emptyProfile,
      ...raw.profile,
      education: Array.isArray(raw.profile.education) ? raw.profile.education : [],
      experience: Array.isArray(raw.profile.experience) ? raw.profile.experience : [],
      languages: Array.isArray(raw.profile.languages) ? raw.profile.languages : [],
      links: Array.isArray(raw.profile.links) ? raw.profile.links : [],
    },
    skills: raw.skills,
    projects: raw.projects.map((p) => ({ ...p, screenshots: p.screenshots ?? [], contributions: p.contributions ?? [] })),
    certificates: raw.certificates,
    evidence: raw.evidence,
    achievements: raw.achievements,
    theme,
  };
}

export function loadData(key: string = STORAGE_KEY): AppData {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isAppData(parsed)) return normalizeData(parsed);
    }
  } catch {
    /* corrupted storage: fall back to demo content */
  }
  return sampleData;
}

/** Returns false when storage is full or unavailable. */
export function saveData(data: AppData, key: string = STORAGE_KEY): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** A clean, empty workspace for newly created accounts. */
export function blankData(name: string, email: string): AppData {
  return {
    version: 1,
    profile: { ...emptyProfile, name, email },
    skills: [],
    projects: [],
    certificates: [],
    evidence: [],
    achievements: [],
    theme: "midnight",
  };
}

export function serializeBackup(data: AppData): string {
  return JSON.stringify({ app: "SkillProof 3D", exportedAt: new Date().toISOString(), ...data }, null, 2);
}

export function parseBackup(text: string): AppData {
  const parsed: unknown = JSON.parse(text);
  if (!isAppData(parsed)) throw new Error("This file is not a valid SkillProof 3D backup.");
  return normalizeData(parsed);
}
