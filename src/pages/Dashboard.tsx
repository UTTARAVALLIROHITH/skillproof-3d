import { useState, type ReactNode } from "react";
import { Award, Download, Eye, FileCheck2, FileJson, IdCard, Palette, Pencil, Plus, Sparkles, Trash2, Trophy, Upload, Wrench, FolderGit2, Orbit, RotateCcw, Database, type LucideIcon } from "lucide-react";
import { useStore } from "../hooks/useStore";
import { navigate } from "../hooks/useRoute";
import { THEMES, type Achievement, type AppData, type Certificate, type Evidence, type Project, type Skill, type ThemeId } from "../types";
import { getRenderQuality } from "../utils/capabilities";
import { buildPassportHtml } from "../utils/passportHtml";
import { serializeBackup, parseBackup } from "../utils/storage";
import { downloadFile, formatDate, todayISO } from "../utils/helpers";
import { getSkillProof } from "../utils/proof";
import { AchievementForm, CertificateForm, EvidenceForm, ProfileForm, ProjectForm, SkillForm } from "../components/forms";
import { EmptyState, Glass, Modal, confirmAction } from "../components/ui";

type Tab = "profile" | "skills" | "projects" | "certificates" | "evidence" | "achievements" | "appearance" | "data";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: IdCard },
  { id: "skills", label: "Skills", icon: Orbit },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "evidence", label: "Evidence", icon: FileCheck2 },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Data & backup", icon: Database },
];

interface CollectionProps<T> {
  items: T[];
  label: (item: T) => string;
  meta: (item: T) => ReactNode;
  addLabel: string;
  emptyText: string;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}

function Collection<T extends { id: string }>({ items, label, meta, addLabel, emptyText, onAdd, onEdit, onDelete }: CollectionProps<T>) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mute">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          <Plus size={15} aria-hidden="true" /> {addLabel}
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Nothing here yet" text={emptyText} />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="glass flex items-center gap-4 rounded-2xl p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{label(item)}</p>
                <div className="mt-1 text-xs text-mute">{meta(item)}</div>
              </div>
              <button type="button" className="btn-icon" aria-label={`Edit ${label(item)}`} onClick={() => onEdit(item)}>
                <Pencil size={16} />
              </button>
              <button
                type="button"
                className="btn-icon hover:text-red-400"
                aria-label={`Delete ${label(item)}`}
                onClick={() => {
                  if (confirmAction(`Delete "${label(item)}"? This cannot be undone.`)) onDelete(item);
                }}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Editing<T> = T | "new" | null;

export default function Dashboard() {
  const store = useStore();
  const { data } = store;
  const [tab, setTab] = useState<Tab>("profile");
  const [version, setVersion] = useState(0);
  const [skillEdit, setSkillEdit] = useState<Editing<Skill>>(null);
  const [projectEdit, setProjectEdit] = useState<Editing<Project>>(null);
  const [certEdit, setCertEdit] = useState<Editing<Certificate>>(null);
  const [evidenceEdit, setEvidenceEdit] = useState<Editing<Evidence>>(null);
  const [achievementEdit, setAchievementEdit] = useState<Editing<Achievement>>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const skillName = (id: string) => data.skills.find((s) => s.id === id)?.name ?? "Unknown skill";

  const exportBackup = () => {
    downloadFile(`skillproof-backup-${todayISO()}.json`, serializeBackup(data), "application/json");
    setMessage({ tone: "ok", text: "Backup downloaded. Keep it somewhere safe." });
  };

  const exportPassport = () => {
    downloadFile("skillproof-passport.html", buildPassportHtml(data), "text/html");
    setMessage({ tone: "ok", text: "Standalone passport exported. Open it in any browser." });
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const next: AppData = parseBackup(await file.text());
      if (!confirmAction(`Replace ALL current data with "${file.name}"? Your current data in this browser will be overwritten.`)) return;
      store.replaceData(next);
      setVersion((v) => v + 1);
      setMessage({
        tone: "ok",
        text: `Imported ${next.skills.length} skills, ${next.projects.length} projects, ${next.certificates.length} certificates and ${next.evidence.length} evidence items.`,
      });
    } catch (err) {
      setMessage({ tone: "err", text: err instanceof Error ? err.message : "Import failed." });
    }
  };

  const quality = getRenderQuality();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Dashboard</p>
          <h1 className="font-display mt-3 text-5xl leading-tight md:text-6xl">Edit your universe.</h1>
          <p className="mt-4 text-mute">
            Changes save automatically to this browser’s local storage. No account, no server. Back up regularly from the Data tab.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("passport?view=public")}>
            <Eye size={14} aria-hidden="true" /> Preview public passport
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate("passport")}>
            <IdCard size={14} aria-hidden="true" /> View passport
          </button>
        </div>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[230px_1fr]">
        <nav aria-label="Dashboard sections" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
            {TABS.map((t) => (
              <li key={t.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={
                    "flex w-full items-center gap-2.5 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm transition-colors " +
                    (tab === t.id ? "bg-accent font-medium text-accent-ink" : "text-mute hover:bg-glass hover:text-ink")
                  }
                >
                  <t.icon size={16} aria-hidden="true" />
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <Glass as="section" className="min-h-[60vh] p-6 md:p-9">
          {message && (
            <p
              role="status"
              className={
                "mb-6 rounded-2xl border px-4 py-3 text-sm " +
                (message.tone === "ok" ? "border-proof/40 bg-proof/10 text-proof" : "border-red-400/40 bg-red-500/10 text-red-300")
              }
            >
              {message.text}
            </p>
          )}

          {tab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl">Profile</h2>
                <p className="mt-1 text-sm text-mute">Shown on your passport. Avatars are stored locally, up to 300 KB.</p>
                <button type="button" className="btn btn-ghost mt-4" onClick={() => navigate("onboarding")}>
                  Import from GitHub or LinkedIn
                </button>
              </div>
              <ProfileForm key={version} initial={data.profile} onSubmit={store.updateProfile} />
            </div>
          )}

          {tab === "skills" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl">Skills</h2>
                <p className="mt-1 text-sm text-mute">Self-assessed. Link evidence and certificates in the Evidence Engine to raise a skill’s proof level.</p>
              </div>
              <Collection
                items={data.skills}
                label={(s) => s.name}
                meta={(s) => `${s.category} · ${s.proficiency}% · ${s.learningStatus} · ${getSkillProof(s, data).level}`}
                addLabel="Add skill"
                emptyText="Add the skills you want to map. They appear as nodes in the Skill Universe."
                onAdd={() => setSkillEdit("new")}
                onEdit={(s) => setSkillEdit(s)}
                onDelete={(s) => store.deleteSkill(s.id)}
              />
            </div>
          )}

          {tab === "projects" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl">Projects</h2>
                <p className="mt-1 text-sm text-mute">Each project becomes a planet. Featured projects are highlighted in the galaxy.</p>
              </div>
              <Collection
                items={data.projects}
                label={(p) => p.name}
                meta={(p) => `${p.kind} · ${p.status}${p.featured ? " · Featured" : ""}`}
                addLabel="Add project"
                emptyText="Add a project with its repository, live demo and screenshots."
                onAdd={() => setProjectEdit("new")}
                onEdit={(p) => setProjectEdit(p)}
                onDelete={(p) => store.deleteProject(p.id)}
              />
            </div>
          )}

          {tab === "certificates" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl">Certificates</h2>
                <p className="mt-1 text-sm text-mute">Manage verification status and files in the Certificate Vault for the full experience.</p>
              </div>
              <Collection
                items={data.certificates}
                label={(c) => c.title}
                meta={(c) => `${c.issuer} · ${formatDate(c.issueDate)} · ${c.verification}`}
                addLabel="Add certificate"
                emptyText="Add certificates with credential links or uploaded files."
                onAdd={() => setCertEdit("new")}
                onEdit={(c) => setCertEdit(c)}
                onDelete={(c) => store.deleteCertificate(c.id)}
              />
            </div>
          )}

          {tab === "evidence" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl">Evidence</h2>
                <p className="mt-1 text-sm text-mute">Every item supports exactly one skill. Dates show when you added the proof.</p>
              </div>
              <Collection
                items={data.evidence}
                label={(e) => e.title}
                meta={(e) => `${e.type} · ${skillName(e.skillId)} · ${formatDate(e.dateAdded)}`}
                addLabel="Add evidence"
                emptyText="Add repositories, demos, documents or practical work to prove your skills."
                onAdd={() => setEvidenceEdit("new")}
                onEdit={(e) => setEvidenceEdit(e)}
                onDelete={(e) => store.deleteEvidence(e.id)}
              />
            </div>
          )}

          {tab === "achievements" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl">Achievements</h2>
                <p className="mt-1 text-sm text-mute">Awards, honours, hackathons and recognitions.</p>
              </div>
              <Collection
                items={data.achievements}
                label={(a) => a.title}
                meta={(a) => formatDate(a.date)}
                addLabel="Add achievement"
                emptyText="Add awards, honours or recognitions."
                onAdd={() => setAchievementEdit("new")}
                onEdit={(a) => setAchievementEdit(a)}
                onDelete={(a) => store.deleteAchievement(a.id)}
              />
            </div>
          )}

          {tab === "appearance" && (
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-3xl">Appearance</h2>
                <p className="mt-1 text-sm text-mute">Choose the atmosphere of the whole site. Your choice is saved with your data.</p>
              </div>
              <fieldset className="grid gap-4 md:grid-cols-3">
                <legend className="sr-only">Theme</legend>
                {THEMES.map((t) => {
                  const active = data.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => store.setTheme(t.id as ThemeId)}
                      className={
                        "group rounded-3xl border p-4 text-left transition-all duration-300 " +
                        (active ? "border-accent bg-glass shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_25%,transparent)]" : "border-line hover:-translate-y-0.5")
                      }
                    >
                      <ThemeSwatch id={t.id} />
                      <p className="mt-4 font-semibold">{t.label}</p>
                      <p className="mt-1 text-xs text-mute">{t.hint}</p>
                      {active && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent">
                          <Sparkles size={12} aria-hidden="true" /> Active
                        </p>
                      )}
                    </button>
                  );
                })}
              </fieldset>
              <Glass className="space-y-2 p-5 text-sm text-mute">
                <p>
                  3D rendering is tuned for this device: <strong className="text-ink">{quality.tier}</strong> quality, up to {quality.dpr[1]}× pixel density.
                </p>
                <p>Motion respects your system’s “reduce motion” setting. Turn it off in your OS to see every camera transition.</p>
              </Glass>
            </div>
          )}

          {tab === "data" && (
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-3xl">Data & backup</h2>
                <p className="mt-1 text-sm text-mute">Everything lives in this browser. Export a JSON backup to move it or keep a copy.</p>
              </div>
              {store.saveError && (
                <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-300">
                  {store.saveError}
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <Glass className="flex flex-col gap-4 p-6">
                  <FileJson size={22} className="text-accent" aria-hidden="true" />
                  <h3 className="font-semibold">Export JSON backup</h3>
                  <p className="text-sm text-mute">A complete copy of your profile, skills, projects, certificates, evidence and achievements.</p>
                  <button type="button" className="btn btn-primary mt-auto self-start" onClick={exportBackup}>
                    <Download size={14} aria-hidden="true" /> Download backup
                  </button>
                </Glass>
                <Glass className="flex flex-col gap-4 p-6">
                  <Upload size={22} className="text-accent" aria-hidden="true" />
                  <h3 className="font-semibold">Import JSON backup</h3>
                  <p className="text-sm text-mute">Replaces all current data. You will be asked to confirm first.</p>
                  <label className="btn btn-ghost mt-auto cursor-pointer self-start focus-within:ring-2 focus-within:ring-accent">
                    <Upload size={14} aria-hidden="true" /> Choose file
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        void importBackup(file);
                      }}
                    />
                  </label>
                </Glass>
                <Glass className="flex flex-col gap-4 p-6">
                  <IdCard size={22} className="text-accent" aria-hidden="true" />
                  <h3 className="font-semibold">Export standalone passport</h3>
                  <p className="text-sm text-mute">A single HTML file with your passport. No scripts, no account; share it or host it anywhere.</p>
                  <button type="button" className="btn btn-ghost mt-auto self-start" onClick={exportPassport}>
                    <Download size={14} aria-hidden="true" /> Export HTML
                  </button>
                </Glass>
                <Glass className="flex flex-col gap-4 border-red-400/20 p-6">
                  <Wrench size={22} className="text-red-300" aria-hidden="true" />
                  <h3 className="font-semibold">Reset & clear</h3>
                  <p className="text-sm text-mute">Restore the demonstration content, or remove all skills, projects, certificates, evidence and achievements.</p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        if (!confirmAction("Restore the demonstration content? Your current data will be replaced.")) return;
                        store.resetToDemo();
                        setVersion((v) => v + 1);
                        setMessage({ tone: "ok", text: "Demonstration content restored." });
                      }}
                    >
                      <RotateCcw size={14} aria-hidden="true" /> Restore demo
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        if (!confirmAction("Clear all skills, projects, certificates, evidence and achievements? Your profile and theme are kept. This cannot be undone.")) return;
                        store.clearAll();
                        setVersion((v) => v + 1);
                        setMessage({ tone: "ok", text: "Portfolio items cleared. Your profile is kept." });
                      }}
                    >
                      <Trash2 size={14} aria-hidden="true" /> Clear portfolio
                    </button>
                  </div>
                </Glass>
              </div>
              <p className="text-xs text-mute">
                Local storage holds roughly 5 MB per site. Large screenshots and certificate files use most of it; export a backup before adding many.
              </p>
            </div>
          )}
        </Glass>
      </div>

      <Modal open={skillEdit !== null} onClose={() => setSkillEdit(null)} title={skillEdit === "new" ? "Add skill" : "Edit skill"}>
        {skillEdit !== null && (
          <SkillForm
            key={skillEdit === "new" ? "new" : skillEdit.id}
            initial={skillEdit === "new" ? undefined : skillEdit}
            onSubmit={(s) => {
              store.upsertSkill(s);
              setSkillEdit(null);
            }}
            onCancel={() => setSkillEdit(null)}
          />
        )}
      </Modal>

      <Modal open={projectEdit !== null} onClose={() => setProjectEdit(null)} title={projectEdit === "new" ? "Add project" : "Edit project"} wide>
        {projectEdit !== null && (
          <ProjectForm
            key={projectEdit === "new" ? "new" : projectEdit.id}
            initial={projectEdit === "new" ? undefined : projectEdit}
            onSubmit={(p) => {
              store.upsertProject(p);
              setProjectEdit(null);
            }}
            onCancel={() => setProjectEdit(null)}
          />
        )}
      </Modal>

      <Modal open={certEdit !== null} onClose={() => setCertEdit(null)} title={certEdit === "new" ? "Add certificate" : "Edit certificate"} wide>
        {certEdit !== null && (
          <CertificateForm
            key={certEdit === "new" ? "new" : certEdit.id}
            initial={certEdit === "new" ? undefined : certEdit}
            onSubmit={(c) => {
              store.upsertCertificate(c);
              setCertEdit(null);
            }}
            onCancel={() => setCertEdit(null)}
          />
        )}
      </Modal>

      <Modal open={evidenceEdit !== null} onClose={() => setEvidenceEdit(null)} title={evidenceEdit === "new" ? "Add evidence" : "Edit evidence"} wide>
        {evidenceEdit !== null && (
          <EvidenceForm
            key={evidenceEdit === "new" ? "new" : evidenceEdit.id}
            initial={evidenceEdit === "new" ? undefined : evidenceEdit}
            onSubmit={(ev) => {
              store.upsertEvidence(ev);
              setEvidenceEdit(null);
            }}
            onCancel={() => setEvidenceEdit(null)}
          />
        )}
      </Modal>

      <Modal open={achievementEdit !== null} onClose={() => setAchievementEdit(null)} title={achievementEdit === "new" ? "Add achievement" : "Edit achievement"}>
        {achievementEdit !== null && (
          <AchievementForm
            key={achievementEdit === "new" ? "new" : achievementEdit.id}
            initial={achievementEdit === "new" ? undefined : achievementEdit}
            onSubmit={(a) => {
              store.upsertAchievement(a);
              setAchievementEdit(null);
            }}
            onCancel={() => setAchievementEdit(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function ThemeSwatch({ id }: { id: ThemeId }) {
  const styles: Record<ThemeId, { bg: string; fg: string; accent: string }> = {
    midnight: { bg: "#070a12", fg: "#f2f4f9", accent: "#b7c8ff" },
    graphite: { bg: "#131519", fg: "#eceef2", accent: "#d7dbe3" },
    titanium: { bg: "#f4f1eb", fg: "#17191e", accent: "#2f4fd1" },
  };
  const s = styles[id];
  return (
    <div className="relative h-24 overflow-hidden rounded-2xl border border-line" style={{ background: s.bg }} aria-hidden="true">
      <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: s.accent, boxShadow: `0 0 30px ${s.accent}` }} />
      <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: s.fg, opacity: 0.35, transform: "translate(-50%,-50%) rotateX(70deg)" }} />
      <span className="absolute bottom-3 left-3 h-2 w-16 rounded-full" style={{ background: s.fg, opacity: 0.6 }} />
    </div>
  );
}
