import { type Evidence, type Profile, type Project, type ProjectKind, type Skill, type SkillCategory } from "../types";
import { todayISO } from "./helpers";
import type { ImportPatch } from "./importMerge";

/* Public GitHub REST API. No token is required; unauthenticated limit is 60 requests/hour per IP. */

export interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  company: string | null;
  html_url: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  created_at: string;
  pushed_at: string;
}

/** Accepts "octocat", "@octocat", "github.com/octocat" or any GitHub URL. */
export function parseGitHubLogin(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  const match = v.match(/github\.com\/([A-Za-z0-9-]+)/i);
  const candidate = (match ? match[1] : v.replace(/^@/, "")).trim();
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(candidate) ? candidate : null;
}

async function githubGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: "application/vnd.github+json" },
    signal,
  });
  if (res.status === 404) throw new Error("No GitHub user with that name.");
  if (res.status === 403 || res.status === 429) throw new Error("GitHub's rate limit was reached (60 lookups per hour). Try again a little later.");
  if (!res.ok) throw new Error(`GitHub responded with status ${res.status}.`);
  return (await res.json()) as T;
}

export const fetchGitHubUser = (login: string, signal?: AbortSignal) =>
  githubGet<GitHubUser>(`/users/${encodeURIComponent(login)}`, signal);

export const fetchGitHubRepos = (login: string, signal?: AbortSignal) =>
  githubGet<GitHubRepo[]>(`/users/${encodeURIComponent(login)}/repos?per_page=100&sort=pushed&type=owner`, signal);

export function sortRepos(repos: GitHubRepo[]): GitHubRepo[] {
  return [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at));
}

const LANGUAGE_CATEGORY: Record<string, SkillCategory> = {
  TypeScript: "Programming",
  JavaScript: "Web Development",
  Python: "Programming",
  Java: "Programming",
  Go: "Programming",
  Rust: "Programming",
  C: "Programming",
  "C++": "Programming",
  "C#": "Programming",
  Kotlin: "Programming",
  Swift: "Programming",
  Ruby: "Programming",
  PHP: "Programming",
  Dart: "Programming",
  "Jupyter Notebook": "Programming",
  HTML: "Web Development",
  CSS: "Web Development",
  SCSS: "Web Development",
  GLSL: "Web Development",
  SQL: "Database",
  PLpgSQL: "Database",
  Shell: "Tools & Technologies",
  Dockerfile: "Tools & Technologies",
};

const ACCENTS = ["#9fb8ff", "#c9b8ff", "#8fd6cc", "#f0cf9b", "#e8b0c4", "#bfe3a6"];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const day = (iso: string) => iso.slice(0, 10);

function safeHttps(url: string | null | undefined): string {
  if (!url) return "";
  const candidate = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    return new URL(candidate).toString();
  } catch {
    return "";
  }
}

function kindFor(r: GitHubRepo): ProjectKind {
  const t = new Set(r.topics.map((x) => x.toLowerCase()));
  const hay = `${r.name} ${r.description ?? ""} ${r.topics.join(" ")}`.toLowerCase();
  if (t.has("three") || t.has("threejs") || t.has("game") || t.has("3d")) return "Game & 3D";
  if (t.has("security") || t.has("ctf") || t.has("pentest") || /security|ctf/.test(hay)) return "Security";
  if (t.has("machine-learning") || t.has("ai") || t.has("data") || /\b(ml|ai|dataset)\b/.test(hay)) return "Data & AI";
  if (["TypeScript", "JavaScript", "HTML", "CSS", "Vue", "Svelte"].includes(r.language ?? "") || t.has("react") || t.has("website") || t.has("web")) return "Web App";
  return "Other";
}

/**
 * Turns a GitHub user and selected repositories into profile fields, projects,
 * language-based skills and GitHub evidence links. Existing skills are reused by name.
 */
export function buildGitHubImport(user: GitHubUser, repos: GitHubRepo[], existingSkills: Skill[]): ImportPatch {
  const own = sortRepos(repos.filter((r) => !r.fork));
  const existingByName = new Map(existingSkills.map((s) => [s.name.toLowerCase(), s] as const));

  const languageCounts = new Map<string, number>();
  for (const r of own) if (r.language) languageCounts.set(r.language, (languageCounts.get(r.language) ?? 0) + 1);

  const skillIdByLanguage = new Map<string, string>();
  const newSkills: Skill[] = [];
  for (const [lang, count] of languageCounts) {
    const existing = existingByName.get(lang.toLowerCase());
    if (existing) {
      skillIdByLanguage.set(lang, existing.id);
      continue;
    }
    const id = `skill-gh-${slugify(lang)}`;
    skillIdByLanguage.set(lang, id);
    newSkills.push({
      id,
      name: lang,
      category: LANGUAGE_CATEGORY[lang] ?? "Programming",
      proficiency: Math.min(90, 30 + count * 12),
      learningStatus: count >= 3 ? "Practicing" : "Learning",
      summary: `Used in ${count} of your public repositories on GitHub.`,
      updatedAt: todayISO(),
    });
  }

  const projects: Project[] = own.slice(0, 12).map((r, i) => {
    const skillIds = r.language && skillIdByLanguage.get(r.language) ? [skillIdByLanguage.get(r.language) as string] : [];
    const technologies = [...new Set([r.language, ...r.topics.slice(0, 5)].filter((x): x is string => Boolean(x)))];
    const home = safeHttps(r.homepage);
    return {
      id: `gh-${r.id}`,
      name: r.name,
      summary: r.description ?? "Public repository imported from GitHub.",
      description: `${r.description ?? "Imported from GitHub."}\n\n★ ${r.stargazers_count} stars · last pushed ${day(r.pushed_at)}`,
      kind: kindFor(r),
      technologies,
      screenshots: [],
      githubUrl: r.html_url,
      liveUrl: home && !home.includes("github.com") ? home : "",
      status: r.archived ? "Completed" : "Maintained",
      featured: i < 2 && r.stargazers_count > 0,
      skillIds,
      contributions: [`Created ${day(r.created_at)}`, `Last pushed ${day(r.pushed_at)}`],
      color: ACCENTS[r.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENTS.length],
      startedAt: day(r.created_at),
    };
  });

  const evidence: Evidence[] = own
    .filter((r) => r.language && skillIdByLanguage.has(r.language))
    .slice(0, 30)
    .map((r) => ({
      id: `ev-gh-${r.id}`,
      title: r.full_name,
      type: "GitHub Repository" as const,
      skillId: skillIdByLanguage.get(r.language as string) ?? "",
      url: r.html_url,
      description: r.description ?? "Public repository",
      dateAdded: day(r.pushed_at),
    }));

  const profile: Partial<Profile> = {
    name: user.name ?? user.login,
    headline: user.bio ?? (user.company ? `Developer at ${user.company}` : ""),
    about: user.bio ?? "",
    location: user.location ?? "",
    email: user.email ?? "",
    github: user.html_url,
    website: safeHttps(user.blog),
    avatar: user.avatar_url,
  };

  return { profile, skills: newSkills, projects, evidence };
}

