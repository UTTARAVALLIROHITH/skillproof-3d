import type { AppData } from "../types";
import { parseGitHubLogin } from "../utils/github";
import { adapterFor, type AdapterContext } from "./adapters";
import { analyzeCandidates, dedupeBatch, refFor } from "./candidates";
import { ImportError, type ExtractionResult, type SourceInput } from "./types";
import { validateFile, validateUrl } from "./validate";

export { refFor };

/** Returns a user-facing problem with the input, or null when it is acceptable. */
export async function validateInput(input: SourceInput): Promise<string | null> {
  switch (input.type) {
    case "resume-file":
      return validateFile(input.file, "resume");
    case "document-file":
      return validateFile(input.file, "certificate");
    case "linkedin-export": {
      if (input.files.length === 0) return "Choose your LinkedIn export ZIP or CSV files.";
      for (const f of input.files) {
        const problem = await validateFile(f, "archive");
        if (problem) return problem;
      }
      return null;
    }
    case "resume-text":
      return input.text.trim().length < 40 ? "Paste at least a few lines of resume text." : null;
    case "github":
      return parseGitHubLogin(input.login) ? null : "Enter a GitHub username or profile link.";
    case "linkedin-url":
    case "web-url": {
      const check = validateUrl(input.url);
      return check.ok ? null : check.error;
    }
  }
}

/**
 * validate → extract (adapter) → normalise → detect duplicates, conflicts and skills.
 * Nothing is written to the profile here; that only happens after the visitor approves.
 */
export async function runImport(input: SourceInput, ctx: AdapterContext, existing: AppData): Promise<ExtractionResult> {
  if (!ctx.consent) throw new ImportError("Confirm the consent box before SkillProof reads this source.");
  ctx.onProgress("Validating input", 5);
  const problem = await validateInput(input);
  if (problem) throw new ImportError(problem);

  const adapter = adapterFor(input);
  if (!adapter) throw new ImportError("No importer is available for this source yet.");

  const result = await adapter.run(input, ctx);
  ctx.onProgress("Matching duplicates and skills", 92);
  const candidates = analyzeCandidates(dedupeBatch(result.candidates), existing);
  ctx.onProgress("Ready for review", 100);
  return { ...result, candidates };
}
