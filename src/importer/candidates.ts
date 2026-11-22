import type { AppData } from "../types";
import { parseGitHubLogin } from "../utils/github";
import { categoryFor, detectSkills } from "./dictionary";
import {
  type Candidate,
  type CandidateData,
  type CandidateKind,
  type EvidenceBasis,
  type ResumeData,
  type SourceInput,
  type SourceRef,
} from "./types";
import { safeHttpUrl, sanitizeText } from "./validate";

/* ---------------- Keys, ids and similarity ---------------- */

export function normalizeKey(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function slugify(s: string): string {
  return normalizeKey(s).replace(/\s+/g, "-");
}

export function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function entityIdFor(kind: CandidateKind, key: string): string {
  return `imp-${kind}-${hashKey(normalizeKey(key))}`;
}

/** Token-overlap (Jaccard) similarity in [0, 1]. */
export function similarity(a: string, b: string): number {
  const A = new Set(normalizeKey(a).split(" ").filter(Boolean));
  const B = new Set(normalizeKey(b).split(" ").filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((t) => {
    if (B.has(t)) inter++;
  });
  return inter / (A.size + B.size - inter);
}

export const str = (d: CandidateData, k: string): string => {
  const v = d[k];
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
};
export const strArr = (d: CandidateData, k: string): string[] => {
  const v = d[k];
  return Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
};
export const num = (d: CandidateData, k: string, fallback: number): number => (typeof d[k] === "number" ? (d[k] as number) : fallback);

/** A stable reference for a source, used to detect repeated imports. */
export function refFor(input: SourceInput): string {
  switch (input.type) {
    case "resume-file":
    case "document-file":
      return `${input.type === "resume-file" ? "file" : "doc"}:${input.file.name}:${input.file.size}`;
    case "resume-text":
      return `text:${hashKey(input.text)}`;
    case "github":
      return `github:${(parseGitHubLogin(input.login) ?? input.login).toLowerCase()}`;
    case "linkedin-export":
      return `linkedin-export:${input.files.map((f) => f.name).join("|")}`;
    case "linkedin-url":
      return `linkedin-url:${input.url.trim()}`;
    case "web-url":
      return `web:${input.url.trim()}`;
  }
}

/* ---------------- Titles, subtitles, cleaning ---------------- */

export function titleFromData(kind: CandidateKind, d: CandidateData): string {
  switch (kind) {
    case "profile":
      return str(d, "value");
    case "language":
      return str(d, "name");
    case "link":
      return str(d, "label") || str(d, "url");
    case "education":
      return str(d, "school");
    case "experience":
      return str(d, "role") || str(d, "company");
    case "skill":
      return str(d, "name");
    case "project":
      return str(d, "name");
    case "certificate":
    case "achievement":
    case "evidence":
      return str(d, "title");
  }
}

function subtitleFor(kind: CandidateKind, d: CandidateData): string {
  switch (kind) {
    case "experience":
      return [str(d, "company"), str(d, "period")].filter(Boolean).join(" · ");
    case "education":
      return [str(d, "degree"), str(d, "period")].filter(Boolean).join(" · ");
    case "project":
      return strArr(d, "technologies").slice(0, 5).join(", ");
    case "certificate":
      return [str(d, "issuer"), str(d, "issueDate")].filter(Boolean).join(" · ");
    case "skill":
      return str(d, "category");
    case "achievement":
      return str(d, "date");
    case "link":
      return str(d, "url");
    case "profile":
      return str(d, "field");
    default:
      return "";
  }
}

const URL_KEY = /url|link|screenshot/i;

/** Sanitises every string in a candidate's data. URLs must be http(s); file payloads are kept intact. */
export function cleanData(d: CandidateData): CandidateData {
  const out: CandidateData = {};
  for (const [k, v] of Object.entries(d)) {
    if (k === "fileData") {
      out[k] = typeof v === "string" ? v : "";
    } else if (Array.isArray(v)) {
      const items = v.map((x) => (URL_KEY.test(k) ? safeHttpUrl(x) : sanitizeText(x, 500))).filter(Boolean);
      out[k] = items;
    } else if (typeof v === "string") {
      out[k] = URL_KEY.test(k) && k !== "skillNames" ? safeHttpUrl(v) : sanitizeText(v, 3000);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export interface CandidateInit {
  kind: CandidateKind;
  key: string;
  entityId?: string;
  data: CandidateData;
  source: SourceRef;
  confidence: number;
  basis?: EvidenceBasis;
  missing?: string[];
  warnings?: string[];
  snippet?: string;
}

export function makeCandidate(init: CandidateInit): Candidate {
  const data = cleanData(init.data);
  const entityId = init.entityId ?? entityIdFor(init.kind, init.key);
  return {
    id: `${entityId}-${hashKey(JSON.stringify(data))}`,
    entityId,
    kind: init.kind,
    title: sanitizeText(titleFromData(init.kind, data), 200),
    subtitle: sanitizeText(subtitleFor(init.kind, data), 200),
    data,
    source: init.source,
    confidence: Math.max(0, Math.min(1, init.confidence)),
    snippet: sanitizeText(init.snippet ?? "", 240),
    basis: init.basis ?? "self-reported",
    status: "pending",
    edited: false,
    missing: init.missing ?? [],
    warnings: init.warnings ?? [],
  };
}

/* ---------------- Resume → candidates ---------------- */

export function resumeToCandidates(r: ResumeData, source: SourceRef): Candidate[] {
  const out: Candidate[] = [];
  const add = (init: CandidateInit) => out.push(makeCandidate(init));

  const scalar = (field: string, value: string, confidence: number) => {
    if (!value) return;
    add({ kind: "profile", key: `profile-${field}`, entityId: `imp-profile-${field}`, data: { field, value }, source, confidence, basis: "self-reported" });
  };
  scalar("name", r.name, 0.75);
  scalar("headline", r.headline, 0.6);
  scalar("about", r.about, 0.7);
  scalar("email", r.emails[0] ?? "", 0.9);
  scalar("phone", r.phones[0] ?? "", 0.7);

  for (const name of r.languages) add({ kind: "language", key: name, data: { name }, source, confidence: 0.8 });
  for (const l of r.links) add({ kind: "link", key: l.url, data: { label: l.label, url: l.url }, source, confidence: 0.8 });

  for (const e of r.education) {
    const missing = [...(e.period ? [] : ["dates"]), ...(e.degree ? [] : ["degree"])];
    add({ kind: "education", key: e.school, data: { ...e }, source, confidence: e.period ? 0.75 : 0.6, missing });
  }

  for (const e of r.experience) {
    const missing = [...(e.company ? [] : ["company"]), ...(e.period ? [] : ["dates"])];
    add({ kind: "experience", key: `${e.role}|${e.company}`, data: { ...e }, source, confidence: e.period ? 0.75 : 0.55, missing });
  }

  for (const name of r.skills) {
    add({
      kind: "skill",
      key: name,
      entityId: `skill-${slugify(name)}`,
      data: { name, category: categoryFor(name), proficiency: 40, summary: "Listed on your resume." },
      source,
      confidence: 0.8,
      basis: "self-reported",
    });
  }
  for (const name of r.mentionedSkills) {
    add({
      kind: "skill",
      key: name,
      entityId: `skill-${slugify(name)}`,
      data: { name, category: categoryFor(name), proficiency: 40, summary: "Mentioned in your resume text." },
      source,
      confidence: 0.45,
      basis: "self-reported",
    });
  }

  for (const p of r.projects) {
    const gh = p.urls.find((u) => /github\.com/i.test(u)) ?? "";
    const live = p.urls.find((u) => !/github\.com/i.test(u)) ?? "";
    const missing = ["development status", ...(gh || live ? [] : ["repository or demo link"])];
    add({
      kind: "project",
      key: p.name,
      data: {
        name: p.name,
        summary: p.description.slice(0, 160),
        description: p.description,
        kind: "Other",
        technologies: p.technologies,
        screenshots: [],
        githubUrl: gh,
        liveUrl: live,
        status: "",
        contributions: [],
        skillNames: p.technologies,
        startedAt: "",
      },
      source,
      confidence: 0.6,
      basis: p.description.length > 40 ? "documentation" : "self-reported",
      missing,
      warnings: ["Status is not stated in the source. It defaults to “In Progress” unless you change it."],
    });
  }

  for (const c of r.certificates) {
    const skillNames = detectSkills(`${c.title} ${c.issuer}`).map((s) => s.name);
    add({
      kind: "certificate",
      key: c.title,
      data: {
        title: c.title,
        issuer: c.issuer,
        issueDate: c.date.length === 4 ? `${c.date}-01-01` : "",
        credentialUrl: "",
        skillNames,
        verification: "Unverified",
        fileName: "",
        fileType: "",
        fileData: "",
        notes: "",
      },
      source,
      confidence: 0.7,
      basis: "certificate",
      missing: [...(c.issuer ? [] : ["issuer"]), ...(c.date ? [] : ["issue date"]), "credential link"],
      warnings: c.date.length === 4 ? ["Only the year was found. Check the exact issue date."] : [],
    });
  }

  for (const a of r.achievements) add({ kind: "achievement", key: a.title, data: { title: a.title, date: a.date, description: a.description }, source, confidence: 0.6 });

  return out;
}

/* ---------------- Batch cleanup and analysis ---------------- */

/** Removes exact repeats inside one import (the first occurrence wins). */
export function dedupeBatch(list: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const c of list) {
    const key = `${c.kind}:${c.entityId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function profileValue(data: AppData, field: string): string {
  const v = (data.profile as unknown as Record<string, unknown>)[field];
  return typeof v === "string" ? v : "";
}

/** Finds the existing item a candidate would update, if any. */
export function findExisting(c: Candidate, d: AppData): string | undefined {
  const t = c.title;
  switch (c.kind) {
    case "skill":
      return d.skills.find((s) => normalizeKey(s.name) === normalizeKey(t))?.id;
    case "project":
      return d.projects.find((p) => similarity(p.name, t) >= 0.85)?.id;
    case "certificate":
      return d.certificates.find((x) => similarity(x.title, t) >= 0.85)?.id;
    case "achievement":
      return d.achievements.find((a) => similarity(a.title, t) >= 0.85)?.id;
    case "experience":
      return d.profile.experience.find((e) => normalizeKey(`${e.role} ${e.company}`) === normalizeKey(`${str(c.data, "role")} ${str(c.data, "company")}`))?.id;
    case "education":
      return d.profile.education.find((e) => similarity(e.school, t) >= 0.85)?.id;
    case "link":
      return d.profile.links.find((l) => l.url === str(c.data, "url"))?.id;
    case "evidence":
      return d.evidence.find((e) => similarity(e.title, t) >= 0.9)?.id;
    default:
      return undefined;
  }
}

/**
 * Adds duplicate and conflict information without changing data. Pure: safe to call on every edit.
 */
export function analyzeCandidates(list: Candidate[], data: AppData): Candidate[] {
  return list.map((c) => {
    const out: Candidate = { ...c, missing: [...c.missing], warnings: c.warnings.filter((w) => !w.startsWith("Matches ") && !w.startsWith("Different ") && !w.startsWith("Same ")) };

    if (c.kind === "profile") {
      const field = str(c.data, "field");
      const current = profileValue(data, field);
      const value = str(c.data, "value");
      if (current && value) {
        if (normalizeKey(current) === normalizeKey(value)) out.warnings.push("Same as your current value.");
        else {
          out.conflictWith = current;
          out.warnings.push("Different from your current value. Accepting will replace it.");
        }
      }
    } else if (c.kind === "language") {
      if (data.profile.languages.some((l) => normalizeKey(l) === normalizeKey(str(c.data, "name")))) out.warnings.push("Already in your languages.");
    } else {
      const existing = findExisting(c, data);
      if (existing) {
        out.duplicateOf = existing;
        out.warnings.push("Matches something already in your profile. Accept to update it, or merge into a different item.");
      }
    }
    return out;
  });
}

export function emptyCandidateData(kind: CandidateKind): CandidateData {
  switch (kind) {
    case "profile":
      return { field: "about", value: "" };
    case "language":
      return { name: "" };
    case "link":
      return { label: "Website", url: "" };
    case "education":
      return { school: "", degree: "", period: "", details: "" };
    case "experience":
      return { role: "", company: "", period: "", location: "", details: "" };
    case "skill":
      return { name: "", category: "Programming", proficiency: 40, summary: "" };
    case "project":
      return { name: "", summary: "", description: "", kind: "Other", technologies: [], screenshots: [], githubUrl: "", liveUrl: "", status: "", contributions: [], skillNames: [], startedAt: "" };
    case "certificate":
      return { title: "", issuer: "", issueDate: "", credentialUrl: "", skillNames: [], verification: "Unverified", fileName: "", fileType: "", fileData: "", notes: "" };
    case "achievement":
      return { title: "", date: "", description: "" };
    case "evidence":
      return { title: "", url: "", type: "GitHub Repository", skillNames: [], description: "", date: "" };
  }
}
