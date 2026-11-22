import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Briefcase, Check, GitBranch, Link2, Star, Upload, Users, AlertTriangle, BookMarked } from "lucide-react";
import { useStore } from "../hooks/useStore";
import { navigate } from "../hooks/useRoute";
import { buildGitHubImport, fetchGitHubRepos, fetchGitHubUser, parseGitHubLogin, sortRepos, type GitHubRepo, type GitHubUser } from "../utils/github";
import { linkedInToPatch, readLinkedInFiles } from "../utils/linkedin";
import { applyImport, describeCounts, summarizePatch } from "../utils/importMerge";
import { isSafeUrl } from "../utils/helpers";
import { Badge, Glass, TextInput } from "../components/ui";
import { SplitWords } from "../components/motion";

type GhState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; user: GitHubUser; repos: GitHubRepo[] };

const STEPS = ["Connect GitHub", "Add LinkedIn", "Review & finish"];

export default function Onboarding() {
  const { data, replaceData, updateProfile } = useStore();
  const [ghInput, setGhInput] = useState("");
  const login = parseGitHubLogin(ghInput);
  const [gh, setGh] = useState<GhState>({ status: "idle" });
  const [picked, setPicked] = useState<number[]>([]);
  const [ghDone, setGhDone] = useState<string[] | null>(null);
  const [liBusy, setLiBusy] = useState(false);
  const [liDone, setLiDone] = useState<string[] | null>(null);
  const [liError, setLiError] = useState("");
  const [liLink, setLiLink] = useState(data.profile.linkedin);
  const [linkSaved, setLinkSaved] = useState(false);

  /* Live GitHub lookup: debounced as the visitor types, cancelled when the input changes. */
  useEffect(() => {
    if (!login) {
      setGh({ status: "idle" });
      setPicked([]);
      return;
    }
    const controller = new AbortController();
    setGh({ status: "loading" });
    const timer = window.setTimeout(async () => {
      try {
        const [user, repos] = await Promise.all([fetchGitHubUser(login, controller.signal), fetchGitHubRepos(login, controller.signal)]);
        const list = sortRepos(repos.filter((r) => !r.fork)).slice(0, 30);
        setPicked(list.slice(0, 12).map((r) => r.id));
        setGh({ status: "ready", user, repos: list });
        setGhDone(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setGh({ status: "error", message: err instanceof Error ? err.message : "Lookup failed." });
      }
    }, 550);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [login]);

  const togglePick = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const importGitHub = () => {
    if (gh.status !== "ready") return;
    const chosen = gh.repos.filter((r) => picked.includes(r.id));
    const patch = buildGitHubImport(gh.user, chosen, data.skills);
    replaceData(applyImport(data, patch));
    setGhDone(describeCounts(summarizePatch(patch)));
  };

  const importLinkedIn = async (files: File[]) => {
    setLiError("");
    setLiBusy(true);
    try {
      const exported = await readLinkedInFiles(files);
      const patch = linkedInToPatch(exported, data.skills);
      const lines = describeCounts(summarizePatch(patch));
      if (lines.length === 0) {
        setLiError("No recognised LinkedIn files were found. Upload the ZIP archive, or the Profile, Positions, Education, Skills, Certifications or Projects CSV files.");
        return;
      }
      replaceData(applyImport(data, patch));
      setLiDone(lines);
    } catch (err) {
      setLiError(err instanceof Error ? err.message : "The LinkedIn file could not be read.");
    } finally {
      setLiBusy(false);
    }
  };

  const saveLinkedInLink = () => {
    if (liLink && !isSafeUrl(liLink)) return;
    updateProfile({ ...data.profile, linkedin: liLink.trim() });
    setLinkSaved(true);
    window.setTimeout(() => setLinkSaved(false), 2000);
  };

  const completed = [ghDone !== null, liDone !== null];
  const currentStep = completed[0] && completed[1] ? 2 : completed[0] ? 1 : 0;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8">
      <header className="max-w-2xl">
        <p className="eyebrow">Onboarding</p>
        <h1 className="font-display mt-3 text-5xl leading-tight md:text-6xl">
          <SplitWords text="Fill your passport from the places you already work." />
        </h1>
        <p className="mt-4 text-mute">
          Paste a GitHub link and watch your repositories appear. Upload your LinkedIn data archive to bring in experience, education, skills and certifications.
          Everything is imported as editable data, and you can change any of it later.
        </p>
      </header>

      <ol className="mt-10 flex flex-wrap gap-3" aria-label="Onboarding progress">
        {STEPS.map((s, i) => {
          const done = i < currentStep || (i === 2 && currentStep === 2 && completed[0] && completed[1]);
          const active = i === currentStep;
          return (
            <li
              key={s}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-colors ${active ? "border-accent text-accent" : done ? "border-proof/50 text-proof" : "border-line text-mute"}`}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check size={13} aria-hidden="true" /> : <span className="font-semibold">{i + 1}</span>}
              {s}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-6">
        {/* ---------------- GitHub ---------------- */}
        <Glass as="section" className="p-6 md:p-8" aria-labelledby="gh-title">
          <div className="flex items-center gap-3">
            <GitBranch size={20} className="text-accent" aria-hidden="true" />
            <h2 id="gh-title" className="font-display text-3xl">
              GitHub
            </h2>
            {ghDone && <Badge tone="success">Imported</Badge>}
          </div>
          <p className="mt-2 text-sm text-mute">Paste your profile link or username. Public repositories, languages and bio are read live from GitHub's public API. No sign-in needed.</p>

          <label htmlFor="gh-input" className="mt-5 block">
            <span className="sr-only">GitHub profile link or username</span>
            <TextInput id="gh-input" value={ghInput} onChange={(e) => setGhInput(e.target.value)} placeholder="https://github.com/your-username" autoComplete="off" spellCheck={false} />
          </label>

          <div className="mt-5" aria-live="polite">
            <AnimatePresence mode="wait">
              {gh.status === "loading" && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-sm text-mute">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
                  Looking up {login}…
                </motion.div>
              )}
              {gh.status === "error" && (
                <motion.p key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-red-300">
                  <AlertTriangle size={15} aria-hidden="true" /> {gh.message}
                </motion.p>
              )}
              {gh.status === "ready" && (
                <motion.div key={gh.user.login} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
                  <div className="flex flex-wrap items-center gap-5 rounded-3xl border border-line p-5">
                    <img src={gh.user.avatar_url} alt="" className="h-16 w-16 rounded-full border border-line" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{gh.user.name ?? gh.user.login}</p>
                      <p className="text-sm text-mute">{gh.user.bio ?? "No bio on GitHub."}</p>
                      <p className="mt-2 flex flex-wrap gap-4 text-xs text-mute">
                        <span className="inline-flex items-center gap-1.5">
                          <BookMarked size={12} aria-hidden="true" /> {gh.user.public_repos} repositories
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users size={12} aria-hidden="true" /> {gh.user.followers} followers
                        </span>
                        {gh.user.location && <span>{gh.user.location}</span>}
                      </p>
                    </div>
                  </div>

                  <fieldset>
                    <legend className="mb-3 flex w-full items-center justify-between text-sm">
                      <span className="font-medium">Repositories to import</span>
                      <span className="text-xs text-mute">{picked.length} selected · top 12 pre-selected</span>
                    </legend>
                    {gh.repos.length === 0 ? (
                      <p className="text-sm text-mute">No public, non-fork repositories were found.</p>
                    ) : (
                      <ul className="scrollbar-none grid max-h-72 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                        {gh.repos.map((r) => (
                          <li key={r.id}>
                            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-3 transition-colors hover:border-accent/50 has-[:checked]:border-accent/60">
                              <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" checked={picked.includes(r.id)} onChange={() => togglePick(r.id)} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{r.name}</span>
                                <span className="block truncate text-xs text-mute">{r.description ?? "No description"}</span>
                                <span className="mt-1 flex gap-3 text-[11px] text-mute">
                                  {r.language && <span>{r.language}</span>}
                                  <span className="inline-flex items-center gap-1">
                                    <Star size={10} aria-hidden="true" /> {r.stargazers_count}
                                  </span>
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </fieldset>

                  <div className="flex flex-wrap items-center gap-4">
                    <button type="button" className="btn btn-primary" disabled={picked.length === 0 && gh.repos.length > 0} onClick={importGitHub}>
                      Import profile & {picked.length} {picked.length === 1 ? "project" : "projects"}
                    </button>
                    {ghDone && (
                      <p role="status" className="text-sm text-proof">
                        Added {ghDone.join(", ") || "nothing new"}. Re-import at any time to refresh.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Glass>

        {/* ---------------- LinkedIn ---------------- */}
        <Glass as="section" className="p-6 md:p-8" aria-labelledby="li-title">
          <div className="flex items-center gap-3">
            <Briefcase size={20} className="text-accent" aria-hidden="true" />
            <h2 id="li-title" className="font-display text-3xl">
              LinkedIn
            </h2>
            {liDone && <Badge tone="success">Imported</Badge>}
          </div>
          <p className="mt-2 text-sm text-mute">
            LinkedIn does not give apps access to profiles, so SkillProof reads your official data archive instead. Parsing happens in your browser; the file is never uploaded.
          </p>

          <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-sm text-mute">
            <li>On LinkedIn, open Settings &amp; Privacy → Data privacy → Get a copy of your data.</li>
            <li>Choose the archive, select Profile, Positions, Education, Skills, Certifications and Projects, then request it.</li>
            <li>When LinkedIn emails the archive, download the ZIP and upload it below.</li>
          </ol>

          <label
            className="mt-5 flex cursor-pointer flex-col items-center gap-3 rounded-3xl border border-dashed border-line p-8 text-center transition-colors hover:border-accent/60 focus-within:ring-2 focus-within:ring-accent"
          >
            <Upload size={22} className="text-accent" aria-hidden="true" />
            <span className="text-sm font-medium">{liBusy ? "Reading your archive…" : "Upload LinkedIn ZIP or CSV files"}</span>
            <span className="text-xs text-mute">Profile.csv, Positions.csv, Education.csv, Skills.csv, Certifications.csv, Projects.csv</span>
            <input
              type="file"
              accept=".zip,.csv,application/zip,text/csv"
              multiple
              className="sr-only"
              disabled={liBusy}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                if (files.length) void importLinkedIn(files);
              }}
            />
          </label>

          <AnimatePresence>
            {liError && (
              <motion.p key="li-err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alert" className="mt-4 text-sm text-red-300">
                {liError}
              </motion.p>
            )}
          </AnimatePresence>
          {liDone && (
            <p role="status" className="mt-4 text-sm text-proof">
              Added {liDone.join(", ")}. Imported certificates are marked “Unverified” until you check them with the issuer.
            </p>
          )}

          <div className="mt-6 border-t border-line pt-6">
            <label htmlFor="li-link" className="text-sm font-medium">
              LinkedIn profile link <span className="font-normal text-mute">(saved as a link only, shown on your passport)</span>
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <TextInput id="li-link" value={liLink} onChange={(e) => setLiLink(e.target.value)} placeholder="https://www.linkedin.com/in/your-name" />
              <button type="button" className="btn btn-ghost shrink-0" onClick={saveLinkedInLink}>
                <Link2 size={14} aria-hidden="true" /> {linkSaved ? "Saved" : "Save link"}
              </button>
            </div>
            {liLink && !isSafeUrl(liLink) && <p className="mt-2 text-xs text-red-300">Enter a link that starts with https://</p>}
          </div>
        </Glass>

        {/* ---------------- Finish ---------------- */}
        <Glass as="section" className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <h2 className="font-display text-3xl">Review in your dashboard</h2>
            <p className="mt-2 max-w-xl text-sm text-mute">
              Imported skills start as self-reported. Link the repositories and certificates you want to stand behind in the Evidence Engine, and check each certificate against its issuer.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => navigate("dashboard")}>
              Open dashboard
            </button>
            <button type="button" className="btn btn-primary" onClick={() => navigate("universe")}>
              See my universe <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Glass>
      </div>
    </div>
  );
}
