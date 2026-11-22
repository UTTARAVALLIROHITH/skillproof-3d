import { lazy, Suspense, useMemo, useState } from "react";
import { Search, Star, ExternalLink as ExtIcon, GitBranch } from "lucide-react";
import { useStore } from "../hooks/useStore";
import { navigate } from "../hooks/useRoute";
import { useReducedMotion, useWebGL } from "../hooks/useEnvironment";
import { PROJECT_STATUSES, type Project, type ProjectStatus } from "../types";
import { formatDate } from "../utils/helpers";
import { getSkillProof } from "../utils/proof";
import { WebGLNotice } from "../components/Fallback2D";
import { Badge, Chip, EmptyState, ExtLink, Glass, Modal, ProofBadge } from "../components/ui";

const ProjectGalaxyScene = lazy(() => import("../3d/ProjectGalaxyScene"));

export default function ProjectGalaxy() {
  const { data } = useStore();
  const webgl = useWebGL();
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "All">("All");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.projects.filter(
      (p) =>
        (status === "All" || p.status === status) &&
        (!featuredOnly || p.featured) &&
        (!q || p.name.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q) || p.technologies.some((t) => t.toLowerCase().includes(q)))
    );
  }, [data.projects, query, status, featuredOnly]);

  const visibleIds = useMemo(() => new Set(visible.map((p) => p.id)), [visible]);
  const selected = data.projects.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Project Galaxy</p>
          <h1 className="font-display mt-3 text-5xl leading-tight md:text-6xl">Everything you've built, in orbit.</h1>
          <p className="mt-4 text-mute">Each planet is a project. Featured projects carry a ring. Select one to open its details.</p>
        </div>
        <label className="relative block w-full md:w-80">
          <span className="sr-only">Search projects</span>
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, summary or tech…" className="input pl-10" />
        </label>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
        <Chip active={status === "All"} onClick={() => setStatus("All")}>
          All statuses
        </Chip>
        {PROJECT_STATUSES.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
            {s}
          </Chip>
        ))}
        <Chip active={featuredOnly} onClick={() => setFeaturedOnly((v) => !v)} className="ml-auto">
          <Star size={13} aria-hidden="true" /> Featured only
        </Chip>
      </div>

      <div className="glass-strong relative mt-6 h-[56vh] min-h-[420px] overflow-hidden rounded-[2rem] lg:h-[66vh]">
        {webgl ? (
          <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-mute">Loading galaxy…</div>}>
            <ProjectGalaxyScene projects={data.projects} visibleIds={visibleIds} selectedId={selectedId} onSelect={setSelectedId} reduced={reduced} />
          </Suspense>
        ) : (
          <div className="h-full overflow-y-auto p-6">
            <WebGLNotice />
          </div>
        )}
        <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2 text-[11px] text-mute">
          <span className="glass rounded-full px-3 py-1.5">Drag to orbit</span>
          <span className="glass rounded-full px-3 py-1.5">Click a planet</span>
        </div>
        <p className="pointer-events-none absolute right-4 top-4 text-xs text-mute" aria-live="polite">
          {visible.length} of {data.projects.length} projects
        </p>
      </div>

      <section aria-labelledby="project-list" className="mt-14">
        <h2 id="project-list" className="font-display mb-6 text-3xl">
          Projects
        </h2>
        {visible.length === 0 ? (
          <EmptyState
            title="No projects match"
            text="Adjust the filters, or add a project in the Dashboard."
            action={
              <button type="button" className="btn btn-ghost" onClick={() => { setQuery(""); setStatus("All"); setFeaturedOnly(false); }}>
                Reset filters
              </button>
            }
          />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className="group h-full w-full text-left focus-visible:outline-accent"
                  aria-label={`Open project ${p.name}`}
                >
                  <Glass className="flex h-full flex-col gap-4 p-6 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="h-10 w-10 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,.2)]" style={{ background: `radial-gradient(circle at 30% 30%, #fff8, ${p.color} 60%)` }} aria-hidden="true" />
                      <div className="flex items-center gap-2">
                        {p.featured && <Badge tone="warn">Featured</Badge>}
                        <Badge>{p.status}</Badge>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{p.name}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-mute">{p.summary}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      {p.technologies.slice(0, 5).map((t) => (
                        <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-mute">
                          {t}
                        </span>
                      ))}
                    </div>
                  </Glass>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected?.name ?? "Project"} wide>
        {selected && <ProjectDetail project={selected} onOpenSkill={() => navigate("universe")} />}
      </Modal>
    </div>
  );
}

function ProjectDetail({ project, onOpenSkill }: { project: Project; onOpenSkill: () => void }) {
  const { data } = useStore();
  const skills = data.skills.filter((s) => project.skillIds.includes(s.id));
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{project.kind}</Badge>
        <Badge>{project.status}</Badge>
        {project.featured && <Badge tone="warn">Featured</Badge>}
        <span className="text-xs text-mute">Started {formatDate(project.startedAt)}</span>
      </div>

      {project.description && <p className="leading-relaxed text-mute">{project.description}</p>}

      {project.screenshots.length > 0 && (
        <div>
          <h3 className="eyebrow mb-3">Screenshots</h3>
          <div className="grid grid-cols-2 gap-3">
            {project.screenshots.map((src, i) => (
              <img key={i} src={src} alt={`${project.name} screenshot ${i + 1}`} className="aspect-video w-full rounded-2xl border border-line object-cover" loading="lazy" />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="eyebrow mb-3">Technologies</h3>
          <div className="flex flex-wrap gap-2">
            {project.technologies.length ? project.technologies.map((t) => <Badge key={t}>{t}</Badge>) : <span className="text-sm text-mute">Not listed</span>}
          </div>
        </div>
        <div>
          <h3 className="eyebrow mb-3">Links</h3>
          <div className="flex flex-col gap-2">
            {project.githubUrl ? (
              <ExtLink href={project.githubUrl}>
                <GitBranch size={14} aria-hidden="true" /> GitHub repository
              </ExtLink>
            ) : (
              <span className="text-sm text-mute">No repository linked</span>
            )}
            {project.liveUrl ? (
              <ExtLink href={project.liveUrl}>
                <ExtIcon size={14} aria-hidden="true" /> Live demo
              </ExtLink>
            ) : (
              <span className="text-sm text-mute">No live demo linked</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="eyebrow mb-3">Evidence & contributions</h3>
        {project.contributions.length ? (
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-mute">
            {project.contributions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mute">No contributions recorded yet.</p>
        )}
      </div>

      <div>
        <h3 className="eyebrow mb-3">Skills demonstrated</h3>
        {skills.length === 0 ? (
          <p className="text-sm text-mute">No skills linked yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {skills.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line p-3">
                <span className="text-sm font-medium">{s.name}</span>
                <ProofBadge level={getSkillProof(s, data).level} compact />
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn-ghost mt-4" onClick={onOpenSkill}>
          Open in Skill Universe
        </button>
      </div>
      <p className="text-xs text-mute">Status is self-declared. Only repositories and demos you link are shown.</p>
    </div>
  );
}
