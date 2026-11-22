import {
  EVIDENCE_TYPES,
  PROJECT_KINDS,
  PROJECT_STATUSES,
  SKILL_CATEGORIES,
  type Achievement,
  type AppData,
  type Certificate,
  type Education,
  type Evidence,
  type Experience,
  type Project,
  type ProjectKind,
  type ProjectStatus,
  type Skill,
  type SkillCategory,
  type VerificationLevel,
} from "../types";
import { todayISO } from "../utils/helpers";
import { normalizeKey, slugify, str, strArr } from "./candidates";
import { categoryFor } from "./dictionary";
import { CANDIDATE_ORDER, type Candidate, type Provenance } from "./types";

const PROFILE_FIELDS = ["name", "headline", "about", "location", "email", "github", "linkedin", "website", "phone"] as const;
type ProfileField = (typeof PROFILE_FIELDS)[number];

export interface ApplyOptions {
  /** Allow replacing values the visitor changed by hand after the last import. Requires explicit confirmation in the UI. */
  overwriteManual?: boolean;
  now?: string;
}

export interface ApplyResult {
  data: AppData;
  provenance: Record<string, Provenance>;
  applied: number;
  /** Keys that were protected because they were edited manually (or already exist with other values). */
  skippedManual: string[];
}

function oneOf<T extends string>(value: string, list: readonly T[], fallback: T): T {
  return (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i < 0) return [...list, item];
  const copy = [...list];
  copy[i] = item;
  return copy;
}

const colorFor = (name: string) => ["#9fb8ff", "#c9b8ff", "#8fd6cc", "#f0cf9b", "#e8b0c4", "#bfe3a6"][name.length % 6];

/**
 * Writes approved candidates into a copy of the profile. Pure: the input is never mutated,
 * so the same call powers both the live preview and the final import.
 */
export function applyCandidates(data: AppData, candidates: Candidate[], prov: Record<string, Provenance>, opts: ApplyOptions = {}): ApplyResult {
  const now = opts.now ?? new Date().toISOString();
  const overwrite = Boolean(opts.overwriteManual);
  const today = todayISO();
  const provenance: Record<string, Provenance> = { ...prov };
  const skippedManual: string[] = [];
  let applied = 0;

  const profile = {
    ...data.profile,
    languages: [...data.profile.languages],
    links: [...data.profile.links],
    education: [...data.profile.education],
    experience: [...data.profile.experience],
  };
  const next: AppData = {
    ...data,
    profile,
    skills: [...data.skills],
    projects: [...data.projects],
    certificates: [...data.certificates],
    evidence: [...data.evidence],
    achievements: [...data.achievements],
  };
  const fields = profile as unknown as Record<string, unknown>;

  const stamp = (key: string, c: Candidate, snapshot: unknown, verification: string) => {
    const prev = provenance[key];
    provenance[key] = {
      sourceKind: c.source.kind,
      sourceRef: c.source.ref,
      sourceLabel: c.source.label,
      method: c.source.method,
      importedAt: prev?.importedAt ?? now,
      updatedAt: now,
      userEdited: c.edited,
      verification,
      snapshot: JSON.stringify(snapshot),
    };
  };

  /** An item may be written when it is new, unchanged since the last import, or the visitor confirmed overwriting. */
  const canWrite = (key: string, current: unknown): boolean => {
    if (current === undefined) return true;
    const prev = provenance[key];
    const changedByHand = !prev || JSON.stringify(current) !== prev.snapshot;
    if (!changedByHand || overwrite) return true;
    skippedManual.push(key);
    return false;
  };

  const ensureSkill = (name: string, c: Candidate): string => {
    const found = next.skills.find((s) => normalizeKey(s.name) === normalizeKey(name));
    if (found) return found.id;
    const id = `skill-${slugify(name)}`;
    const skill: Skill = {
      id,
      name,
      category: categoryFor(name),
      proficiency: 40,
      learningStatus: "Learning",
      summary: `Found in “${c.source.label}”. Self-reported until you add evidence.`,
      updatedAt: today,
    };
    next.skills = [...next.skills, skill];
    stamp(`skill:${id}`, c, skill, "Not applicable");
    return id;
  };

  const skillIdsFrom = (names: string[], c: Candidate) => [...new Set(names.filter(Boolean).map((n) => ensureSkill(n, c)))];

  const approved = candidates.filter((c) => c.status === "accepted");
  const ordered = CANDIDATE_ORDER.flatMap((kind) => approved.filter((c) => c.kind === kind));

  for (const c of ordered) {
    const d = c.data;
    const target = c.duplicateOf;

    switch (c.kind) {
      case "profile": {
        const field = str(d, "field") as ProfileField;
        const value = str(d, "value");
        if (!(PROFILE_FIELDS as readonly string[]).includes(field) || !value) break;
        const current = String(fields[field] ?? "");
        if (current === value) break;
        if (current !== "" && !canWrite(`profile.${field}`, current)) break;
        fields[field] = value;
        stamp(`profile.${field}`, c, value, "Not applicable");
        applied++;
        break;
      }

      case "language": {
        const name = str(d, "name");
        if (name && !profile.languages.some((l) => normalizeKey(l) === normalizeKey(name))) {
          profile.languages.push(name);
          applied++;
        }
        break;
      }

      case "link": {
        const url = str(d, "url");
        if (!url) break;
        if (!profile.links.some((l) => l.url === url)) {
          profile.links.push({ id: c.entityId, label: str(d, "label") || "Link", url });
          applied++;
        }
        if (/github\.com/i.test(url) && !profile.github) profile.github = url;
        if (/linkedin\.com/i.test(url) && !profile.linkedin) profile.linkedin = url;
        break;
      }

      case "education": {
        const id = target ?? c.entityId;
        const item: Education = { id, school: str(d, "school"), degree: str(d, "degree"), period: str(d, "period"), details: str(d, "details") };
        if (!canWrite(`education:${id}`, profile.education.find((e) => e.id === id))) break;
        profile.education = upsert(profile.education, item);
        stamp(`education:${id}`, c, item, "Not applicable");
        applied++;
        break;
      }

      case "experience": {
        const id = target ?? c.entityId;
        const item: Experience = {
          id,
          role: str(d, "role"),
          company: str(d, "company"),
          period: str(d, "period"),
          location: str(d, "location"),
          details: str(d, "details"),
        };
        if (!canWrite(`experience:${id}`, profile.experience.find((e) => e.id === id))) break;
        profile.experience = upsert(profile.experience, item);
        stamp(`experience:${id}`, c, item, "Not applicable");
        applied++;
        break;
      }

      case "skill": {
        const name = str(d, "name");
        if (!name) break;
        // Imports never modify skills you already have. They only add new ones.
        if (next.skills.some((s) => normalizeKey(s.name) === normalizeKey(name) || s.id === target)) break;
        const id = `skill-${slugify(name)}`;
        const skill: Skill = {
          id,
          name,
          category: oneOf(str(d, "category"), SKILL_CATEGORIES, categoryFor(name)) as SkillCategory,
          proficiency: Math.max(0, Math.min(100, Math.round(typeof d.proficiency === "number" ? d.proficiency : 40))),
          learningStatus: "Learning",
          summary: str(d, "summary"),
          updatedAt: today,
        };
        next.skills = [...next.skills, skill];
        stamp(`skill:${id}`, c, skill, "Not applicable");
        applied++;
        break;
      }

      case "project": {
        const id = target ?? c.entityId;
        const existing = next.projects.find((p) => p.id === id);
        if (!canWrite(`project:${id}`, existing)) break;
        const skillIds = skillIdsFrom(strArr(d, "skillNames"), c);
        const project: Project = {
          id,
          name: str(d, "name") || c.title,
          summary: str(d, "summary"),
          description: str(d, "description"),
          kind: oneOf(str(d, "kind"), PROJECT_KINDS, "Other") as ProjectKind,
          technologies: strArr(d, "technologies"),
          screenshots: strArr(d, "screenshots"),
          githubUrl: str(d, "githubUrl"),
          liveUrl: str(d, "liveUrl"),
          // Status is never invented. Without one we use the neutral default and the review flags it.
          status: oneOf(str(d, "status"), PROJECT_STATUSES, "In Progress") as ProjectStatus,
          featured: existing?.featured ?? false,
          skillIds: [...new Set([...(existing?.skillIds ?? []), ...skillIds])],
          contributions: strArr(d, "contributions"),
          color: existing?.color ?? colorFor(str(d, "name") || c.title),
          startedAt: str(d, "startedAt"),
        };
        next.projects = upsert(next.projects, project);
        stamp(`project:${id}`, c, project, "Not applicable");
        applied++;
        break;
      }

      case "certificate": {
        const id = target ?? c.entityId;
        const existing = next.certificates.find((x) => x.id === id);
        if (!canWrite(`certificate:${id}`, existing)) break;
        const url = str(d, "credentialUrl");
        // Imports can never mark a certificate as issuer-checked. Only a manual check can.
        const verification: VerificationLevel = existing?.verification === "Issuer-checked" ? "Issuer-checked" : url ? "Credential linked" : "Unverified";
        const cert: Certificate = {
          id,
          title: str(d, "title") || c.title,
          issuer: str(d, "issuer"),
          issueDate: str(d, "issueDate"),
          credentialUrl: url,
          skillIds: skillIdsFrom(strArr(d, "skillNames"), c),
          verification,
          fileName: str(d, "fileName"),
          fileType: str(d, "fileType"),
          fileData: str(d, "fileData"),
          notes: str(d, "notes") || `Imported from ${c.source.label}. Not checked against the issuer yet.`,
        };
        next.certificates = upsert(next.certificates, cert);
        stamp(`certificate:${id}`, c, cert, verification);
        applied++;
        break;
      }

      case "achievement": {
        const id = target ?? c.entityId;
        const item: Achievement = { id, title: str(d, "title") || c.title, date: str(d, "date"), description: str(d, "description") };
        if (!canWrite(`achievement:${id}`, next.achievements.find((a) => a.id === id))) break;
        next.achievements = upsert(next.achievements, item);
        stamp(`achievement:${id}`, c, item, "Not applicable");
        applied++;
        break;
      }

      case "evidence": {
        const names = strArr(d, "skillNames");
        for (const name of names) {
          const skillId = ensureSkill(name, c);
          const id = target && names.length === 1 ? target : `${c.entityId}-${slugify(name)}`;
          const existing = next.evidence.find((e) => e.id === id);
          if (!canWrite(`evidence:${id}`, existing)) continue;
          const ev: Evidence = {
            id,
            title: str(d, "title") || c.title,
            type: oneOf(str(d, "type"), EVIDENCE_TYPES, "Documentation"),
            skillId,
            url: str(d, "url"),
            description: str(d, "description"),
            dateAdded: str(d, "date") || today,
          };
          next.evidence = upsert(next.evidence, ev);
          stamp(`evidence:${id}`, c, ev, "Not applicable");
          applied++;
        }
        break;
      }
    }
  }

  return { data: next, provenance, applied, skippedManual };
}
