export const SKILL_CATEGORIES = [
  "Programming",
  "Web Development",
  "Cybersecurity",
  "Networking",
  "Database",
  "UI/UX Design",
  "Frontend",
  "Backend",
  "Cloud",
  "Other",
  "Tools & Technologies",
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const LEARNING_STATUSES = ["Exploring", "Learning", "Practicing", "Proficient"] as const;
export type LearningStatus = (typeof LEARNING_STATUSES)[number];

export const EVIDENCE_TYPES = [
  "GitHub Repository",
  "Live Project",
  "Certificate",
  "Screenshot",
  "Demo Video",
  "Documentation",
  "Practical Work",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const PROJECT_STATUSES = ["Idea", "In Progress", "Prototype", "Completed", "Maintained"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_KINDS = [
  "Web App",
  "Mobile App",
  "Data & AI",
  "Security",
  "Networking",
  "Design",
  "Research",
  "Game & 3D",
  "Other",
] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

/** How a certificate has been checked. Only a manual issuer check counts as "Independently verified". */
export const VERIFICATION_LEVELS = ["Unverified", "Credential linked", "Issuer-checked"] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

/** Derived proof level for a skill. Never upgraded automatically. */
export const PROOF_LEVELS = ["Self-reported", "Evidence-backed", "Independently verified"] as const;
export type ProofLevel = (typeof PROOF_LEVELS)[number];

export const THEME_IDS = ["midnight", "graphite", "titanium"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const THEMES: { id: ThemeId; label: string; hint: string }[] = [
  { id: "midnight", label: "Midnight", hint: "Deep blue-black with cool silver accents" },
  { id: "graphite", label: "Graphite", hint: "Neutral charcoal with titanium highlights" },
  { id: "titanium", label: "Titanium", hint: "Warm white daylight with ink-blue accents" },
];

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  /** Self-assessed proficiency, 0–100 */
  proficiency: number;
  learningStatus: LearningStatus;
  summary: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  description: string;
  kind: ProjectKind;
  technologies: string[];
  screenshots: string[];
  githubUrl: string;
  liveUrl: string;
  status: ProjectStatus;
  featured: boolean;
  skillIds: string[];
  contributions: string[];
  color: string;
  startedAt: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl: string;
  skillIds: string[];
  verification: VerificationLevel;
  fileName: string;
  fileType: string;
  /** Data URL of an uploaded image or PDF (size-limited) */
  fileData: string;
  notes: string;
}

export interface Evidence {
  id: string;
  title: string;
  type: EvidenceType;
  skillId: string;
  url: string;
  description: string;
  dateAdded: string;
}

export interface Achievement {
  id: string;
  title: string;
  date: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  period: string;
  details: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  details: string;
}

export interface Profile {
  name: string;
  headline: string;
  about: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  website: string;
  /** Data URL avatar (size-limited) */
  avatar: string;
  education: Education[];
  experience: Experience[];
  languages: string[];
  links: ProfileLink[];
  phone: string;
}

export interface ProfileLink {
  id: string;
  label: string;
  url: string;
}

export interface AppData {
  version: 1;
  profile: Profile;
  skills: Skill[];
  projects: Project[];
  certificates: Certificate[];
  evidence: Evidence[];
  achievements: Achievement[];
  theme: ThemeId;
}
