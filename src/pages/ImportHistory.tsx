import { useMemo, useState } from "react";
import { ArrowRight, History, RotateCcw, Trash2 } from "lucide-react";
import { useStore } from "../hooks/useStore";
import { navigate } from "../hooks/useRoute";
import { useImportLedger } from "../hooks/useImportLedger";
import type { Provenance } from "../importer/types";
import type { AppData } from "../types";
import { Badge, EmptyState, Glass, confirmAction } from "../components/ui";
import { formatDate, cn } from "../utils/helpers";

const PREFIX_LABEL: Record<string, string> = {
  "project:": "Project",
  "certificate:": "Certificate",
  "skill:": "Skill",
  "evidence:": "Evidence",
  "achievement:": "Achievement",
  "education:": "Education",
  "experience:": "Experience",
  "profile.": "Profile",
};

/** Current value of a provenance key, serialised the same way the importer snapshots it. */
function currentSnapshot(key: string, data: AppData): unknown {
  const find = <T extends { id: string }>(list: T[], id: string) => list.find((x) => x.id === id);
  const id = key.slice(key.indexOf(":") + 1);
  if (key.startsWith("project:")) return find(data.projects, id);
  if (key.startsWith("certificate:")) return find(data.certificates, id);
  if (key.startsWith("skill:")) return find(data.skills, id.replace(/^/, ""));
  if (key.startsWith("evidence:")) return find(data.evidence, id);
  if (key.startsWith("achievement:")) return find(data.achievements, id);
  if (key.startsWith("education:")) return find(data.profile.education, id);
  if (key.startsWith("experience:")) return find(data.profile.experience, id);
  if (key.startsWith("profile.")) return (data.profile as unknown as Record<string, unknown>)[key.slice("profile.".length)];
  return undefined;
}

export default function ImportHistory() {
  const store = useStore();
  const { data } = store;
  const { ledger, removeRecord, dropProvenance } = useImportLedger();
  const [query, setQuery] = useState("");

  const records = useMemo(
    () => ledger.records.filter((r) => r.label.toLowerCase().includes(query.trim().toLowerCase())),
    [ledger.records, query]
  );

  const provenanceRows = useMemo(
    () =>
      Object.entries(ledger.provenance).map(([key, p]: [string, Provenance]) => {
        const prefix = Object.keys(PREFIX_LABEL).find((x) => key.startsWith(x)) ?? "";
        const current = currentSnapshot(key, data);
        const changed = current !== undefined && JSON.stringify(current) !== p.snapshot;
        return { key, p, kind: PREFIX_LABEL[prefix] ?? "Item", changed, missing: current === undefined };
      }),
    [ledger.provenance, data]
  );

  const remove = (id: string, withItems: boolean) => {
    const record = ledger.records.find((r) => r.id === id);
    if (!record) return;
    const keys = Object.entries(ledger.provenance)
      .filter(([, p]) => p.sourceRef === record.ref)
      .map(([k]) => k);

    const message = withItems
      ? `Delete “${record.label}” and the ${keys.length} item(s) it added? Items you edited afterwards are removed too. This cannot be undone.`
      : `Remove “${record.label}” from history? The items it added stay in your profile.`;
    if (!confirmAction(message)) return;

    if (withItems) {
      const ids = (prefix: string) => new Set(keys.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)));
      const pr = ids("project:");
      const ce = ids("certificate:");
      const ev = ids("evidence:");
      const ac = ids("achievement:");
      const ed = ids("education:");
      const ex = ids("experience:");
      store.replaceData({
        ...data,
        projects: data.projects.filter((p) => !pr.has(p.id)),
        certificates: data.certificates.filter((c) => !ce.has(c.id)),
        evidence: data.evidence.filter((e) => !ev.has(e.id)),
        achievements: data.achievements.filter((a) => !ac.has(a.id)),
        profile: {
          ...data.profile,
          education: data.profile.education.filter((e) => !ed.has(e.id)),
          experience: data.profile.experience.filter((e) => !ex.has(e.id)),
        },
      });
      dropProvenance(keys);
    }
    removeRecord(id);
  };

  const totals = {
    imports: ledger.records.length,
    approved: ledger.records.reduce((n, r) => n + r.approved, 0),
    rejected: ledger.records.reduce((n, r) => n + r.rejected, 0),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Import history</p>
          <h1 className="font-display mt-3 text-5xl leading-tight md:text-6xl">Where your details came from.</h1>
          <p className="mt-4 text-mute">Every import is recorded with its source, counts and date. Each stored value keeps its provenance, so you can always trace it back.</p>
        </div>
        <button type="button" className="btn btn-primary self-start md:self-auto" onClick={() => navigate("import")}>
          <History size={14} aria-hidden="true" /> New import <ArrowRight size={14} aria-hidden="true" />
        </button>
      </header>

      <dl className="mt-8 grid grid-cols-3 gap-4">
        <Glass className="p-5">
          <dt className="text-xs text-mute">Imports</dt>
          <dd className="font-display text-4xl">{totals.imports}</dd>
        </Glass>
        <Glass className="p-5">
          <dt className="text-xs text-mute">Approved items</dt>
          <dd className="font-display text-4xl">{totals.approved}</dd>
        </Glass>
        <Glass className="p-5">
          <dt className="text-xs text-mute">Rejected items</dt>
          <dd className="font-display text-4xl">{totals.rejected}</dd>
        </Glass>
      </dl>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl">Imports</h2>
        <label className="w-full sm:w-72">
          <span className="sr-only">Filter imports by source name</span>
          <input type="search" className="input" placeholder="Filter by source…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {records.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No imports yet" text="Import from a resume, GitHub, LinkedIn archive, portfolio or certificate to see it recorded here." action={<button type="button" className="btn btn-primary" onClick={() => navigate("import")}>Start an import</button>} />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {records.map((r) => (
            <li key={r.id}>
              <Glass as="article" className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{r.kind}</Badge>
                    <Badge tone={r.status === "completed" ? "success" : "warn"}>{r.status === "completed" ? "Completed" : "Partial"}</Badge>
                    <span className="text-xs text-mute">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="truncate font-semibold">{r.label}</p>
                  <p className="text-xs text-mute">
                    Method: {r.method.replace(/-/g, " ")} · Extracted {r.extracted} · Approved {r.approved} · Rejected {r.rejected}
                  </p>
                  {r.warnings.length > 0 && <p className="text-xs text-mute">{r.warnings.length} warning(s) were shown during review.</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-ghost text-xs" onClick={() => navigate(`import?reimport=${r.id}`)}>
                    <RotateCcw size={13} aria-hidden="true" /> Re-import
                  </button>
                  <button type="button" className="btn btn-ghost text-xs" onClick={() => remove(r.id, false)}>
                    Remove record
                  </button>
                  <button type="button" className="btn btn-danger text-xs" onClick={() => remove(r.id, true)}>
                    <Trash2 size={13} aria-hidden="true" /> Delete with items
                  </button>
                </div>
              </Glass>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="provenance" className="mt-14 space-y-4">
        <h2 id="provenance" className="font-display text-3xl">
          Provenance
        </h2>
        <p className="text-sm text-mute">
          Items written by an import. “Edited since import” means you changed them afterwards, so a re-import will ask before replacing them.
        </p>
        {provenanceRows.length === 0 ? (
          <p className="text-sm text-mute">Nothing has been imported into the profile yet.</p>
        ) : (
          <div className="glass overflow-x-auto rounded-3xl">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-mute">
                <tr>
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Imported</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {provenanceRows.map(({ key, p, kind, changed, missing }) => (
                  <tr key={key} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-3">
                      <span className="text-mute">{kind}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block truncate max-w-[260px]">{p.sourceLabel}</span>
                      <span className="text-[11px] text-mute">{p.method.replace(/-/g, " ")}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-mute">{formatDate(p.importedAt)}</td>
                    <td className="px-5 py-3">
                      <span className={cn("text-xs", changed ? "text-warn" : "text-proof")}>
                        {missing ? "Removed since import" : changed ? "Edited since import" : "Unchanged"}
                      </span>
                      <span className="ml-2 text-[11px] text-mute">{p.verification === "Not applicable" ? "" : p.verification}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
