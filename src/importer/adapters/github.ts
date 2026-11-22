import { fetchGitHubRepos, fetchGitHubUser, parseGitHubLogin, sortRepos, type GitHubRepo } from "../../utils/github";
import { categoryFor, detectSkills } from "../dictionary";
import { makeCandidate, refFor, slugify, type CandidateInit } from "../candidates";
import { ImportError, type Candidate, type SourceRef } from "../types";

import { safeHttpUrl, sanitizeText } from "../validate";
import type { SourceAdapter } from "./base";

const API = "https://api.github.com";

/** Non-critical reads: returns null instead of throwing, so one failure never aborts the import. */
async function ghJson<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { headers: { Accept: "application/vnd.github+json" }, signal });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

interface GhReadme {
  content?: string;
  encoding?: string;
}

async function fetchReadme(fullName: string, signal?: AbortSignal): Promise<string> {
  const r = await ghJson<GhReadme>(`/repos/${fullName}/readme`, signal);
  if (!r?.content || r.encoding !== "base64") return "";
  try {
    const bin = atob(r.content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return sanitizeText(new TextDecoder("utf-8").decode(bytes), 6000);
  } catch {
    return "";
  }
}

interface GhEvent {
  type: string;
  repo: { name: string };
  payload?: { size?: number };
}

function kindFor(r: GitHubRepo): string {
  const topics = new Set(r.topics.map((t) => t.toLowerCase()));
  const hay = `${r.name} ${r.description ?? ""} ${r.topics.join(" ")}`.toLowerCase();
  if (topics.has("three") || topics.has("threejs") || topics.has("game") || topics.has("3d")) return "Game & 3D";
  if (topics.has("security") || topics.has("ctf") || /security|ctf/.test(hay)) return "Security";
  if (topics.has("machine-learning") || topics.has("ai") || topics.has("data")) return "Data & AI";
  if (["TypeScript", "JavaScript", "HTML", "CSS", "Vue", "Svelte"].includes(r.language ?? "") || topics.has("react") || topics.has("website")) return "Web App";
  return "Other";
}

const uniq = (xs: string[]) => [...new Set(xs)];

export const githubAdapter: SourceAdapter = {
  id: "github",
  label: "GitHub",
  handles: ["github"],
  async run(input, ctx) {
    if (input.type !== "github") throw new ImportError("The GitHub importer received an unsupported source.");
    const login = parseGitHubLogin(input.login);
    if (!login) throw new ImportError("That doesn't look like a GitHub username or profile link.");

    const source: SourceRef = { kind: "github", label: `GitHub · ${login}`, ref: refFor(input), method: "public-api" };

    ctx.onProgress("Fetching GitHub profile", 15);
    const user = await fetchGitHubUser(login, ctx.signal);
    const repos = sortRepos(await fetchGitHubRepos(login, ctx.signal)).filter((r) => !r.fork).slice(0, 12);

    ctx.onProgress("Reading repository documentation", 40);
    const readmes = new Map<number, string>();
    await Promise.all(
      repos.slice(0, 8).map(async (r) => {
        const text = await fetchReadme(r.full_name, ctx.signal);
        if (text) readmes.set(r.id, text);
      })
    );

    ctx.onProgress("Checking public activity", 65);
    const events = (await ghJson<GhEvent[]>(`/users/${login}/events/public?per_page=100`, ctx.signal)) ?? [];
    const commits = new Map<string, number>();
    for (const ev of events) {
      if (ev.type !== "PushEvent") continue;
      const key = ev.repo.name.toLowerCase();
      commits.set(key, (commits.get(key) ?? 0) + (ev.payload?.size ?? 1));
    }

    ctx.onProgress("Building candidates", 85);
    const out: Candidate[] = [];
    const add = (init: CandidateInit) => out.push(makeCandidate(init));

    const profile = (field: string, value: string) => {
      if (value) add({ kind: "profile", key: `profile-${field}`, entityId: `imp-profile-${field}`, data: { field, value }, source, confidence: 0.95, basis: "self-reported" });
    };
    profile("name", user.name ?? user.login);
    profile("headline", user.bio ?? "");
    profile("about", user.bio ?? "");
    profile("location", user.location ?? "");
    profile("email", user.email ?? "");
    profile("github", user.html_url);
    profile("website", safeHttpUrl(user.blog ?? ""));

    const languageCounts = new Map<string, number>();
    for (const r of repos) if (r.language) languageCounts.set(r.language, (languageCounts.get(r.language) ?? 0) + 1);
    for (const [lang, n] of languageCounts) {
      add({
        kind: "skill",
        key: lang,
        entityId: `skill-${slugify(lang)}`,
        data: { name: lang, category: categoryFor(lang), proficiency: Math.min(90, 30 + n * 12), summary: `Used in ${n} of your public repositories.` },
        source,
        confidence: 0.85,
        basis: "documentation",
      });
    }

    for (const r of repos) {
      const readme = readmes.get(r.id) ?? "";
      const found = detectSkills(`${r.description ?? ""} ${r.topics.join(" ")} ${readme}`).map((s) => s.name);
      const technologies = uniq([r.language ?? "", ...r.topics].filter(Boolean)).slice(0, 12);
      const skillNames = uniq([...(r.language ? [r.language] : []), ...found]);

      for (const name of found) {
        add({
          kind: "skill",
          key: name,
          entityId: `skill-${slugify(name)}`,
          data: { name, category: categoryFor(name), proficiency: 40, summary: `Found in the documentation of ${r.full_name}.` },
          source,
          confidence: 0.7,
          basis: "documentation",
        });
      }

      const home = safeHttpUrl(r.homepage ?? "");
      const activity = commits.get(r.full_name.toLowerCase());
      const contributions = [
        `Created ${r.created_at.slice(0, 10)}`,
        `Last pushed ${r.pushed_at.slice(0, 10)}`,
        ...(activity ? [`${activity} recent public commit${activity === 1 ? "" : "s"} (public activity feed)`] : []),
      ];

      add({
        kind: "project",
        key: r.name,
        data: {
          name: r.name,
          summary: r.description ?? "",
          description: readme || r.description || "",
          kind: kindFor(r),
          technologies,
          screenshots: [],
          githubUrl: r.html_url,
          liveUrl: home && !/github\.com/i.test(home) ? home : "",
          status: r.archived ? "Completed" : "",
          contributions,
          skillNames,
          startedAt: r.created_at.slice(0, 10),
        },
        source,
        confidence: 0.9,
        basis: readme ? "documentation" : "self-reported",
        missing: r.archived ? [] : ["development status"],
        snippet: readme.slice(0, 240),
      });

      if (skillNames.length) {
        add({
          kind: "evidence",
          key: r.full_name,
          data: { title: r.full_name, type: "GitHub Repository", url: r.html_url, description: r.description ?? "Public repository", date: r.pushed_at.slice(0, 10), skillNames },
          source,
          confidence: 0.9,
          basis: "documentation",
        });
      }
    }

    const warnings: string[] = [];
    if (repos.length === 0) warnings.push("No public, non-fork repositories were found.");
    if (repos.length > 0 && readmes.size === 0) warnings.push("No README files could be read. Repository descriptions were used instead.");
    if (events.length === 0) warnings.push("No recent public activity was available to summarise.");

    return { source, candidates: out, warnings };
  },
};
