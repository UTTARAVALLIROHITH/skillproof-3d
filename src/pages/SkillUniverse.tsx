import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { Search, X, Info } from "lucide-react";
import { useStore } from "../hooks/useStore";
import { navigate } from "../hooks/useRoute";
import { useReducedMotion, useWebGL } from "../hooks/useEnvironment";
import { SKILL_CATEGORIES, type Skill, type SkillCategory } from "../types";
import { CATEGORY_COLORS } from "../data/palette";
import { getSkillProof, PROOF_COPY } from "../utils/proof";
import { formatDate } from "../utils/helpers";
import { SkillListFallback, WebGLNotice } from "../components/Fallback2D";
import { Chip, ExtLink, Glass, ProgressBar, ProofBadge, Badge, EmptyState } from "../components/ui";

const SkillUniverseScene = lazy(() => import("../3d/SkillUniverseScene"));

export default function SkillUniverse() {
  const { data } = useStore();
  const webgl = useWebGL();
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SkillCategory | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.skills.filter(
      (s) =>
        (category === "All" || s.category === category) &&
        (!q || s.name.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q))
    );
  }, [data.skills, query, category]);

  const visibleIds = useMemo(() => new Set(visible.map((s) => s.id)), [visible]);
  const selected = data.skills.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Skill Universe</p>
          <h1 className="font-display mt-3 text-5xl leading-tight md:text-6xl">Every skill, placed in orbit.</h1>
          <p className="mt-4 text-mute">
            Node size shows self-assessed proficiency. Select a skill to see the evidence behind it. Drag to orbit, scroll to zoom.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-80">
          <label className="relative block">
            <span className="sr-only">Search skills</span>
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills…"
              className="input pl-10"
            />
          </label>
          <p className="text-xs text-mute" aria-live="polite">
            Showing {visible.length} of {data.skills.length} skills
          </p>
        </div>
      </header>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <Chip active={category === "All"} onClick={() => setCategory("All")}>
          All categories
        </Chip>
        {SKILL_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[c] }} aria-hidden="true" />
            {c}
          </Chip>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="glass-strong relative h-[60vh] min-h-[440px] overflow-hidden rounded-[2rem] lg:h-[72vh]">
          {webgl ? (
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-mute">Loading universe…</div>}>
              <SkillUniverseScene skills={data.skills} visibleIds={visibleIds} selectedId={selectedId} onSelect={setSelectedId} reduced={reduced} />
            </Suspense>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <WebGLNotice />
            </div>
          )}
          <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2 text-[11px] text-mute">
            <span className="glass rounded-full px-3 py-1.5">Drag to orbit</span>
            <span className="glass rounded-full px-3 py-1.5">Scroll to zoom</span>
            <span className="glass rounded-full px-3 py-1.5">Select a node</span>
          </div>
          {selectedId && (
            <button type="button" className="btn btn-ghost absolute right-4 top-4" onClick={() => setSelectedId(null)}>
              <X size={14} aria-hidden="true" /> Clear selection
            </button>
          )}
        </div>

        <aside aria-label="Skill details" className="min-w-0">
          {selected ? (
            <SkillDetail skill={selected} onClose={() => setSelectedId(null)} />
          ) : (
            <Legend counts={SKILL_CATEGORIES.map((c) => ({ c, n: data.skills.filter((s) => s.category === c).length }))} />
          )}
        </aside>
      </div>

      <section aria-labelledby="skill-index" className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Skill index</p>
            <h2 id="skill-index" className="font-display mt-2 text-3xl">
              All skills, keyboard accessible
            </h2>
          </div>
        </div>
        {visible.length === 0 ? (
          <EmptyState
            title="No skills match"
            text="Try a different search or category, or add new skills in the Dashboard."
            action={
              <button type="button" className="btn btn-ghost" onClick={() => { setQuery(""); setCategory("All"); }}>
                Reset filters
              </button>
            }
          />
        ) : (
          <SkillListFallback skills={visible} selectedId={selectedId} onSelect={setSelectedId} />
        )}
      </section>
    </div>
  );
}

function Legend({ counts }: { counts: { c: SkillCategory; n: number }[] }) {
  return (
    <Glass className="space-y-6 p-6">
      <div className="flex items-start gap-3">
        <Info size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-mute">
          Select any skill in the universe, or from the index below, to open its proof panel: proficiency, learning status, supporting evidence,
          repositories and certificates.
        </p>
      </div>
      <ul className="space-y-3">
        {counts.map(({ c, n }) => (
          <li key={c} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[c] }} aria-hidden="true" />
              {c}
            </span>
            <span className="text-mute">{n}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-mute">
        Proficiency is self-assessed. A skill only moves to “Evidence-backed” or “Independently verified” when you link real proof.
      </p>
    </Glass>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="eyebrow">{title}</h3>
      {children}
    </section>
  );
}

function SkillDetail({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const { data } = useStore();
  const proof = getSkillProof(skill, data);
  const copy = PROOF_COPY[proof.level];

  return (
    <Glass as="article" className="max-h-[72vh] space-y-6 overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow" style={{ color: CATEGORY_COLORS[skill.category] }}>
            {skill.category}
          </p>
          <h2 className="font-display mt-1 text-3xl">{skill.name}</h2>
        </div>
        <button type="button" className="btn-icon shrink-0" onClick={onClose} aria-label="Close skill details">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-2">
        <ProofBadge level={proof.level} />
        <p className="text-sm text-mute">{copy.text}</p>
      </div>

      <ProgressBar value={skill.proficiency} label="Self-assessed proficiency" />

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs text-mute">Learning status</dt>
          <dd className="mt-1">{skill.learningStatus}</dd>
        </div>
        <div>
          <dt className="text-xs text-mute">Last updated</dt>
          <dd className="mt-1">{formatDate(skill.updatedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-mute">Evidence items</dt>
          <dd className="mt-1">{proof.evidence.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-mute">Certificates</dt>
          <dd className="mt-1">
            {proof.certificates.length} <span className="text-mute">({proof.verifiedCertificates.length} issuer-checked)</span>
          </dd>
        </div>
      </dl>

      {skill.summary && <p className="text-sm leading-relaxed text-mute">{skill.summary}</p>}

      <Block title="Related projects">
        {proof.projects.length === 0 ? (
          <p className="text-sm text-mute">No projects linked yet.</p>
        ) : (
          <ul className="space-y-2">
            {proof.projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{p.name}</span>
                <Badge>{p.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Repositories">
        {proof.githubUrls.length === 0 ? (
          <p className="text-sm text-mute">No repository linked yet.</p>
        ) : (
          <ul className="space-y-2">
            {proof.githubUrls.map((u) => (
              <li key={u}>
                <ExtLink href={u}>{u.replace(/^https?:\/\//, "")}</ExtLink>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Supporting evidence">
        {proof.evidence.length === 0 ? (
          <p className="text-sm text-mute">No evidence yet. Add some in the Evidence Engine.</p>
        ) : (
          <ul className="space-y-3">
            {proof.evidence.map((ev) => (
              <li key={ev.id} className="rounded-2xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone="accent">{ev.type}</Badge>
                  <span className="text-xs text-mute">{formatDate(ev.dateAdded)}</span>
                </div>
                <p className="mt-2 text-sm font-medium">{ev.title}</p>
                {ev.description && <p className="mt-1 text-xs leading-relaxed text-mute">{ev.description}</p>}
                {ev.url && <ExtLink href={ev.url} className="mt-2 text-xs">Open link</ExtLink>}
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Certificates">
        {proof.certificates.length === 0 ? (
          <p className="text-sm text-mute">No certificates linked.</p>
        ) : (
          <ul className="space-y-3">
            {proof.certificates.map((c) => (
              <li key={c.id} className="rounded-2xl border border-line p-3">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-mute">
                  {c.issuer} · {formatDate(c.issueDate)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={c.verification === "Issuer-checked" ? "success" : "neutral"}>{c.verification}</Badge>
                  {c.credentialUrl && <ExtLink href={c.credentialUrl} className="text-xs">Credential</ExtLink>}
                  {c.fileData && (
                    <a href={c.fileData} download={c.fileName || "certificate"} className="text-xs text-accent underline-offset-4 hover:underline">
                      Download file
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <div className="flex flex-wrap gap-2 pt-2">
        <button type="button" className="btn btn-ghost" onClick={() => navigate("evidence")}>
          Manage evidence
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => navigate("dashboard")}>
          Edit skill
        </button>
      </div>
    </Glass>
  );
}
