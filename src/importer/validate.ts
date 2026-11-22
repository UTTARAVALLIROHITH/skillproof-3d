/* Input validation and sanitisation. Everything entering the importer passes through here. */

export const LIMITS = {
  resume: 8 * 1024 * 1024,
  certificate: 3 * 1024 * 1024,
  archive: 25 * 1024 * 1024,
  text: 1024 * 1024,
};

export type FileKind = "pdf" | "docx" | "text" | "image" | "zip" | "csv";
export type FileRole = "resume" | "certificate" | "archive";

export function detectFileKind(file: Pick<File, "name" | "type">): FileKind | null {
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (n.endsWith(".docx")) return "docx";
  if (n.endsWith(".zip") || file.type === "application/zip") return "zip";
  if (n.endsWith(".csv") || file.type === "text/csv") return "csv";
  if (/\.(txt|md)$/.test(n) || file.type === "text/plain" || file.type === "text/markdown") return "text";
  if (/\.(png|jpe?g|webp)$/.test(n) || /^image\/(png|jpeg|webp)$/.test(file.type)) return "image";
  return null;
}

const SIGNATURES: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]],
  zip: [[0x50, 0x4b, 0x03, 0x04]],
  docx: [[0x50, 0x4b, 0x03, 0x04]],
  image: [
    [0x89, 0x50, 0x4e, 0x47],
    [0xff, 0xd8, 0xff],
    [0x52, 0x49, 0x46, 0x46],
  ],
};

/** Returns an error message, or null when the file is acceptable. */
export async function validateFile(file: File, role: FileRole): Promise<string | null> {
  const kind = detectFileKind(file);
  if (!kind) return "Unsupported file type. Use PDF, DOCX, TXT or MD for resumes; PDF or PNG/JPG/WebP for certificates; ZIP or CSV for LinkedIn exports.";
  const allowed: Record<FileRole, FileKind[]> = {
    resume: ["pdf", "docx", "text"],
    certificate: ["pdf", "image"],
    archive: ["zip", "csv"],
  };
  if (!allowed[role].includes(kind)) return `This source does not accept ${kind.toUpperCase()} files.`;
  if (file.size === 0) return "The file is empty.";
  const limit = role === "archive" ? LIMITS.archive : role === "certificate" ? LIMITS.certificate : kind === "text" || kind === "csv" ? LIMITS.text : LIMITS.resume;
  if (file.size > limit) return `This file is larger than ${Math.round(limit / 1048576)} MB.`;

  const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  if (kind === "text" || kind === "csv") return head.includes(0) ? "This looks like a binary file, not text." : null;

  const sigs = SIGNATURES[kind] ?? SIGNATURES[kind === "zip" ? "zip" : "docx"];
  const matches = sigs.some((sig) => sig.every((byte, i) => head[i] === byte));
  return matches ? null : `The file content does not match its ${kind.toUpperCase()} type. It may be corrupted or renamed.`;
}

const BLOCKED_HOST = /^(localhost$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0$|\[?::1\]?$|.*\.local$)/i;

export type UrlCheck = { ok: true; url: string } | { ok: false; error: string };

export function validateUrl(raw: string): UrlCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Paste a link first." };
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, error: "That isn't a valid link." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "Only http and https links can be imported." };
  if (BLOCKED_HOST.test(url.hostname)) return { ok: false, error: "Local and private network addresses can't be imported." };
  if (url.username || url.password) return { ok: false, error: "Links with embedded credentials are not accepted." };
  return { ok: true, url: url.toString() };
}

export function safeHttpUrl(raw: string): string {
  const r = validateUrl(raw);
  return r.ok ? r.url : "";
}

/** Strips control characters and markup from extracted text. Output is never rendered as HTML. */
export function sanitizeText(input: string, max = 20000): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}
