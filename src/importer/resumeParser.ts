import { detectSkills } from "./dictionary";
import { emptyResume, type ResumeData } from "./types";

/**
 * Local, rules-based resume parser. It only reports what it can see in the text:
 * nothing is inferred about experience, qualifications or proficiency.
 */

type Section = "about" | "experience" | "education" | "skills" | "projects" | "certificates" | "achievements" | "languages";

const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?";
const YEAR = "(?:19|20)\\d{2}";
const END = `(?:${MONTH}\\s+)?(?:${YEAR}|Present|Current|Now|Today)`;
const PERIOD_RE = new RegExp(`(?:${MONTH}\\s+)?${YEAR}\\s*(?:–|-|—|to)\\s*${END}|(?:${MONTH}\\s+)?${YEAR}`, "i");
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/g;
const URL_RE = /(?:https?:\/\/|www\.)[^\s,;)]+|\b(?:github|gitlab|linkedin|behance|dribbble|youtube)\.(?:com|net|be)\/[^\s,;)]+/gi;
const SCHOOL_RE = /university|college|school|institute|academy|polytechnic|universidade|faculdade/i;
const DEGREE_RE = /\b(b\.?sc|bsc|b\.?a|m\.?sc|msc|m\.?eng|mba|ph\.?d|bachelor|master|diploma|degree|associate)\b/i;

const HEADINGS: [RegExp, Section][] = [
  [/^(professional\s+)?summary$|^profile$|^about( me)?$|^objective$/i, "about"],
  [/^(work\s+|professional\s+)?experience$|^employment( history)?$|^work history$/i, "experience"],
  [/^education( & training)?$|^academic( background)?$/i, "education"],
  [/^(technical\s+|core\s+)?skills?$|^technologies$|^tools & technologies$|^competencies$/i, "skills"],
  [/^(personal\s+|selected\s+|key\s+)?projects?$|^portfolio$/i, "projects"],
  [/^certifications?( & licenses)?$|^certificates?$|^licen[cs]es?$|^courses$/i, "certificates"],
  [/^(achievements?|awards?|honou?rs|accomplishments)( & awards)?$/i, "achievements"],
  [/^languages?$/i, "languages"],
];

const isBullet = (l: string) => /^[•\-*▪◦·]\s*/.test(l);
const stripBullet = (l: string) => l.replace(/^[•\-*▪◦·]\s*/, "");
const unique = <T,>(xs: T[]) => [...new Set(xs)];

function lines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim());
}

function headingOf(line: string): Section | null {
  const t = line.replace(/:$/, "").trim();
  if (!t || t.split(" ").length > 5) return null;
  for (const [re, section] of HEADINGS) if (re.test(t)) return section;
  return null;
}

function normalizeUrl(u: string): string {
  const trimmed = u.replace(/[.,;]+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function labelFor(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (/github/.test(host)) return "GitHub";
    if (/linkedin/.test(host)) return "LinkedIn";
    return host;
  } catch {
    return "Website";
  }
}

function splitHeader(h: string): string[] {
  return h
    .split(/\s+(?:at|@)\s+|\s+[|•·—–]\s+|\s+-\s+|,\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Groups a section's lines into entries. A dated, non-bullet line starts a new entry. */
function toBlocks(sec: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) blocks.push(current);
    current = [];
  };
  for (const line of sec) {
    if (!line) {
      flush();
      continue;
    }
    if (!isBullet(line) && PERIOD_RE.test(line) && current.some((l) => PERIOD_RE.test(l))) flush();
    current.push(isBullet(line) ? stripBullet(line) : line);
  }
  flush();
  return blocks;
}

function parseExperience(block: string[]) {
  const [head = "", ...rest] = block;
  const period = head.match(PERIOD_RE)?.[0] ?? "";
  const parts = splitHeader(head.replace(PERIOD_RE, "").replace(/[|•·—–-]\s*$/, "").trim());
  return {
    role: parts[0] ?? "",
    company: parts[1] ?? "",
    period,
    location: parts[2] ?? "",
    details: rest.join(" "),
  };
}

function parseEducation(block: string[]) {
  const segments = block
    .flatMap((l) => l.split(/\s*[|•]\s*|\s+[–—]\s+|\s+-\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
  const school = segments.find((s) => SCHOOL_RE.test(s)) ?? segments[0] ?? "";
  const degree = segments.find((s) => DEGREE_RE.test(s) && s !== school) ?? "";
  const period = block.join(" ").match(PERIOD_RE)?.[0] ?? "";
  return { school, degree, period, details: block.slice(1).join(" ") };
}

function parseProject(block: string[]) {
  const [head = "", ...rest] = block;
  const name = head.split(/\s[–—:|-]\s|:\s/)[0].slice(0, 80);
  const leading = head.slice(name.length).replace(/^\s*[–—:|-]\s*/, "");
  const all = block.join(" ");
  return {
    name,
    description: [leading, ...rest].filter(Boolean).join(" "),
    technologies: detectSkills(all).map((s) => s.name),
    urls: (all.match(URL_RE) ?? []).map(normalizeUrl),
  };
}

function parseCertificate(line: string) {
  const date = line.match(/(?:19|20)\d{2}/)?.[0] ?? "";
  const parts = line
    .split(/\s+[–—|-]\s+|\s+by\s+|\s+from\s+|\s*\|\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const title = (parts[0] ?? line).replace(/\(\s*(?:19|20)\d{2}\s*\)/, "").trim();
  const issuer = parts.slice(1).find((p) => !/^(?:19|20)\d{2}$/.test(p)) ?? "";
  return { title, issuer, date };
}

export function parseResumeText(input: string): ResumeData {
  const all = lines(input);
  const sections: Partial<Record<Section, string[]>> = {};
  const preface: string[] = [];
  let current: Section | null = null;

  for (const line of all) {
    const heading = headingOf(line);
    if (heading) {
      current = heading;
      sections[heading] ??= [];
      continue;
    }
    if (current) sections[current]?.push(line);
    else preface.push(line);
  }

  const text = all.join("\n");
  const r = emptyResume();

  r.emails = unique(text.match(EMAIL_RE) ?? []);
  r.phones = unique(
    (text.match(PHONE_RE) ?? []).map((p) => p.trim()).filter((p) => {
      const digits = p.replace(/\D/g, "").length;
      return digits >= 8 && digits <= 15;
    })
  ).slice(0, 3);

  const seenUrls = new Set<string>();
  for (const raw of text.match(URL_RE) ?? []) {
    const url = normalizeUrl(raw);
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    r.links.push({ label: labelFor(url), url });
  }

  const nameIndex = preface.findIndex(
    (l) =>
      l.length > 3 &&
      l.length < 50 &&
      !/[@\d]/.test(l) &&
      !/https?:\/\/|www\./i.test(l) &&
      /^[\p{L}][\p{L} .'-]+$/u.test(l) &&
      l.split(" ").every((w) => /^\p{Lu}/u.test(w)) &&
      l.split(" ").length >= 2 &&
      l.split(" ").length <= 5
  );
  if (nameIndex >= 0) {
    r.name = preface[nameIndex];
    const next = preface[nameIndex + 1] ?? "";
    if (next && next.length < 140 && !/@|https?:|www\./i.test(next) && !headingOf(next)) r.headline = next;
  }

  r.about = (sections.about ?? []).filter(Boolean).join(" ");

  for (const block of toBlocks(sections.experience ?? [])) {
    const e = parseExperience(block);
    if (e.role || e.company) r.experience.push(e);
  }

  for (const block of toBlocks(sections.education ?? [])) {
    const e = parseEducation(block);
    if (e.school) r.education.push(e);
  }

  const skillTokens = (sections.skills ?? [])
    .flatMap((l) => l.split(/[,;•|]|\s{2,}/))
    .map((s) => stripBullet(s.trim()))
    .filter((s) => s.length >= 2 && s.length <= 40 && s.split(" ").length <= 4);
  r.skills = unique(skillTokens);

  const listed = new Set(r.skills.map((s) => s.toLowerCase()));
  r.mentionedSkills = detectSkills(text)
    .map((s) => s.name)
    .filter((n) => !listed.has(n.toLowerCase()));

  for (const block of toBlocks(sections.projects ?? [])) {
    const p = parseProject(block);
    if (p.name) r.projects.push(p);
  }

  r.certificates = (sections.certificates ?? [])
    .filter(Boolean)
    .map((l) => parseCertificate(stripBullet(l)))
    .filter((c) => c.title);

  r.achievements = (sections.achievements ?? [])
    .filter(Boolean)
    .map((l) => {
      const clean = stripBullet(l);
      return { title: clean.replace(/\s*[(–—|-]?\s*(?:19|20)\d{2}\)?$/, "").trim(), date: clean.match(/(?:19|20)\d{2}/)?.[0] ?? "", description: "" };
    })
    .filter((a) => a.title);

  r.languages = unique(
    (sections.languages ?? [])
      .join(",")
      .split(/[,;•|]/)
      .map((t) => t.replace(/\(.*?\)|[-–:].*$/g, "").trim())
      .filter((t) => t.length >= 2 && t.length <= 30 && /^[\p{L} .'-]+$/u.test(t))
  );

  return r;
}
