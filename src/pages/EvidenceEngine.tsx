import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "../hooks/useStore";
import { navigate } from "../hooks/useRoute";
import { PROOF_LEVELS, type Evidence, type ProofLevel, type Skill } from "../types";
import { getSkillProof, PROOF_COPY } from "../utils/proof";
import { formatDate, cn } from "../utils/helpers";
import { EvidenceForm } from "../components/forms";
import { Badge, Chip, EmptyState, ExtLink, Glass, Modal, ProofBadge, ProgressBar, confirmAction } from "../components/ui";
import { CATEGORY_COLORS } from "../data/palette";

export default function EvidenceEngine() {
  const { data, upsertEvidence, deleteEvidence } = useStore();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<ProofLevel | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Evidence | "new" | null>(null);

  const rows = useMemo(() => data.skills.map((skill) => ({ skill, proof: getSkillProof(skill, data) })), [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      ({ skill, proof }) =>
        (levelFilter === "All" || proof.level === levelFilter) && (!q || skill.name.toLowerCase().includes(q) || skill.category.toLowerCase().includes(q))
    );
  }, [rows, query, levelFilter]);

  const selectedSkill: Skill | undefined = data.skills.find((s) => s.id === selectedId) ?? filtered[0]?.skill;
  const selectedProof = selectedSkill ? getSkillProof(selectedSkill, data) : null;

  const counts = PROOF_LEVELS.map((level) => ({ level, n: rows.filter((r) => r.proof.level === level).length }));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-8">
      <header className="max-w-3xl">
        <p className="eyebrow">Evidence Engine</p>
        <h1 className="font-display mt-3 text-5xl leading-tight md:text-6xl">Connect every claim to proof.</h1>
        <p className="mt-4 text-mute">
          Each skill has its own evidence trail. Adding evidence raises a skill to “Evidence-backed”. Only a checked certificate reaches “Independently verified”.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {counts.map(({ level, n }) => (
          <Glass key={level} className="p-5">
            <ProofBadge level={level} />
            <p className="font-display mt-4 text-4xl">{n}</p>
            <p className="mt-2 text-xs leading-relaxed text-mute">{PROOF_COPY[level].text}</p>
          </Glass>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <Glass className="flex max-h-[75vh] flex-col gap-4 p-4">
          <label className="relative block">
            <span className="sr-only">Search skills</span>
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search skills…" className="input pl-9" />
          </label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by proof level">
            <Chip active={levelFilter === "All"} onClick={() => setLevelFilter("All")}>
              All
            </Chip>
            {PROOF_LEVELS.map((l) => (
              <Chip key={l} active={levelFilter === l} onClick={() => setLevelFilter(l)}>
                {l}
              </Chip>
            ))}
          </div>
          <ul className="scrollbar-none -mx-1 space-y-1 overflow-y-auto px-1" aria-label="Skills">
            {filtered.length === 0 && <li className="p-3 text-sm text-mute">No skills match these filters.</li>}
            {filtered.map(({ skill, proof }) => {
              const active = selectedSkill?.id === skill.id;
              return (
                <li key={skill.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedId(skill.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                      active ? "bg-accent text-accent-ink" : "hover:bg-glass"
                    )}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[skill.category] }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{skill.name}</span>
                      <span className={cn("block truncate text-xs", active ? "opacity-75" : "text-mute")}>
                        {skill.category} · {proof.evidence.length} evidence
                      </span>
                    </span>
                    <span className="sr-only">{proof.level}</span>
                    <span aria-hidden="true" className={cn("h-2 w-2 shrink-0 rounded-full", proof.level === "Independently verified" ? "bg-proof" : proof.level === "Evidence-backed" ? "bg-accent" : "bg-mute")} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Glass>

        {selectedSkill && selectedProof ? (
          <Glass as="section" className="space-y-7 p-6 md:p-8" aria-labelledby="evidence-skill">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{selectedSkill.category}</p>
                <h2 id="evidence-skill" className="font-display mt-1 text-4xl">
                  {selectedSkill.name}
                </h2>
                <div className="mt-3">
                  <ProofBadge level={selectedProof.level} />
                </div>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">{PROOF_COPY[selectedProof.level].text}</p>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => setEditing("new")} disabled={data.skills.length === 0}>
                <Plus size={15} aria-hidden="true" /> Add evidence
              </button>
            </div>

            <ProgressBar value={selectedSkill.proficiency} label="Self-assessed proficiency" />

            <section aria-label="Evidence items" className="space-y-3">
              <h3 className="eyebrow">Evidence trail</h3>
              {selectedProof.evidence.length === 0 ? (
                <EmptyState
                  title="No evidence yet"
                  text="Link a repository, live demo, document, screenshot or practical work that shows this skill in action."
                  action={
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing("new")}>
                      Add first evidence
                    </button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {selectedProof.evidence.map((ev) => (
                    <li key={ev.id} className="rounded-2xl border border-line p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge tone="accent">{ev.type}</Badge>
                        <span className="text-xs text-mute">Added {formatDate(ev.dateAdded)}</span>
                      </div>
                      <h4 className="mt-3 font-medium">{ev.title}</h4>
                      {ev.description && <p className="mt-1 text-sm leading-relaxed text-mute">{ev.description}</p>}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        {ev.url ? <ExtLink href={ev.url} className="text-xs">Open evidence</ExtLink> : <span className="text-xs text-mute">No external link</span>}
                        <div className="flex gap-1">
                          <button type="button" className="btn-icon" aria-label={`Edit evidence ${ev.title}`} onClick={() => setEditing(ev)}>
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon hover:text-red-400"
                            aria-label={`Delete evidence ${ev.title}`}
                            onClick={() => {
                              if (confirmAction(`Delete the evidence "${ev.title}"? This cannot be undone.`)) deleteEvidence(ev.id);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <section aria-label="Certificates" className="space-y-3">
                <h3 className="eyebrow">Certificates</h3>
                {selectedProof.certificates.length === 0 ? (
                  <p className="text-sm text-mute">None linked. Link one from the vault.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedProof.certificates.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">{c.title}</span>
                        <Badge tone={c.verification === "Issuer-checked" ? "success" : "neutral"}>{c.verification}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" className="btn btn-ghost text-xs" onClick={() => navigate("certificates")}>
                  Open vault
                </button>
              </section>
              <section aria-label="Projects" className="space-y-3">
                <h3 className="eyebrow">Projects</h3>
                {selectedProof.projects.length === 0 ? (
                  <p className="text-sm text-mute">No projects demonstrate this skill yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedProof.projects.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">{p.name}</span>
                        <Badge>{p.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" className="btn btn-ghost text-xs" onClick={() => navigate("projects")}>
                  Open galaxy
                </button>
              </section>
            </div>
          </Glass>
        ) : (
          <EmptyState title="No skill selected" text="Add skills in the Dashboard first, then return here to attach evidence." />
        )}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add evidence" : "Edit evidence"} wide>
        {editing !== null && (
          <EvidenceForm
            key={editing === "new" ? `new-${selectedSkill?.id ?? ""}` : editing.id}
            initial={editing === "new" ? undefined : editing}
            defaultSkillId={selectedSkill?.id}
            onSubmit={(ev) => {
              upsertEvidence(ev);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
