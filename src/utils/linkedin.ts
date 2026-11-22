import JSZip from "jszip";
import { type Certificate, type Education, type Experience, type Project, type Skill, type SkillCategory } from "../types";
import { todayISO } from "./helpers";
import type { ImportPatch } from "./importMerge";

/**
 * LinkedIn does not offer a public profile API to apps, so profile details come from
 * the official "Get a copy of your data" archive. The archive is parsed entirely in
 * the browser and never uploaded anywhere.
 */

export type CsvRow = Record<string, string>;

export interface LinkedInExport {
  profile: CsvRow[];
  positions: CsvRow[];
  education: CsvRow[];
  skills: CsvRow[];
  certifications: CsvRow[];
  projects: CsvRow[];
  emails: CsvRow[];
}

const FILE_MAP: Record<string, keyof LinkedInExport> = {
  "profile.csv": "profile",
  "positions.csv": "positions",
  "education.csv": "education",
  "skills.csv": "skills",
  "certifications.csv": "certifications",
  "projects.csv": "projects",
  "email addresses.csv": "emails",
};

/** RFC-4180-style CSV parser that handles quoted fields, escaped quotes and newlines. */
export function parseCsv(text: string): CsvRow[] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header = [], ...body] = rows.filter((r) => r.some((c) => c.trim() !== ""));
  const keys = header.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

/** Reads a LinkedIn ZIP archive, or individual CSV files, into structured rows. */
export async function readLinkedInFiles(files: File[]): Promise<LinkedInExport> {
  const out: LinkedInExport = { profile: [], positions: [], education: [], skills: [], certifications: [], projects: [], emails: [] };
  const sources: { name: string; text: string }[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      for (const entry of Object.values(zip.files)) {
        if (entry.dir) continue;
        sources.push({ name: entry.name.split("/").pop() ?? entry.name, text: await entry.async("string") });
      }
    } else {
      sources.push({ name: file.name, text: await file.text() });
    }
  }

  for (const { name, text } of sources) {
    const key = FILE_MAP[name.toLowerCase()];
    if (key) out[key] = parseCsv(text);
  }
  return out;
}

const SKILL_HINTS: [RegExp, SkillCategory][] = [
  [/react|vue|angular|next|svelte|html|css|javascript|node|web|tailwind|three/i, "Web Development"],
  [/sql|postgres|mysql|mongo|database|redis|oracle/i, "Database"],
  [/secur|pentest|owasp|network|firewall|crypto/i, "Cybersecurity"],
  [/figma|design|ux|ui|accessib|research|sketch/i, "UI/UX Design"],
  [/git|docker|kubern|aws|azure|linux|jira|ci\/cd|terraform/i, "Tools & Technologies"],
  [/java|python|c\+\+|c#|typescript|programming|golang|rust|kotlin|swift|php|ruby/i, "Programming"],
];

function guessCategory(name: string): SkillCategory {
  return SKILL_HINTS.find(([re]) => re.test(name))?.[1] ?? "Tools & Technologies";
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ACCENTS = ["#9fb8ff", "#c9b8ff", "#8fd6cc", "#f0cf9b", "#e8b0c4", "#bfe3a6"];

/** LinkedIn dates look like "Jan 2024" or "2024". Returns ISO yyyy-mm-dd or "". */
function isoDate(raw: string): string {
  if (!raw) return "";
  const normalized = raw.replace(/^([A-Za-z]+)\s+(\d{4})$/, "$1 1, $2");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

const span = (start: string, end: string) => [start, end || "Present"].filter(Boolean).join(" – ");
const firstUrl = (raw: string) => raw.match(/https?:\/\/[^\s,\]]+/)?.[0] ?? "";
const pick = (row: CsvRow | undefined, ...keys: string[]): string => {
  for (const k of keys) {
    const v = row?.[k];
    if (v) return v;
  }
  return "";
};

/** Converts a LinkedIn export into an import patch. Existing skills are reused by name. */
export function linkedInToPatch(x: LinkedInExport, existingSkills: Skill[]): ImportPatch {
  const p = x.profile[0];
  const email = pick(x.emails[0], "Email Address");
  const name = `${pick(p, "First Name")} ${pick(p, "Last Name")}`.trim();

  const experience: Experience[] = x.positions
    .map((r) => {
      const company = pick(r, "Company Name");
      const role = pick(r, "Title");
      return {
        id: `li-exp-${slugify(`${company}-${role}`)}`,
        role,
        company,
        period: span(pick(r, "Started On"), pick(r, "Finished On")),
        location: pick(r, "Location"),
        details: pick(r, "Description"),
      };
    })
    .filter((e) => e.company || e.role);

  const education: Education[] = x.education
    .map((r) => {
      const school = pick(r, "School Name");
      return {
        id: `li-edu-${slugify(school)}`,
        school,
        degree: pick(r, "Degree Name"),
        period: span(pick(r, "Start Date"), pick(r, "End Date")),
        details: pick(r, "Notes", "Activities"),
      };
    })
    .filter((e) => e.school);

  const existingByName = new Map(existingSkills.map((s) => [s.name.toLowerCase(), s] as const));
  const skills: Skill[] = x.skills
    .map((r) => pick(r, "Name"))
    .filter((n) => n && !existingByName.has(n.toLowerCase()))
    .map((n) => ({
      id: `skill-li-${slugify(n)}`,
      name: n,
      category: guessCategory(n),
      proficiency: 40,
      learningStatus: "Learning" as const,
      summary: "Listed on your LinkedIn profile. Add evidence to prove it.",
      updatedAt: todayISO(),
    }));

  const projects: Project[] = x.projects
    .map((r) => {
      const url = pick(r, "Url");
      const isGit = /github\.com/i.test(url);
      const title = pick(r, "Title");
      return {
        id: `li-proj-${slugify(title)}`,
        name: title,
        summary: pick(r, "Description").slice(0, 140),
        description: pick(r, "Description"),
        kind: "Other" as const,
        technologies: [],
        screenshots: [],
        githubUrl: isGit ? url : "",
        liveUrl: isGit ? "" : url,
        status: "Completed" as const,
        featured: false,
        skillIds: [],
        contributions: [],
        color: ACCENTS[title.length % ACCENTS.length],
        startedAt: isoDate(pick(r, "Started On")) || todayISO(),
      };
    })
    .filter((pr) => pr.name);

  const certificates: Certificate[] = x.certifications
    .map((r) => {
      const url = firstUrl(pick(r, "Url"));
      const name = pick(r, "Name");
      return {
        id: `li-cert-${slugify(name)}`,
        title: name,
        issuer: pick(r, "Authority"),
        issueDate: isoDate(pick(r, "Started On")) || todayISO(),
        credentialUrl: url,
        skillIds: [],
        verification: url ? ("Credential linked" as const) : ("Unverified" as const),
        fileName: "",
        fileType: "",
        fileData: "",
        notes: "Imported from LinkedIn. Not yet checked against the issuer.",
      };
    })
    .filter((c) => c.title);

  return {
    profile: {
      name,
      headline: pick(p, "Headline"),
      about: pick(p, "Summary"),
      location: pick(p, "Geo Location", "Location"),
      website: firstUrl(pick(p, "Websites")),
      email,
      experience,
      education,
    },
    skills,
    projects,
    certificates,
  };
}
