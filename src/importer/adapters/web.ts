import { detectSkills, categoryFor } from "../dictionary";
import { makeCandidate, refFor, slugify, type CandidateInit } from "../candidates";
import { ImportError, type Candidate, type SourceRef } from "../types";
import { safeHttpUrl, sanitizeText, validateUrl } from "../validate";
import type { SourceAdapter } from "./base";

const PROVIDERS: [RegExp, string][] = [
  [/behance\.net/i, "Behance"],
  [/dribbble\.com/i, "Dribbble"],
  [/youtube\.com|youtu\.be/i, "YouTube"],
  [/gitlab\.com/i, "GitLab"],
  [/github\.com/i, "GitHub"],
  [/linkedin\.com/i, "LinkedIn"],
];

/** Platforms and sites the website importer recognises. Shown in the UI. */
export const SUPPORTED_PROVIDERS = ["Personal website", "Behance", "Dribbble", "YouTube", "GitLab", "GitHub"];

export function providerFor(url: string): string {
  const host = new URL(url).hostname;
  return PROVIDERS.find(([re]) => re.test(host))?.[1] ?? "Personal website";
}

/** Reads metadata and visible text from HTML. DOMParser does not execute scripts. */
export function parsePage(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const meta = (selector: string) => doc.querySelector(selector)?.getAttribute("content") ?? "";
  const title = doc.title || meta('meta[property="og:title"]');
  const description = meta('meta[name="description"]') || meta('meta[property="og:description"]');
  const image = meta('meta[property="og:image"]');
  doc.querySelectorAll("script, style, noscript, template").forEach((n) => n.remove());
  return {
    title: sanitizeText(title, 200),
    description: sanitizeText(description, 400),
    image: safeHttpUrl(image),
    text: sanitizeText(doc.body?.textContent ?? "", 60000),
  };
}

export const websiteAdapter: SourceAdapter = {
  id: "website",
  label: "Portfolio & websites",
  handles: ["web-url"],
  async run(input, ctx) {
    if (input.type !== "web-url") throw new ImportError("The website importer received an unsupported source.");
    const check = validateUrl(input.url);
    if (!check.ok) throw new ImportError(check.error);

    const provider = providerFor(check.url);
    const source: SourceRef = { kind: "website", label: `${provider} · ${new URL(check.url).hostname}`, ref: refFor(input), method: "page-metadata" };
    const warnings: string[] = [];
    const out: Candidate[] = [];
    const add = (init: CandidateInit) => out.push(makeCandidate(init));

    ctx.onProgress("Fetching the page", 20);
    let html: string | null = null;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12_000);
    ctx.signal?.addEventListener("abort", () => controller.abort());
    try {
      const res = await fetch(check.url, { credentials: "omit", redirect: "follow", headers: { Accept: "text/html" }, signal: controller.signal });
      if (res.ok) {
        const type = res.headers.get("content-type") ?? "";
        if (type.includes("text/html")) html = (await res.text()).slice(0, 1_500_000);
        else warnings.push("This link is not an HTML page, so only the link was saved.");
      }
    } catch {
      html = null;
    } finally {
      window.clearTimeout(timer);
    }

    add({ kind: "link", key: check.url, data: { label: provider, url: check.url }, source, confidence: 0.9, basis: "self-reported" });

    if (!html) {
      warnings.push(`${provider} pages can't be read directly from the browser because the site blocks cross-origin reading. The link was saved. Paste the page text into a document to extract details.`);
      if (input.projectName) {
        add({
          kind: "project",
          key: input.projectName,
          data: { name: input.projectName, summary: "", description: "", kind: "Other", technologies: [], screenshots: [], githubUrl: /github\.com/i.test(check.url) ? check.url : "", liveUrl: /github\.com/i.test(check.url) ? "" : check.url, status: "", contributions: [], skillNames: [], startedAt: "" },
          source,
          confidence: 0.6,
          basis: "self-reported",
          missing: ["development status", "description"],
        });
      }
      return { source, candidates: out, warnings };
    }

    const page = parsePage(html);
    const skills = detectSkills(page.text).slice(0, 25);

    if (input.projectName) {
      const isGit = /github\.com|gitlab\.com/i.test(check.url);
      add({
        kind: "project",
        key: input.projectName,
        data: {
          name: input.projectName,
          summary: page.description,
          description: page.description,
          kind: "Other",
          technologies: skills.map((s) => s.name).slice(0, 12),
          screenshots: page.image ? [page.image] : [],
          githubUrl: isGit ? check.url : "",
          liveUrl: isGit ? "" : check.url,
          status: "",
          contributions: [],
          skillNames: skills.map((s) => s.name),
          startedAt: "",
        },
        source,
        confidence: 0.6,
        basis: "documentation",
        missing: ["development status"],
        warnings: ["Development status is not stated on the page. Please confirm it."],
        snippet: page.text.slice(0, 200),
      });
    }

    for (const s of skills) {
      add({
        kind: "skill",
        key: s.name,
        entityId: `skill-${slugify(s.name)}`,
        data: { name: s.name, category: categoryFor(s.name), proficiency: 40, summary: `Mentioned on ${new URL(check.url).hostname}.` },
        source,
        confidence: 0.5,
        basis: "documentation",
      });
    }
    if (skills.length) warnings.push("Skills were detected from page text. Review them before importing.");
    if (page.title) warnings.push(`Page title: “${page.title}”.`);

    return { source, candidates: out, warnings };
  },
};
