import { readFileAsDataUrl } from "../../utils/helpers";
import { categoryFor, detectSkills } from "../dictionary";
import { makeCandidate, refFor, slugify } from "../candidates";
import { extractPdfText } from "../pdf";
import { ImportError, type Candidate, type SourceRef } from "../types";
import { detectFileKind, LIMITS, sanitizeText } from "../validate";
import type { SourceAdapter } from "./base";

/** Certificates and user documents. Images are stored as-is; PDFs are read for text. */
export const documentAdapter: SourceAdapter = {
  id: "document",
  label: "Documents & certificates",
  handles: ["document-file"],
  async run(input, ctx) {
    if (input.type !== "document-file") throw new ImportError("The document importer received an unsupported source.");
    const file = input.file;
    const kind = detectFileKind(file);
    const source: SourceRef = { kind: "document", label: file.name, ref: refFor(input), method: "file-parse" };
    const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Certificate";

    if (kind === "image") {
      ctx.onProgress("Storing image", 50);
      const fileData = await readFileAsDataUrl(file, LIMITS.certificate);
      const c = makeCandidate({
        kind: "certificate",
        key: title,
        data: { title, issuer: "", issueDate: "", credentialUrl: "", skillNames: [], verification: "Unverified", fileName: file.name, fileType: file.type, fileData, notes: "" },
        source,
        confidence: 0.4,
        basis: "self-reported",
        missing: ["issuer", "issue date", "credential link"],
        warnings: ["Images are stored as they are, and their text is not read. Enter the details yourself, or upload a PDF so SkillProof can read it."],
      });
      return { source, candidates: [c], warnings: [] };
    }

    ctx.onProgress("Extracting text", 35);
    const text = sanitizeText(await extractPdfText(await file.arrayBuffer()), 60000);
    const issuer = text.match(/(?:issued by|issuer|awarded by|presented by)\s*:?\s*([A-Z][\w&.,' -]{2,60})/i)?.[1]?.trim() ?? "";
    const year = text.match(/(?:19|20)\d{2}/)?.[0] ?? "";
    const heading = text.split("\n").map((l) => l.trim()).find((l) => l.length > 6 && l.length < 120) ?? title;
    const skills = detectSkills(text).slice(0, 20).map((s) => s.name);

    ctx.onProgress("Preparing file preview", 70);
    const fileData = await readFileAsDataUrl(file, LIMITS.certificate);
    const warnings: string[] = [];
    if (!text) warnings.push("No text could be read. This may be a scanned PDF.");
    if (year) warnings.push("Only the year was found. Check the exact issue date.");

    const out: Candidate[] = [
      makeCandidate({
        kind: "certificate",
        key: heading,
        data: {
          title: heading,
          issuer,
          issueDate: year ? `${year}-01-01` : "",
          credentialUrl: "",
          skillNames: skills,
          verification: "Unverified",
          fileName: file.name,
          fileType: file.type,
          fileData,
          notes: "",
        },
        source,
        confidence: text ? 0.6 : 0.3,
        basis: "certificate",
        missing: [...(issuer ? [] : ["issuer"]), "credential link"],
        warnings,
      }),
    ];

    for (const name of skills) {
      out.push(
        makeCandidate({
          kind: "skill",
          key: name,
          entityId: `skill-${slugify(name)}`,
          data: { name, category: categoryFor(name), proficiency: 40, summary: `Named in the certificate “${heading}”.` },
          source,
          confidence: 0.55,
          basis: "certificate",
        })
      );
    }
    return { source, candidates: out, warnings };
  },
};
