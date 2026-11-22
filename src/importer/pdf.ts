/**
 * Dependency-free PDF text extraction for text-based PDFs (Word, Google Docs, LaTeX exports).
 * It inflates FlateDecode content streams with the browser's DecompressionStream and reads
 * text-showing operators. Scanned PDFs (images only) yield no text and need OCR, which is out of scope.
 */

const MAX_TEXT = 300_000;

function bytesToLatin1(bytes: Uint8Array): string {
  let out = "";
  const CHUNK = 0x4000;
  for (let i = 0; i < bytes.length; i += CHUNK) out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return out;
}

async function inflate(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === "undefined") return null;
  const attempts: ["deflate" | "deflate-raw", Uint8Array][] = [
    ["deflate", data],
    ["deflate-raw", data.subarray(2)],
  ];
  for (const [format, input] of attempts) {
    try {
      const stream = new Blob([input as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream(format));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      /* try the next framing */
    }
  }
  return null;
}

const ESC: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };

export function decodeLiteral(raw: string): string {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c !== "\\") {
      out += c;
      continue;
    }
    const next = raw[i + 1] ?? "";
    if (/[0-7]/.test(next)) {
      const digits = raw.slice(i + 1).match(/^[0-7]{1,3}/)?.[0] ?? next;
      out += String.fromCharCode(parseInt(digits, 8));
      i += digits.length;
    } else if (next in ESC) {
      out += ESC[next];
      i++;
    } else {
      out += next;
      i++;
    }
  }
  return out;
}

export function decodeHex(hex: string): string {
  const clean = hex.replace(/\s/g, "");
  let out = "";
  for (let i = 0; i < clean.length; i += 2) out += String.fromCharCode(parseInt((clean.slice(i, i + 2) + "0").slice(0, 2), 16));
  return out;
}

// Groups: 1 = TJ array body, 2–3 = Td offsets. Other alternatives are whole tokens.
const TEXT_OPS = /\((?:\\[\s\S]|[^\\()])*\)\s*(?:Tj|')|\[([^\]]*)\]\s*TJ|<[0-9a-fA-F\s]*>\s*Tj|(-?[\d.]+)\s+(-?[\d.]+)\s+T[Dd]|T\*|\bET\b/g;

export function textFromContent(content: string): string {
  let out = "";
  for (const m of content.matchAll(TEXT_OPS)) {
    const token = m[0];
    if (m[1] !== undefined) {
      for (const part of m[1].matchAll(/\(((?:\\[\s\S]|[^\\)])*)\)|<([0-9a-fA-F\s]*)>|(-?\d+(?:\.\d+)?)/g)) {
        if (part[1] !== undefined) out += decodeLiteral(part[1]);
        else if (part[2] !== undefined) out += decodeHex(part[2]);
        else if (part[3] !== undefined && Number(part[3]) < -200) out += " ";
      }
    } else if (token === "T*" || token === "ET") {
      out += "\n";
    } else if (m[3] !== undefined) {
      out += Number(m[3]) !== 0 ? "\n" : " ";
    } else if (token.startsWith("<")) {
      out += decodeHex(token.slice(1, token.indexOf(">")));
    } else if (token.startsWith("(")) {
      out += decodeLiteral(token.slice(1, token.lastIndexOf(")")));
    }
  }
  return out.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const s = bytesToLatin1(bytes);
  if (!s.startsWith("%PDF")) throw new Error("This is not a PDF file.");

  const parts: string[] = [];
  let total = 0;
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index >= 3 && s.slice(m.index - 3, m.index) === "end") continue;
    const start = m.index + m[0].length;
    const end = s.indexOf("endstream", start);
    if (end < 0) break;
    re.lastIndex = end + 9;

    const dict = s.slice(Math.max(0, s.lastIndexOf(" obj", m.index)), m.index);
    let body = bytes.subarray(start, end);
    while (body.length && (body[body.length - 1] === 10 || body[body.length - 1] === 13)) body = body.subarray(0, body.length - 1);

    const data = /FlateDecode/.test(dict) ? await inflate(body) : body;
    if (!data) continue;
    const text = textFromContent(bytesToLatin1(data));
    if (text) {
      parts.push(text);
      total += text.length;
    }
    if (total > MAX_TEXT) break;
  }
  return parts.join("\n").slice(0, MAX_TEXT);
}
