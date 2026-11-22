import type { SourceInput } from "../types";
import type { SourceAdapter } from "./base";
import { documentAdapter } from "./documents";
import { githubAdapter } from "./github";
import { linkedinAdapter } from "./linkedin";
import { resumeAdapter } from "./resume";
import { websiteAdapter } from "./web";

export type { AdapterContext, SourceAdapter } from "./base";

/** Active adapters. Add a new provider here and it becomes available to the pipeline. */
export const ADAPTERS: SourceAdapter[] = [resumeAdapter, githubAdapter, linkedinAdapter, websiteAdapter, documentAdapter];

export function adapterFor(input: SourceInput): SourceAdapter | undefined {
  return ADAPTERS.find((a) => a.handles.includes(input.type));
}

export interface SourceCatalogEntry {
  id: string;
  label: string;
  status: "ready" | "needs-setup";
  description: string;
}

/** Everything the import centre advertises, including integrations that need setup. */
export const SOURCE_CATALOG: SourceCatalogEntry[] = [
  { id: "resume", label: "Resume", status: "ready", description: "PDF, DOCX, TXT or pasted text." },
  { id: "github", label: "GitHub", status: "ready", description: "Public profile, repositories, languages, READMEs and public activity. No sign-in." },
  { id: "linkedin-export", label: "LinkedIn data archive", status: "ready", description: "Official export ZIP or CSVs: profile, positions, education, skills, certifications, projects." },
  { id: "linkedin-api", label: "LinkedIn API (authorised)", status: "needs-setup", description: "Requires a LinkedIn developer app and a server-side OAuth flow. Not enabled in this build." },
  { id: "websites", label: "Portfolio & websites", status: "ready", description: "Personal sites, Behance, Dribbble, YouTube and GitLab pages that allow reading from the browser." },
  { id: "documents", label: "Certificates & documents", status: "ready", description: "Certificate PDFs and images, and documents you provide." },
];

export { documentAdapter, githubAdapter, linkedinAdapter, resumeAdapter, websiteAdapter };
