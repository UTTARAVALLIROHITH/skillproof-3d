import { emptyResume, type ResumeData } from "../types";
import { parseResumeText } from "../resumeParser";

/**
 * Pluggable AI extraction. Providers return the same ResumeData shape as the local parser,
 * so the rest of the pipeline never needs to know which one ran.
 *
 * SECURITY: the browser never holds an AI API key. The proxy provider posts text to an
 * endpoint YOU run (for example a small serverless function that keeps the key server-side).
 */
export interface AIExtractionProvider {
  name: string;
  extractResume(text: string, signal?: AbortSignal): Promise<ResumeData>;
}

export const localProvider: AIExtractionProvider = {
  name: "Local parser (no AI)",
  async extractResume(text) {
    return parseResumeText(text);
  },
};

const strs = (v: unknown, max = 60): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((s) => s.slice(0, 300)).slice(0, max) : [];

const objs = <T,>(v: unknown, map: (o: Record<string, unknown>) => T, max = 60): T[] =>
  Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null).map(map).slice(0, max)
    : [];

const text = (o: Record<string, unknown>, k: string): string => (typeof o[k] === "string" ? (o[k] as string).slice(0, 2000) : "");

/** Validates and reshapes an untrusted provider response. Unknown fields are dropped. */
export function coerceResume(v: unknown): ResumeData {
  if (!v || typeof v !== "object") throw new Error("The provider returned an unexpected response.");
  const o = v as Record<string, unknown>;
  const r = emptyResume();
  r.name = text(o, "name");
  r.headline = text(o, "headline");
  r.about = text(o, "about");
  r.emails = strs(o.emails);
  r.phones = strs(o.phones);
  r.languages = strs(o.languages);
  r.skills = strs(o.skills);
  r.mentionedSkills = strs(o.mentionedSkills);
  r.links = objs(o.links, (l) => ({ label: text(l, "label") || "Website", url: text(l, "url") }));
  r.education = objs(o.education, (e) => ({ school: text(e, "school"), degree: text(e, "degree"), period: text(e, "period"), details: text(e, "details") }));
  r.experience = objs(o.experience, (e) => ({ role: text(e, "role"), company: text(e, "company"), period: text(e, "period"), location: text(e, "location"), details: text(e, "details") }));
  r.projects = objs(o.projects, (p) => ({ name: text(p, "name"), description: text(p, "description"), technologies: strs(p.technologies), urls: strs(p.urls) }));
  r.certificates = objs(o.certificates, (c) => ({ title: text(c, "title"), issuer: text(c, "issuer"), date: text(c, "date") }));
  r.achievements = objs(o.achievements, (a) => ({ title: text(a, "title"), date: text(a, "date"), description: text(a, "description") }));
  return r;
}

export function createProxyProvider(endpoint: string): AIExtractionProvider {
  const url = new URL(endpoint);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) throw new Error("The AI endpoint must use https://.");
  return {
    name: `AI proxy (${url.host})`,
    async extractResume(input, signal) {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "resume.extract", schemaVersion: 1, text: input.slice(0, 40000) }),
        credentials: "omit",
        signal,
      });
      if (!res.ok) throw new Error(`the provider responded with status ${res.status}`);
      return coerceResume(await res.json());
    },
  };
}
