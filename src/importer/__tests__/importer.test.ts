import { describe, expect, it } from "vitest";
import { sampleData } from "../../data/sampleData";
import { parseCsv } from "../../utils/linkedin";
import { parseGitHubLogin } from "../../utils/github";
import { analyzeCandidates, makeCandidate, normalizeKey, similarity } from "../candidates";
import { applyCandidates } from "../apply";
import { categoryFor, detectSkills } from "../dictionary";
import { extractPdfText, textFromContent } from "../pdf";
import { parseResumeText } from "../resumeParser";
import { coerceResume } from "../ai/provider";
import { type Candidate, type CandidateKind, type SourceRef } from "../types";
import { sanitizeText, validateUrl } from "../validate";

const SOURCE: SourceRef = { kind: "resume", label: "test.pdf", ref: "file:test", method: "text-parse" };

function cand(kind: CandidateKind, key: string, data: Record<string, string | string[] | number>, extra: Partial<Candidate> = {}): Candidate {
  return { ...makeCandidate({ kind, key, data, source: SOURCE, confidence: 0.8 }), status: "accepted", ...extra };
}

const RESUME = `Alex Rivera
Software Engineer
alex@example.com | +351 912 345 678 | https://github.com/alexr | linkedin.com/in/alexr

Summary
Full-stack developer who builds accessible web apps.

Experience
Frontend Engineer at Acme Labs | Jan 2023 – Present
• Built dashboards in React and TypeScript
• Improved Lighthouse score to 95

Education
University of Lisbon – B.Sc. Computer Science | 2021 – 2024

Skills
TypeScript, React, PostgreSQL, Figma

Projects
Campus Marketplace - Marketplace for students using React and PostgreSQL. https://github.com/alexr/market

Certifications
Introduction to Cybersecurity - Demo Academy, 2025

Languages
English (Native), Portuguese - Fluent

Achievements
Dean's List 2024`;

describe("GitHub login parsing", () => {
  it("accepts usernames, @handles and profile URLs", () => {
    expect(parseGitHubLogin("octocat")).toBe("octocat");
    expect(parseGitHubLogin("@octocat")).toBe("octocat");
    expect(parseGitHubLogin("https://github.com/octocat/hello-world")).toBe("octocat");
  });
  it("rejects invalid input", () => {
    expect(parseGitHubLogin("")).toBeNull();
    expect(parseGitHubLogin("-bad-")).toBeNull();
  });
});

describe("input validation and sanitisation", () => {
  it("only accepts public http(s) links", () => {
    expect(validateUrl("https://example.com/portfolio").ok).toBe(true);
    expect(validateUrl("http://localhost:3000").ok).toBe(false);
    expect(validateUrl("http://192.168.1.10").ok).toBe(false);
    expect(validateUrl("https://user:pass@example.com").ok).toBe(false);
  });
  it("strips markup and control characters from text", () => {
    expect(sanitizeText("<script>alert(1)</script>Hello\u0007 world")).not.toContain("<script>");
    expect(sanitizeText("Hello\u0007 world")).toBe("Hello world");
  });
});

describe("resume parser", () => {
  const r = parseResumeText(RESUME);

  it("reads identity and contact details", () => {
    expect(r.name).toBe("Alex Rivera");
    expect(r.headline).toBe("Software Engineer");
    expect(r.emails).toContain("alex@example.com");
    expect(r.phones.length).toBe(1);
    expect(r.links.some((l) => l.label === "GitHub")).toBe(true);
  });
  it("extracts experience, education and projects without inventing fields", () => {
    expect(r.experience[0]).toMatchObject({ role: "Frontend Engineer", company: "Acme Labs" });
    expect(r.experience[0].period).toContain("2023");
    expect(r.education[0].school).toContain("University");
    expect(r.projects[0].name).toBe("Campus Marketplace");
    expect(r.projects[0].technologies).toEqual(expect.arrayContaining(["React", "PostgreSQL"]));
  });
  it("extracts skills, certificates, languages and achievements", () => {
    expect(r.skills).toEqual(expect.arrayContaining(["TypeScript", "Figma"]));
    expect(r.certificates[0]).toMatchObject({ title: "Introduction to Cybersecurity", date: "2025" });
    expect(r.languages).toEqual(expect.arrayContaining(["English", "Portuguese"]));
    expect(r.achievements[0].title).toBe("Dean's List");
  });
  it("does not invent a name when none is present", () => {
    expect(parseResumeText("12345 678 900\nsome text only").name).toBe("");
  });
});

describe("skill dictionary", () => {
  it("matches whole tokens and respects ambiguous short names", () => {
    const names = detectSkills("We used Node.js, PostgreSQL and C++, and we go to the store.").map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(["Node.js", "PostgreSQL", "C++"]));
    expect(names).not.toContain("C");
    expect(names).not.toContain("Go");
    expect(detectSkills("Built services in Go").map((x) => x.name)).toContain("Go");
  });
  it("categorises known skills", () => {
    expect(categoryFor("PostgreSQL")).toBe("Database");
    expect(categoryFor("Node.js")).toBe("Backend");
    expect(categoryFor("Unknown tool xyz")).toBe("Other");
  });
});

describe("PDF text extraction", () => {
  it("reads text operators from an uncompressed content stream", async () => {
    const pdf = "%PDF-1.4\n1 0 obj\n<< /Length 45 >>\nstream\nBT /F1 12 Tf 72 712 Td (Hello SkillProof) Tj ET\nendstream\nendobj\n%%EOF";
    const text = await extractPdfText(new TextEncoder().encode(pdf).buffer as ArrayBuffer);
    expect(text).toContain("Hello SkillProof");
  });
  it("decodes escaped and hex strings", () => {
    expect(textFromContent("[(Hel) -50 (lo)] TJ <4849> Tj")).toContain("HelloHI");
  });
  it("rejects non-PDF input", async () => {
    await expect(extractPdfText(new TextEncoder().encode("hello").buffer as ArrayBuffer)).rejects.toThrow();
  });
});

describe("duplicate detection and matching", () => {
  it("flags a skill that already exists regardless of case", () => {
    const [c] = analyzeCandidates([cand("skill", "react", { name: "react", category: "Frontend", proficiency: 40, summary: "" }, { status: "pending" })], sampleData);
    expect(c.duplicateOf).toBe("s-react");
  });
  it("uses token similarity for project names", () => {
    expect(similarity("Campus Marketplace", "Campus Marketplace app")).toBeGreaterThan(0.5);
    expect(normalizeKey("Café  Déjà-vu!")).toBe("cafe deja vu");
  });
  it("coerces untrusted AI responses and drops unknown shapes", () => {
    const r = coerceResume({ name: "Sam", skills: ["Go", 42, null], experience: "nope", links: [{ url: "https://x.dev" }] });
    expect(r.name).toBe("Sam");
    expect(r.skills).toEqual(["Go"]);
    expect(r.experience).toEqual([]);
    expect(r.links[0].url).toBe("https://x.dev");
  });
});

describe("applying approved candidates", () => {
  it("never overwrites a manual edit without explicit confirmation", () => {
    const data = structuredClone(sampleData);
    data.projects = data.projects.map((p) => (p.id === "p-orbit" ? { ...p, name: "My renamed planner" } : p));
    const c = cand("project", "Orbit Planner 3D", { name: "Orbit Planner 3D", summary: "", description: "", kind: "Other", technologies: [], screenshots: [], githubUrl: "", liveUrl: "", status: "", contributions: [], skillNames: [], startedAt: "" }, { entityId: "p-orbit", duplicateOf: "p-orbit" });

    const safe = applyCandidates(data, [c], {});
    expect(safe.skippedManual).toContain("project:p-orbit");
    expect(safe.data.projects.find((p) => p.id === "p-orbit")?.name).toBe("My renamed planner");

    const forced = applyCandidates(data, [c], {}, { overwriteManual: true });
    expect(forced.data.projects.find((p) => p.id === "p-orbit")?.name).toBe("Orbit Planner 3D");
  });

  it("protects existing profile values that differ from the import", () => {
    const c = cand("profile", "profile-name", { field: "name", value: "Alex R." }, { entityId: "imp-profile-name" });
    const result = applyCandidates(sampleData, [c], {});
    expect(result.data.profile.name).toBe("Alex Rivera");
    expect(result.skippedManual).toContain("profile.name");
  });

  it("never marks a certificate as issuer-checked automatically", () => {
    const c = cand("certificate", "New cert", { title: "New cert", issuer: "X", issueDate: "", credentialUrl: "", skillNames: ["Kotlin"], verification: "Issuer-checked", fileName: "", fileType: "", fileData: "", notes: "" });
    const result = applyCandidates(sampleData, [c], {});
    const added = result.data.certificates.find((x) => x.title === "New cert");
    expect(added?.verification).toBe("Unverified");
    expect(result.data.skills.some((s) => s.name === "Kotlin")).toBe(true);
  });

  it("records provenance for every written entity", () => {
    const c = cand("skill", "Kotlin", { name: "Kotlin", category: "Programming", proficiency: 40, summary: "" });
    const result = applyCandidates(sampleData, [c], {}, { now: "2026-01-01T00:00:00.000Z" });
    expect(result.provenance["skill:skill-kotlin"]).toMatchObject({ sourceKind: "resume", sourceRef: "file:test", userEdited: false });
  });

  it("leaves rejected and pending candidates out of the profile", () => {
    const c = cand("achievement", "Hidden award", { title: "Hidden award", date: "", description: "" }, { status: "rejected" });
    const result = applyCandidates(sampleData, [c], {});
    expect(result.data.achievements.some((a) => a.title === "Hidden award")).toBe(false);
  });
});

describe("CSV parsing", () => {
  it("handles quoted commas, escaped quotes and newlines", () => {
    const rows = parseCsv('Name,Notes\n"Smith, Jo","said ""hi""\nthen left"\n');
    expect(rows).toHaveLength(1);
    expect(rows[0].Name).toBe("Smith, Jo");
    expect(rows[0].Notes).toBe('said "hi"\nthen left');
  });
});
