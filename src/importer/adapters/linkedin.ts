import { linkedInToPatch, readLinkedInFiles } from "../../utils/linkedin";
import type { ImportPatch } from "../../utils/importMerge";
import { categoryFor, detectSkills } from "../dictionary";
import { makeCandidate, refFor, slugify, type CandidateInit } from "../candidates";
import { ImportError, type Candidate, type SourceRef } from "../types";
import { validateUrl } from "../validate";
import type { SourceAdapter } from "./base";

/** Converts the LinkedIn archive patch into reviewable candidates. Development status is never assumed. */
function patchToCandidates(p: ImportPatch, source: SourceRef): Candidate[] {
  const out: Candidate[] = [];
  const add = (init: CandidateInit) => out.push(makeCandidate(init));

  for (const [field, value] of Object.entries(p.profile ?? {})) {
    if (typeof value === "string" && value.trim()) {
      add({ kind: "profile", key: `profile-${field}`, entityId: `imp-profile-${field}`, data: { field, value }, source, confidence: 0.9, basis: "self-reported" });
    }
  }
  for (const e of p.profile?.education ?? []) {
    add({ kind: "education", key: e.school, entityId: e.id, data: { ...e }, source, confidence: 0.9, missing: e.period ? [] : ["dates"] });
  }
  for (const e of p.profile?.experience ?? []) {
    add({ kind: "experience", key: `${e.role}|${e.company}`, entityId: e.id, data: { ...e }, source, confidence: 0.9, missing: e.period ? [] : ["dates"] });
  }
  for (const s of p.skills ?? []) {
    add({
      kind: "skill",
      key: s.name,
      entityId: `skill-${slugify(s.name)}`,
      data: { name: s.name, category: categoryFor(s.name), proficiency: 40, summary: "Listed on your LinkedIn profile." },
      source,
      confidence: 0.9,
      basis: "self-reported",
    });
  }
  for (const pr of p.projects ?? []) {
    add({
      kind: "project",
      key: pr.name,
      entityId: pr.id,
      data: {
        name: pr.name,
        summary: pr.summary,
        description: pr.description,
        kind: "Other",
        technologies: [],
        screenshots: [],
        githubUrl: pr.githubUrl,
        liveUrl: pr.liveUrl,
        status: "",
        contributions: [],
        skillNames: detectSkills(`${pr.name} ${pr.description}`).map((s) => s.name),
        startedAt: pr.startedAt,
      },
      source,
      confidence: 0.85,
      basis: "self-reported",
      missing: ["development status"],
    });
  }
  for (const c of p.certificates ?? []) {
    add({
      kind: "certificate",
      key: c.title,
      entityId: c.id,
      data: {
        title: c.title,
        issuer: c.issuer,
        issueDate: c.issueDate,
        credentialUrl: c.credentialUrl,
        skillNames: detectSkills(c.title).map((s) => s.name),
        verification: "Unverified",
        fileName: "",
        fileType: "",
        fileData: "",
        notes: "",
      },
      source,
      confidence: 0.85,
      basis: "self-reported",
      missing: c.credentialUrl ? [] : ["credential link"],
    });
  }
  return out;
}

export const linkedinAdapter: SourceAdapter = {
  id: "linkedin",
  label: "LinkedIn",
  handles: ["linkedin-export", "linkedin-url"],
  async run(input, ctx) {
    if (input.type === "linkedin-url") {
      const check = validateUrl(input.url);
      if (!check.ok) throw new ImportError(check.error);
      if (!/(^|\.)linkedin\.com$/i.test(new URL(check.url).hostname)) throw new ImportError("Enter a linkedin.com profile link.");
      const source: SourceRef = { kind: "linkedin", label: "LinkedIn profile link", ref: refFor(input), method: "link-only" };
      const link = makeCandidate({ kind: "link", key: check.url, data: { label: "LinkedIn", url: check.url }, source, confidence: 1, basis: "self-reported" });
      return {
        source,
        candidates: [link],
        warnings: ["LinkedIn doesn't allow apps to read profile pages automatically, so only the link was saved. Upload your data archive for the full profile."],
      };
    }

    if (input.type !== "linkedin-export") throw new ImportError("The LinkedIn importer received an unsupported source.");
    ctx.onProgress("Reading LinkedIn archive", 25);
    const exported = await readLinkedInFiles(input.files);
    ctx.onProgress("Converting records", 70);
    const patch = linkedInToPatch(exported, []);
    const source: SourceRef = {
      kind: "linkedin",
      label: `LinkedIn export (${input.files.map((f) => f.name).join(", ")})`,
      ref: refFor(input),
      method: "export-archive",
    };
    const candidates = patchToCandidates(patch, source);
    return {
      source,
      candidates,
      warnings: candidates.length ? [] : ["No recognised LinkedIn records were found in this archive."],
    };
  },
};
