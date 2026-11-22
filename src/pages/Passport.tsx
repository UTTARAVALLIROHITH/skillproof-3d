import { useMemo } from "react";
import { Download, Eye, Mail, Pencil, Globe, GitBranch, Link2 } from "lucide-react";
import { useStore } from "../hooks/useStore";
import { navigate, useRoute } from "../hooks/useRoute";
import { SKILL_CATEGORIES } from "../types";
import { CATEGORY_COLORS } from "../data/palette";
import { getSkillProof } from "../utils/proof";
import { buildPassportHtml } from "../utils/passportHtml";
import { downloadFile, formatDate } from "../utils/helpers";
import { Badge, ExtLink, Glass, ProgressBar, ProofBadge } from "../components/ui";

export default function Passport() {
  const { data } = useStore();
  const route = useRoute();
  const publicView = route.params.get("view") === "public";
  const p = data.profile;

  const stats = useMemo(
    () => ({
      skills: data.skills.length,
      projects: data.projects.length,
      certificates: data.certificates.length,
      verified: data.certificates.filter((c) => c.verification === "Issuer-checked").length,
      achievements: data.achievements.length,
    }),
    [data]
  );

  const exportPassport = () => {
    const slug = (p.name || "passport").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "passport";
    downloadFile(`${slug}-skillproof.html`, buildPassportHtml(data), "text/html");
  };

  const initial = (p.name.trim()[0] ?? "S").toUpperCase();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-8">
      <Glass className="flex flex-wrap items-center justify-between gap-4 p-3 pl-5">
        <div className="flex items-center gap-2 text-sm">
          <Eye size={15} className="text-accent" aria-hidden="true" />
          <span className="text-mute">{publicView ? "Public view · what visitors see" : "Owner view"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="glass flex rounded-full p-1" role="group" aria-label="Passport mode">
            <button
              type="button"
              className="rounded-full px-4 py-1.5 text-xs font-medium"
              aria-pressed={!publicView}
              style={!publicView ? { background: "var(--accent)", color: "var(--accent-ink)" } : undefined}
              onClick={() => navigate("passport")}
            >
              Owner
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-1.5 text-xs font-medium"
              aria-pressed={publicView}
              style={publicView ? { background: "var(--accent)", color: "var(--accent-ink)" } : undefined}
              onClick={() => navigate("passport?view=public")}
            >
              Public
            </button>
          </div>
          <button type="button" className="btn btn-ghost" onClick={exportPassport}>
            <Download size={14} aria-hidden="true" /> Export HTML
          </button>
          {!publicView && (
            <button type="button" className="btn btn-primary" onClick={() => navigate("dashboard")}>
              <Pencil size={14} aria-hidden="true" /> Edit
            </button>
          )}
        </div>
      </Glass>

      <Glass as="section" className="mt-6 flex flex-col gap-8 p-7 md:flex-row md:items-center md:p-12">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-glass">
          {p.avatar ? (
            <img src={p.avatar} alt={`${p.name} avatar`} className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-5xl text-mute" aria-hidden="true">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">SkillProof passport</p>
          <h1 className="font-display mt-2 text-5xl leading-tight md:text-6xl">{p.name || "Your name"}</h1>
          {p.headline && <p className="mt-3 text-lg text-ink/90">{p.headline}</p>}
          {p.location && <p className="mt-1 text-sm text-mute">{p.location}</p>}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {p.email && (
              <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                <Mail size={14} aria-hidden="true" /> {p.email}
              </a>
            )}
            {p.github && (
              <ExtLink href={p.github}>
                <GitBranch size={14} aria-hidden="true" /> GitHub
              </ExtLink>
            )}
            {p.linkedin && (
              <ExtLink href={p.linkedin}>
                <Link2 size={14} aria-hidden="true" /> LinkedIn
              </ExtLink>
            )}
            {p.website && (
              <ExtLink href={p.website}>
                <Globe size={14} aria-hidden="true" /> Website
              </ExtLink>
            )}
          </div>
        </div>
      </Glass>

      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { k: "Skills", v: stats.skills },
          { k: "Projects", v: stats.projects },
          { k: "Certificates", v: stats.certificates },
          { k: "Issuer-checked", v: stats.verified },
        ].map((s) => (
          <Glass key={s.k} className="p-5">
            <dt className="text-xs text-mute">{s.k}</dt>
            <dd className="font-display mt-1 text-4xl">{s.v}</dd>
          </Glass>
        ))}
      </dl>

      {p.about && (
        <Glass as="section" className="mt-6 p-7 md:p-10">
          <h2 className="eyebrow mb-4">About</h2>
          <p className="whitespace-pre-line text-lg leading-relaxed text-ink/90">{p.about}</p>
        </Glass>
      )}

      {(p.languages.length > 0 || p.links.length > 0 || p.phone) && (
        <Glass as="section" className="mt-6 grid gap-8 p-7 md:grid-cols-2 md:p-10">
          {p.languages.length > 0 && (
            <div>
              <h2 className="eyebrow mb-4">Languages</h2>
              <ul className="flex flex-wrap gap-2">
                {p.languages.map((l) => (
                  <li key={l}>
                    <Badge>{l}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(p.links.length > 0 || p.phone) && (
            <div>
              <h2 className="eyebrow mb-4">Links & contact</h2>
              <ul className="space-y-2">
                {p.phone && <li className="text-sm text-mute">{p.phone}</li>}
                {p.links.map((l) => (
                  <li key={l.id}>
                    <ExtLink href={l.url}>{l.label}</ExtLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Glass>
      )}

      {p.experience.length > 0 && (
        <Glass as="section" className="mt-6 p-7 md:p-10">
          <h2 className="eyebrow mb-5">Experience</h2>
          <ul className="space-y-6">
            {p.experience.map((ex) => (
              <li key={ex.id} className="border-l-2 border-accent/50 pl-5">
                <p className="font-semibold">
                  {ex.role}
                  {ex.company && <span className="text-mute"> · {ex.company}</span>}
                </p>
                <p className="text-sm text-mute">{[ex.period, ex.location].filter(Boolean).join(" · ")}</p>
                {ex.details && <p className="mt-1 text-sm text-mute">{ex.details}</p>}
              </li>
            ))}
          </ul>
        </Glass>
      )}

      {p.education.length > 0 && (
        <Glass as="section" className="mt-6 p-7 md:p-10">
          <h2 className="eyebrow mb-5">Education</h2>
          <ul className="space-y-6">
            {p.education.map((ed) => (
              <li key={ed.id} className="border-l-2 border-accent/50 pl-5">
                <p className="font-semibold">{ed.school}</p>
                <p className="text-sm text-mute">
                  {ed.degree} · {ed.period}
                </p>
                {ed.details && <p className="mt-1 text-sm text-mute">{ed.details}</p>}
              </li>
            ))}
          </ul>
        </Glass>
      )}

      <section aria-labelledby="pp-skills" className="mt-6 space-y-4">
        <h2 id="pp-skills" className="eyebrow px-1">
          Skills
        </h2>
        <p className="px-1 text-sm text-mute">Proficiency is self-assessed. The badge on each skill shows how it is proven.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {SKILL_CATEGORIES.map((cat) => {
            const list = data.skills.filter((s) => s.category === cat);
            if (list.length === 0) return null;
            return (
              <Glass key={cat} as="article" className="p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} aria-hidden="true" />
                  {cat}
                </h3>
                <ul className="mt-5 space-y-5">
                  {list.map((s) => (
                    <li key={s.id} className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{s.name}</span>
                        <ProofBadge level={getSkillProof(s, data).level} compact />
                      </div>
                      <ProgressBar value={s.proficiency} label={`${s.learningStatus}`} />
                    </li>
                  ))}
                </ul>
              </Glass>
            );
          })}
        </div>
      </section>

      {data.projects.length > 0 && (
        <section aria-labelledby="pp-projects" className="mt-10 space-y-4">
          <h2 id="pp-projects" className="eyebrow px-1">
            Projects
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.projects.map((pr) => (
              <Glass key={pr.id} as="article" className="flex flex-col gap-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{pr.name}</h3>
                  <Badge>{pr.status}</Badge>
                </div>
                <p className="text-sm leading-relaxed text-mute">{pr.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {pr.technologies.map((t) => (
                    <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-mute">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap gap-4 pt-2">
                  {pr.githubUrl && <ExtLink href={pr.githubUrl}>Repository</ExtLink>}
                  {pr.liveUrl && <ExtLink href={pr.liveUrl}>Live demo</ExtLink>}
                </div>
              </Glass>
            ))}
          </div>
        </section>
      )}

      {data.certificates.length > 0 && (
        <section aria-labelledby="pp-certs" className="mt-10 space-y-4">
          <h2 id="pp-certs" className="eyebrow px-1">
            Certificates
          </h2>
          <p className="px-1 text-sm text-mute">“Issuer-checked” means the owner confirmed the credential on the issuer’s own page.</p>
          <div className="grid gap-4 md:grid-cols-2">
            {data.certificates.map((c) => (
              <Glass key={c.id} as="article" className="flex flex-col gap-3 p-6">
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm text-mute">
                  {c.issuer} · {formatDate(c.issueDate)}
                </p>
                <div>
                  <Badge tone={c.verification === "Issuer-checked" ? "success" : "neutral"}>{c.verification}</Badge>
                </div>
                {c.fileData && c.fileType.startsWith("image/") && (
                  <img src={c.fileData} alt={`${c.title} certificate`} className="max-h-60 w-full rounded-2xl border border-line object-contain" loading="lazy" />
                )}
                <div className="mt-auto pt-1">{c.credentialUrl && <ExtLink href={c.credentialUrl}>View credential</ExtLink>}</div>
              </Glass>
            ))}
          </div>
        </section>
      )}

      {data.achievements.length > 0 && (
        <Glass as="section" className="mt-10 p-7 md:p-10">
          <h2 className="eyebrow mb-5">Achievements</h2>
          <ol className="space-y-6">
            {[...data.achievements]
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((a) => (
                <li key={a.id} className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-6">
                  <span className="text-sm text-mute">{formatDate(a.date)}</span>
                  <div>
                    <p className="font-semibold">{a.title}</p>
                    {a.description && <p className="mt-1 text-sm text-mute">{a.description}</p>}
                  </div>
                </li>
              ))}
          </ol>
        </Glass>
      )}

      <p className="mt-12 text-center text-xs text-mute">
        Generated with SkillProof 3D · {stats.achievements} achievements · {stats.verified} issuer-checked credentials
      </p>
    </div>
  );
}
