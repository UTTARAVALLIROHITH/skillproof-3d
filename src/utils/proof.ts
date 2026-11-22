import type { AppData, Certificate, Evidence, Project, ProofLevel, Skill, VerificationLevel } from "../types";
import { uniq } from "./helpers";

export interface SkillProof {
  level: ProofLevel;
  evidence: Evidence[];
  certificates: Certificate[];
  verifiedCertificates: Certificate[];
  projects: Project[];
  githubUrls: string[];
}

/**
 * Derives how well a skill is proven. The level is only raised to
 * "Independently verified" when a certificate has been checked against its issuer.
 */
export function getSkillProof(skill: Skill, data: AppData): SkillProof {
  const evidence = data.evidence.filter((e) => e.skillId === skill.id);
  const certificates = data.certificates.filter((c) => c.skillIds.includes(skill.id));
  const verifiedCertificates = certificates.filter((c) => c.verification === "Issuer-checked");
  const projects = data.projects.filter((p) => p.skillIds.includes(skill.id));
  const githubUrls = uniq(
    [...evidence.filter((e) => e.type === "GitHub Repository").map((e) => e.url), ...projects.map((p) => p.githubUrl)].filter(
      Boolean
    )
  );

  let level: ProofLevel = "Self-reported";
  if (verifiedCertificates.length > 0) level = "Independently verified";
  else if (evidence.length > 0 || projects.length > 0) level = "Evidence-backed";

  return { level, evidence, certificates, verifiedCertificates, projects, githubUrls };
}

export const PROOF_COPY: Record<ProofLevel, { tone: string; dot: string; text: string }> = {
  "Self-reported": {
    tone: "border-line text-mute",
    dot: "bg-mute",
    text: "Claimed by the owner. No linked project or certificate yet.",
  },
  "Evidence-backed": {
    tone: "border-accent/40 text-accent",
    dot: "bg-accent",
    text: "Linked to projects or evidence. Not checked against an issuer.",
  },
  "Independently verified": {
    tone: "border-proof/50 text-proof",
    dot: "bg-proof",
    text: "A linked certificate was checked against its issuer's record.",
  },
};

export const VERIFICATION_COPY: Record<VerificationLevel, string> = {
  Unverified: "No credential link or issuer check yet.",
  "Credential linked": "Credential URL or file attached. Not yet checked with the issuer.",
  "Issuer-checked": "You checked this against the issuer's record. SkillProof does not verify automatically.",
};
