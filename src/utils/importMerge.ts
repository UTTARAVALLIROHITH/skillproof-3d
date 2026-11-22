import type { AppData, Certificate, Evidence, Profile, Project, Skill } from "../types";

/** A partial set of data produced by an importer (GitHub, LinkedIn). */
export interface ImportPatch {
  profile?: Partial<Profile>;
  skills?: Skill[];
  projects?: Project[];
  evidence?: Evidence[];
  certificates?: Certificate[];
}

export interface ImportCounts {
  profile: number;
  experience: number;
  education: number;
  skills: number;
  projects: number;
  certificates: number;
  evidence: number;
}

export function summarizePatch(p: ImportPatch): ImportCounts {
  const profile = Object.entries(p.profile ?? {}).filter(
    ([k, v]) => k !== "education" && k !== "experience" && typeof v === "string" && v.trim() !== ""
  ).length;
  return {
    profile,
    experience: p.profile?.experience?.length ?? 0,
    education: p.profile?.education?.length ?? 0,
    skills: p.skills?.length ?? 0,
    projects: p.projects?.length ?? 0,
    certificates: p.certificates?.length ?? 0,
    evidence: p.evidence?.length ?? 0,
  };
}

export function describeCounts(c: ImportCounts): string[] {
  const lines: [number, string][] = [
    [c.profile, "profile fields"],
    [c.experience, "experience entries"],
    [c.education, "education entries"],
    [c.skills, "skills"],
    [c.projects, "projects"],
    [c.certificates, "certificates"],
    [c.evidence, "evidence links"],
  ];
  return lines.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}`);
}

/** Merge by id: incoming items replace matching ones, new items are appended. */
function mergeById<T extends { id: string }>(current: T[], incoming: T[] | undefined): T[] {
  if (!incoming || incoming.length === 0) return current;
  const map = new Map(current.map((x) => [x.id, x] as const));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}

/** Applies an import without destroying anything the user wrote by hand. */
export function applyImport(data: AppData, patch: ImportPatch): AppData {
  const { education, experience, ...scalars } = patch.profile ?? {};
  const profile: Profile = { ...data.profile };

  for (const [key, value] of Object.entries(scalars) as [keyof Profile, unknown][]) {
    if (typeof value === "string" && value.trim() !== "") {
      (profile as unknown as Record<string, unknown>)[key] = value;
    }
  }
  if (education) profile.education = mergeById(data.profile.education, education);
  if (experience) profile.experience = mergeById(data.profile.experience ?? [], experience);

  return {
    ...data,
    profile,
    skills: mergeById(data.skills, patch.skills),
    projects: mergeById(data.projects, patch.projects),
    evidence: mergeById(data.evidence, patch.evidence),
    certificates: mergeById(data.certificates, patch.certificates),
  };
}
