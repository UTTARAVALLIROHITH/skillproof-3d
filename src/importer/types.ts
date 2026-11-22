/* Typed contracts for the Universal Profile Importer. */

export type SourceKind = "resume" | "github" | "linkedin" | "website" | "document" | "manual";

export type ExtractionMethod =
  | "file-parse"
  | "text-parse"
  | "public-api"
  | "page-metadata"
  | "export-archive"
  | "ai-proxy"
  | "link-only"
  | "manual";

export type CandidateKind = "profile" | "language" | "link" | "education" | "experience" | "skill" | "project" | "certificate" | "achievement" | "evidence";

export type CandidateStatus = "pending" | "accepted" | "rejected" | "skipped";

/** How a skill is backed. "independently-verified" is only ever set by a manual issuer check. */
export type EvidenceBasis = "self-reported" | "documentation" | "certificate" | "independently-verified";

export const BASIS_LABEL: Record<EvidenceBasis, string> = {
  "self-reported": "User-reported",
  documentation: "Found in project documentation",
  certificate: "Supported by a certificate",
  "independently-verified": "Independently verified credential",
};

export const CANDIDATE_ORDER: CandidateKind[] = ["profile", "language", "link", "education", "experience", "skill", "project", "certificate", "achievement", "evidence"];

export const CANDIDATE_LABEL: Record<CandidateKind, string> = {
  profile: "Profile details",
  language: "Languages",
  link: "Links & contact",
  education: "Education",
  experience: "Experience",
  skill: "Skills",
  project: "Projects",
  certificate: "Certificates",
  achievement: "Achievements",
  evidence: "Evidence",
};

export type CandidateData = Record<string, string | string[] | number>;

export interface SourceRef {
  kind: SourceKind;
  label: string;
  ref: string;
  method: ExtractionMethod;
}

export interface Candidate {
  id: string;
  /** Deterministic id so re-importing the same item updates it instead of duplicating it. */
  entityId: string;
  kind: CandidateKind;
  title: string;
  subtitle: string;
  data: CandidateData;
  source: SourceRef;
  /** 0–1, how sure the extractor is that this text means what we think it means. */
  confidence: number;
  snippet: string;
  basis: EvidenceBasis;
  status: CandidateStatus;
  edited: boolean;
  missing: string[];
  warnings: string[];
  /** id of an existing profile entity this candidate would update */
  duplicateOf?: string;
  /** the value currently stored in the profile, when it differs */
  conflictWith?: string;
}

export interface ExtractionResult {
  source: SourceRef;
  candidates: Candidate[];
  warnings: string[];
}

/** Where a stored value came from. Kept separately from the data itself. */
export interface Provenance {
  sourceKind: SourceKind;
  sourceRef: string;
  sourceLabel: string;
  method: ExtractionMethod;
  importedAt: string;
  updatedAt: string;
  userEdited: boolean;
  verification: string;
  /** JSON of the value as last written by an import; used to detect later manual edits */
  snapshot: string;
}

export interface ImportRecord {
  id: string;
  kind: SourceKind;
  inputType: string;
  label: string;
  ref: string;
  method: ExtractionMethod;
  createdAt: string;
  status: "completed" | "partial";
  extracted: number;
  approved: number;
  rejected: number;
  warnings: string[];
}

export type SourceInput =
  | { type: "resume-file"; file: File }
  | { type: "resume-text"; text: string; label: string }
  | { type: "document-file"; file: File }
  | { type: "github"; login: string }
  | { type: "linkedin-export"; files: File[] }
  | { type: "linkedin-url"; url: string }
  | { type: "web-url"; url: string; projectName?: string };

export interface ResumeData {
  name: string;
  headline: string;
  about: string;
  emails: string[];
  phones: string[];
  links: { label: string; url: string }[];
  education: { school: string; degree: string; period: string; details: string }[];
  experience: { role: string; company: string; period: string; location: string; details: string }[];
  /** Skills from a "Skills" section */
  skills: string[];
  /** Skills mentioned elsewhere in the text */
  mentionedSkills: string[];
  projects: { name: string; description: string; technologies: string[]; urls: string[] }[];
  certificates: { title: string; issuer: string; date: string }[];
  achievements: { title: string; date: string; description: string }[];
  languages: string[];
}

export function emptyResume(): ResumeData {
  return {
    name: "",
    headline: "",
    about: "",
    emails: [],
    phones: [],
    links: [],
    education: [],
    experience: [],
    skills: [],
    mentionedSkills: [],
    projects: [],
    certificates: [],
    achievements: [],
    languages: [],
  };
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportError";
  }
}
