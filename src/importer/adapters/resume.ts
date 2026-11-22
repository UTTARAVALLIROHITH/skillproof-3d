import * as mammoth from "mammoth";
import { createProxyProvider } from "../ai/provider";
import { parseResumeText } from "../resumeParser";
import { extractPdfText } from "../pdf";
import { refFor, resumeToCandidates } from "../candidates";
import { ImportError, type ExtractionMethod, type SourceRef } from "../types";
import { detectFileKind, sanitizeText } from "../validate";
import type { SourceAdapter } from "./base";

export async function readResumeText(file: File): Promise<string> {
  const kind = detectFileKind(file);
  const buffer = await file.arrayBuffer();
  if (kind === "pdf") return extractPdfText(buffer);
  if (kind === "docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }
  return new TextDecoder("utf-8").decode(buffer);
}

export const resumeAdapter: SourceAdapter = {
  id: "resume",
  label: "Resume",
  handles: ["resume-file", "resume-text"],
  async run(input, ctx) {
    if (input.type !== "resume-file" && input.type !== "resume-text") throw new ImportError("The resume importer received an unsupported source.");

    let raw: string;
    let label: string;
    let method: ExtractionMethod;
    if (input.type === "resume-file") {
      ctx.onProgress("Reading your file", 20);
      raw = await readResumeText(input.file);
      label = input.file.name;
      method = "file-parse";
    } else {
      raw = input.text;
      label = input.label || "Pasted resume text";
      method = "text-parse";
    }

    const text = sanitizeText(raw, 200_000);
    const source: SourceRef = { kind: "resume", label, ref: refFor(input), method };
    if (text.length < 40) {
      return { source, candidates: [], warnings: ["Not enough readable text was found. Scanned PDFs need OCR; paste the text instead."] };
    }

    ctx.onProgress("Finding sections", 50);
    let data = parseResumeText(text);
    const warnings: string[] = [];

    if (ctx.consent && ctx.aiEndpoint) {
      ctx.onProgress("Asking your AI provider", 62);
      try {
        data = await createProxyProvider(ctx.aiEndpoint).extractResume(text, ctx.signal);
        source.method = "ai-proxy";
      } catch (err) {
        warnings.push(`The AI provider was unavailable (${err instanceof Error ? err.message : "error"}), so the local parser was used.`);
      }
    }

    if (!data.name) warnings.push("No name was detected. You can add it in review.");
    ctx.onProgress("Building candidates", 80);
    return { source, candidates: resumeToCandidates(data, source), warnings };
  },
};
