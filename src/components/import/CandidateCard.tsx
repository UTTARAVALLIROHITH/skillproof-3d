import { AlertTriangle, Check, Pencil, SkipForward, X } from "lucide-react";
import { useState } from "react";
import { cleanData, titleFromData } from "../../importer/candidates";
import { BASIS_LABEL, type Candidate, type CandidateData } from "../../importer/types";
import { cn } from "../../utils/helpers";
import { Badge } from "../ui";

export function CandidateCard({
  c,
  mergeOptions,
  onUpdate,
}: {
  c: Candidate;
  mergeOptions: { id: string; label: string }[];
  onUpdate: (patch: Partial<Candidate>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const keys = Object.keys(c.data).filter((k) => k !== "fileData");

  const startEdit = () => {
    setDraft(Object.fromEntries(keys.map((k) => [k, Array.isArray(c.data[k]) ? (c.data[k] as string[]).join(", ") : String(c.data[k] ?? "")])));
    setEditing(true);
  };

  const save = () => {
    const parsed: CandidateData = Object.fromEntries(
      keys.map((k) => {
        const original = c.data[k];
        const raw = draft[k] ?? "";
        if (Array.isArray(original)) return [k, raw.split(",").map((s) => s.trim()).filter(Boolean)];
        if (typeof original === "number") return [k, Number(raw) || 0];
        return [k, raw];
      })
    );
    const data = cleanData({ ...c.data, ...parsed });
    onUpdate({ data, title: titleFromData(c.kind, data), edited: true });
    setEditing(false);
  };

  const dimmed = c.status === "rejected" || c.status === "skipped";
  const borderTone = c.status === "accepted" ? "border-proof/50" : c.status === "rejected" ? "border-red-400/30" : "border-line";

  return (
    <article className={cn("glass rounded-3xl border p-5 transition-all duration-300", borderTone, dimmed && "opacity-60")} aria-label={`${c.kind}: ${c.title}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="accent">{c.kind}</Badge>
            <Badge>{c.source.label}</Badge>
            <Badge tone={c.basis === "certificate" || c.basis === "documentation" ? "accent" : "neutral"}>{BASIS_LABEL[c.basis]}</Badge>
            <span className="text-[11px] text-mute">{Math.round(c.confidence * 100)}% confidence</span>
          </div>
          <h3 className={cn("truncate text-base font-semibold", c.status === "rejected" && "line-through")}>{c.title || "Untitled"}</h3>
          {c.subtitle && <p className="mt-0.5 text-sm text-mute">{c.subtitle}</p>}
          {c.snippet && <p className="mt-2 border-l border-line pl-3 text-xs italic leading-relaxed text-mute">“{c.snippet}”</p>}
        </div>
      </div>

      {(c.missing.length > 0 || c.warnings.length > 0 || c.conflictWith) && (
        <ul className="mt-4 space-y-1.5">
          {c.missing.map((m) => (
            <li key={m} className="flex items-center gap-2 text-xs text-warn">
              <AlertTriangle size={12} aria-hidden="true" /> Missing: {m}
            </li>
          ))}
          {c.warnings.map((w) => (
            <li key={w} className="text-xs text-mute">
              • {w}
            </li>
          ))}
          {c.conflictWith && (
            <li className="rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
              Your profile currently says “{c.conflictWith}”. Accepting replaces it. Your edits are never overwritten without a separate confirmation.
            </li>
          )}
        </ul>
      )}

      {editing && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2">
          {keys.map((k) => {
            const long = (draft[k] ?? "").length > 90 || k === "description" || k === "details" || k === "summary" || k === "about" || k === "value";
            return (
              <label key={k} className={cn("block text-[11px] text-mute", long && "sm:col-span-2")}>
                {k}
                {long ? (
                  <textarea className="input mt-1 min-h-[72px] text-xs" value={draft[k] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} />
                ) : (
                  <input className="input mt-1 py-2 text-xs" value={draft[k] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} />
                )}
              </label>
            );
          })}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn btn-ghost text-xs" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary text-xs" onClick={save}>
              Save changes
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <button type="button" aria-pressed={c.status === "accepted"} onClick={() => onUpdate({ status: "accepted" })} className={cn("btn text-xs", c.status === "accepted" ? "btn-primary" : "btn-ghost")}>
          <Check size={13} aria-hidden="true" /> Accept
        </button>
        <button type="button" aria-pressed={c.status === "skipped"} onClick={() => onUpdate({ status: "skipped" })} className="btn btn-ghost text-xs">
          <SkipForward size={13} aria-hidden="true" /> Skip
        </button>
        <button type="button" aria-pressed={c.status === "rejected"} onClick={() => onUpdate({ status: "rejected" })} className="btn btn-ghost text-xs">
          <X size={13} aria-hidden="true" /> Reject
        </button>
        {!editing && (
          <button type="button" onClick={startEdit} className="btn btn-ghost text-xs">
            <Pencil size={13} aria-hidden="true" /> Edit
          </button>
        )}
        {mergeOptions.length > 0 && (
          <label className="ml-auto flex items-center gap-2 text-[11px] text-mute">
            Merge into
            <select
              className="input w-auto py-1.5 text-xs"
              value={c.duplicateOf ?? ""}
              onChange={(e) => onUpdate({ duplicateOf: e.target.value || undefined, status: e.target.value ? "accepted" : c.status })}
            >
              <option value="">Create new</option>
              {mergeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </article>
  );
}
