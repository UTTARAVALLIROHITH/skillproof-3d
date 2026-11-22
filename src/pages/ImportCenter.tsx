import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Briefcase, Check, FileText, GitBranch, Globe, History, Lock, Shield, Sparkles, Eye } from "lucide-react";
import { useStore } from "../hooks/useStore";
import { navigate, useRoute } from "../hooks/useRoute";
import { useImportLedger } from "../hooks/useImportLedger";
import { applyCandidates } from "../importer/apply";
import { emptyCandidateData, makeCandidate, refFor } from "../importer/candidates";
import { runImport } from "../importer/pipeline";
import { SOURCE_CATALOG } from "../importer/adapters";
import { SUPPORTED_PROVIDERS } from "../importer/adapters/web";
import { CANDIDATE_LABEL, CANDIDATE_ORDER, type Candidate, type CandidateKind, type ExtractionResult, type ImportRecord, type SourceInput } from "../importer/types";
import type { AppData } from "../types";
import { CandidateCard } from "../components/import/CandidateCard";
import { Dropzone } from "../components/import/Dropzone";
import { ImportComplete } from "../components/import/ImportComplete";
import { Badge, Glass, ProgressBar, TextInput, Chip, confirmAction } from "../components/ui";
import { SplitWords } from "../components/motion";
import { cn, formatDate, uid } from "../utils/helpers";

type Tab = "resume" | "github" | "linkedin" | "websites" | "documents";

const TABS: { id: Tab; label: string; icon: typeof FileText; hint: string }[] = [
  { id: "resume", label: "Resume", icon: FileText, hint: "PDF, DOCX or text" },
  { id: "github", label: "GitHub", icon: GitBranch, hint: "Profile & repositories" },
  { id: "linkedin", label: "LinkedIn", icon: Briefcase, hint: "Archive & link" },
  { id: "websites", label: "Websites", icon: Globe, hint: "Portfolio & projects" },
  { id: "documents", label: "Certificates", icon: Shield, hint: "PDFs & images" },
];

type Phase =
  | { kind: "idle" }
  | { kind: "running"; stage: string; pct: number }
  | { kind: "review"; input: SourceInput; result: ExtractionResult; candidates: Candidate[] }
  | { kind: "done"; approved: number; rejected: number; extracted: number; label: string; overwritten: number };

export default function ImportCenter() {
  const store = useStore();
  const { data } = store;
  const route = useRoute();
  const { ledger, setConsent, setAi, addRecord, setProvenance } = useImportLedger();

  const [tab, setTab] = useState<Tab>("resume");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [ghLogin, setGhLogin] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [webName, setWebName] = useState("");
  const [liUrl, setLiUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const cancelled = useRef(false);

  const reimportId = route.params.get("reimport");
  const reimport = useMemo(() => ledger.records.find((r) => r.id === reimportId), [ledger.records, reimportId]);

  useEffect(() => {
    if (!reimport) return;
    if (reimport.inputType === "github") {
      setTab("github");
      setGhLogin(reimport.ref.replace(/^github:/, ""));
      setNotice("Re-importing refreshes what SkillProof can read. Anything you changed by hand is kept unless you confirm otherwise.");
    } else if (reimport.inputType === "web-url") {
      setTab("websites");
      setWebUrl(reimport.ref.replace(/^web:/, ""));
    } else if (reimport.inputType === "linkedin-url") {
      setTab("linkedin");
      setLiUrl(reimport.ref.replace(/^linkedin-url:/, ""));
    } else {
      setTab(reimport.kind === "document" ? "documents" : reimport.kind === "linkedin" ? "linkedin" : "resume");
      setNotice(`Upload “${reimport.label}” again. SkillProof will match it against the previous import.`);
    }
  }, [reimport]);

  const busy = phase.kind === "running";

  const run = async (input: SourceInput) => {
    setError("");
    setNotice("");
    cancelled.current = false;
    const prior = ledger.records.find((r) => r.ref === refFor(input));
    if (prior) {
      setNotice(`This source was already imported on ${formatDate(prior.createdAt)}. Matching items will be updated. Anything you edited by hand is protected.`);
    }
    setPhase({ kind: "running", stage: "Starting", pct: 1 });
    try {
      const result = await runImport(
        input,
        {
          consent: ledger.consent,
          aiEndpoint: ledger.consent && ledger.aiEnabled ? ledger.aiEndpoint : undefined,
          onProgress: (stage, pct) => {
            if (!cancelled.current) setPhase({ kind: "running", stage, pct });
          },
        },
        data
      );
      if (cancelled.current) return;
      setPhase({ kind: "review", input, result, candidates: result.candidates });
      setShowPreview(false);
    } catch (err) {
      if (cancelled.current) return;
      setPhase({ kind: "idle" });
      setError(err instanceof Error ? err.message : "Something went wrong while reading this source.");
    }
  };

  const cancel = () => {
    cancelled.current = true;
    setPhase({ kind: "idle" });
    setNotice("Import cancelled. Nothing was changed.");
  };

  /* -------- review state -------- */

  const updateCandidate = (id: string, patch: Partial<Candidate>) =>
    setPhase((p) => (p.kind === "review" ? { ...p, candidates: p.candidates.map((c) => (c.id === id ? { ...c, ...patch } : c)) } : p));

  const setKind = (kind: CandidateKind, accept: boolean) =>
    setPhase((p) =>
      p.kind === "review"
        ? {
            ...p,
            candidates: p.candidates.map((c) => (c.kind === kind && c.status !== "rejected" ? { ...c, status: accept ? "accepted" : "skipped" } : c)),
          }
        : p
    );

  const addManual = (kind: CandidateKind) =>
    setPhase((p) => {
      if (p.kind !== "review") return p;
      const key = uid("manual");
      const item = makeCandidate({
        kind,
        key,
        data: emptyCandidateData(kind),
        source: { kind: "manual", label: "Manual entry", ref: `manual:${key}`, method: "manual" },
        confidence: 1,
        basis: "self-reported",
      });
      return { ...p, candidates: [...p.candidates, { ...item, status: "accepted", edited: true, missing: ["details"] }] };
    });

  const previewData: AppData | null = useMemo(() => {
    if (phase.kind !== "review" || !showPreview) return null;
    return applyCandidates(data, phase.candidates, ledger.provenance).data;
  }, [phase, showPreview, data, ledger.provenance]);

  const commit = () => {
    if (phase.kind !== "review") return;
    const { candidates, result, input } = phase;
    const approved = candidates.filter((c) => c.status === "accepted");
    if (approved.length === 0) return;

    // Dry run first: find values that would replace something the user changed by hand.
    const dry = applyCandidates(data, candidates, ledger.provenance);
    let overwrite = false;
    if (dry.skippedManual.length > 0) {
      overwrite = confirmAction(
        `${dry.skippedManual.length} item(s) were edited by you after an earlier import, or already exist with different values.\n\nOK: replace them with the imported values.\nCancel: keep your versions. Everything else still imports.`
      );
    }

    const res = applyCandidates(data, candidates, ledger.provenance, { overwriteManual: overwrite });
    store.replaceData(res.data);
    setProvenance(res.provenance);

    const rejected = candidates.filter((c) => c.status === "rejected").length;
    const record: ImportRecord = {
      id: uid("import"),
      kind: result.source.kind,
      inputType: input.type,
      label: result.source.label,
      ref: result.source.ref,
      method: result.source.method,
      createdAt: new Date().toISOString(),
      status: approved.length < candidates.length ? "partial" : "completed",
      extracted: candidates.length,
      approved: res.applied,
      rejected,
      warnings: result.warnings,
    };
    addRecord(record);
    setPhase({
      kind: "done",
      approved: res.applied,
      rejected,
      extracted: candidates.length,
      label: result.source.label,
      overwritten: overwrite ? dry.skippedManual.length : 0,
    });
    setCelebrate(true);
  };

  const reviewCounts = phase.kind === "review" ? countBy(phase.candidates) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Universal Profile Importer</p>
          <h1 className="font-display mt-3 text-5xl leading-tight md:text-6xl">
            <SplitWords text="Bring your experience." />
            <br />
            <span className="text-accent">
              <SplitWords text="We'll organise your identity." delay={0.35} />
            </span>
          </h1>
          <p className="mt-4 text-mute">
            Read from your resume, GitHub, LinkedIn archive, portfolio and certificates. Everything is extracted into a review screen first. Nothing is published until you approve it.
          </p>
        </div>
        <button type="button" className="btn btn-ghost self-start md:self-auto" onClick={() => navigate("import/history")}>
          <History size={14} aria-hidden="true" /> Import history
        </button>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <ConsentPanel consent={ledger.consent} onChange={setConsent} />

          {notice && <p role="status" className="glass rounded-2xl px-4 py-3 text-sm text-accent">{notice}</p>}
          {error && (
            <p role="alert" className="rounded-2xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <AnimatePresence mode="wait">
            {phase.kind === "idle" && (
              <motion.section key="sources" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }} className="space-y-6">
                <div role="tablist" aria-label="Import sources" className="scrollbar-none flex gap-2 overflow-x-auto">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={tab === t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "flex shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-3 text-left transition-all duration-300",
                        tab === t.id ? "border-accent/60 bg-glass" : "border-line hover:-translate-y-0.5"
                      )}
                    >
                      <t.icon size={17} className={tab === t.id ? "text-accent" : "text-mute"} aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-medium">{t.label}</span>
                        <span className="block text-[11px] text-mute">{t.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <Glass as="section" className="p-6 md:p-8" aria-label={`${tab} import`}>
                  {tab === "resume" && (
                    <div className="space-y-6">
                      <Dropzone
                        accept=".pdf,.docx,.txt,.md,application/pdf,text/plain"
                        title="Drop your resume here, or choose a file"
                        hint="PDF (text-based), DOCX, TXT or MD. Up to 8 MB. Files are read in your browser and are not uploaded."
                        disabled={!ledger.consent || busy}
                        onFiles={(files) => void run({ type: "resume-file", file: files[0] })}
                      />
                      <div className="space-y-3">
                        <label htmlFor="paste-resume" className="text-sm font-medium">
                          Or paste resume text
                        </label>
                        <textarea id="paste-resume" className="input min-h-[140px] text-sm" value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="Paste the plain text of your resume…" />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={!ledger.consent || busy || pastedText.trim().length < 40}
                            onClick={() => void run({ type: "resume-text", text: pastedText, label: "Pasted resume" })}
                          >
                            Read pasted text <ArrowRight size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === "github" && (
                    <div className="space-y-5">
                      <p className="text-sm leading-relaxed text-mute">
                        Reads only public data: your profile, public repositories, languages, README documentation, topics and recent public push activity. No sign-in and no private repositories.
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <TextInput aria-label="GitHub username or profile link" placeholder="https://github.com/your-username" value={ghLogin} onChange={(e) => setGhLogin(e.target.value)} />
                        <button type="button" className="btn btn-primary shrink-0" disabled={!ledger.consent || busy || !ghLogin.trim()} onClick={() => void run({ type: "github", login: ghLogin })}>
                          Read GitHub <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}

                  {tab === "linkedin" && (
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Official data archive</p>
                        <p className="text-xs leading-relaxed text-mute">
                          On LinkedIn: Settings &amp; Privacy → Data privacy → Get a copy of your data. Choose Profile, Positions, Education, Skills, Certifications and Projects, then upload the ZIP.
                        </p>
                        <Dropzone
                          accept=".zip,.csv,application/zip,text/csv"
                          multiple
                          title="Upload the ZIP or CSV files"
                          hint="Parsed in your browser. The archive is never uploaded."
                          disabled={!ledger.consent || busy}
                          onFiles={(files) => void run({ type: "linkedin-export", files })}
                        />
                      </div>
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Profile link <Badge>Link only</Badge></p>
                          <p className="text-xs leading-relaxed text-mute">LinkedIn blocks apps from reading profile pages, so the link is saved and shown on your passport.</p>
                          <TextInput aria-label="LinkedIn profile link" placeholder="https://www.linkedin.com/in/you" value={liUrl} onChange={(e) => setLiUrl(e.target.value)} />
                          <button type="button" className="btn btn-ghost" disabled={!ledger.consent || busy || !liUrl.trim()} onClick={() => void run({ type: "linkedin-url", url: liUrl })}>
                            Save link
                          </button>
                        </div>
                        <div className="rounded-2xl border border-line p-4">
                          <p className="flex items-center gap-2 text-sm font-medium">
                            <Lock size={14} aria-hidden="true" /> LinkedIn API <Badge tone="warn">Needs setup</Badge>
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-mute">
                            Direct API access needs a LinkedIn developer application and a server-side OAuth flow with your own backend. It is not enabled in this build, so no credentials are requested.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === "websites" && (
                    <div className="space-y-5">
                      <p className="text-sm leading-relaxed text-mute">
                        Import a personal site, a project page or a portfolio. SkillProof reads the page’s title, description, image and visible text. Many sites block reading from other websites, and in that case the link is saved.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                        <TextInput aria-label="Portfolio or project URL" placeholder="https://your-portfolio.dev" value={webUrl} onChange={(e) => setWebUrl(e.target.value)} />
                        <TextInput aria-label="Project name (optional)" placeholder="Project name (optional)" value={webName} onChange={(e) => setWebName(e.target.value)} />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {SUPPORTED_PROVIDERS.map((p) => (
                            <Badge key={p}>{p}</Badge>
                          ))}
                        </div>
                        <button type="button" className="btn btn-primary" disabled={!ledger.consent || busy || !webUrl.trim()} onClick={() => void run({ type: "web-url", url: webUrl, projectName: webName.trim() || undefined })}>
                          Read link <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}

                  {tab === "documents" && (
                    <div className="space-y-5">
                      <p className="text-sm leading-relaxed text-mute">
                        Add a certificate. PDFs are read for the title, issuer, year and the skills they name. Images are stored as they are, and you complete the details yourself. Certificates are never marked as checked automatically.
                      </p>
                      <Dropzone
                        accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                        title="Drop a certificate PDF or image"
                        hint="PDF or PNG/JPG/WebP, up to 3 MB."
                        disabled={!ledger.consent || busy}
                        onFiles={(files) => void run({ type: "document-file", file: files[0] })}
                      />
                    </div>
                  )}
                </Glass>

                <SourceCatalog />
                <AiPanel enabled={ledger.aiEnabled} endpoint={ledger.aiEndpoint} onChange={setAi} />
              </motion.section>
            )}

            {phase.kind === "running" && (
              <motion.section key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Glass className="space-y-6 p-8 text-center">
                  <div className="relative mx-auto h-20 w-20" aria-hidden="true">
                    <span className="orbit-ring absolute inset-0 rounded-full border border-accent/60" />
                    <span className="orbit-ring-2 absolute inset-3 rounded-full border border-titanium/50" />
                    <span className="float-bob absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_20px_var(--accent)]" />
                  </div>
                  <div>
                    <p className="font-display text-3xl">{phase.stage}…</p>
                    <p className="mt-1 text-sm text-mute">Nothing is saved until you review and approve.</p>
                  </div>
                  <div className="mx-auto max-w-md">
                    <ProgressBar value={phase.pct} label="Extraction progress" />
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={cancel}>
                    Cancel
                  </button>
                </Glass>
              </motion.section>
            )}

            {phase.kind === "review" && reviewCounts && (
              <motion.section key="review" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <Glass className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="eyebrow">Review</p>
                    <p className="mt-1 font-display text-2xl">{phase.result.source.label}</p>
                    <p className="text-xs text-mute">
                      {phase.candidates.length} items found · {reviewCounts.accepted} accepted · {reviewCounts.rejected} rejected
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowPreview((v) => !v)}>
                      <Eye size={14} aria-hidden="true" /> {showPreview ? "Hide preview" : "Preview profile"}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => { setPhase({ kind: "idle" }); }}>
                      Discard
                    </button>
                  </div>
                </Glass>

                {phase.result.warnings.length > 0 && (
                  <ul className="space-y-2">
                    {phase.result.warnings.map((w) => (
                      <li key={w} className="glass rounded-2xl px-4 py-3 text-xs leading-relaxed text-mute">
                        {w}
                      </li>
                    ))}
                  </ul>
                )}

                {showPreview && previewData && <ProfilePreview data={previewData} />}

                {CANDIDATE_ORDER.map((kind) => {
                  const list = phase.candidates.filter((c) => c.kind === kind);
                  const adding = (
                    <button type="button" className="btn btn-ghost text-xs" onClick={() => addManual(kind)}>
                      + Add manually
                    </button>
                  );
                  if (list.length === 0) return null;
                  const mergeOptions = existingOptions(kind, data);
                  const allOn = list.every((c) => c.status === "accepted" || c.status === "rejected");
                  return (
                    <section key={kind} aria-labelledby={`sec-${kind}`} className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 id={`sec-${kind}`} className="font-display text-2xl">
                          {CANDIDATE_LABEL[kind]} <span className="text-base text-mute">({list.length})</span>
                        </h2>
                        <div className="flex items-center gap-2">
                          {adding}
                          <Chip active={allOn} onClick={() => setKind(kind, !allOn)} className="text-xs">
                            {allOn ? "Turn section off" : "Import this section"}
                          </Chip>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {list.map((c) => (
                          <CandidateCard key={c.id} c={c} mergeOptions={mergeOptions.filter((o) => o.id !== c.id)} onUpdate={(patch) => updateCandidate(c.id, patch)} />
                        ))}
                      </div>
                    </section>
                  );
                })}

                {phase.candidates.length === 0 && (
                  <Glass className="p-8 text-center text-sm text-mute">Nothing recognisable was found. Try another source, or add items manually.</Glass>
                )}

                <div className="sticky bottom-4 z-20">
                  <Glass strong className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <p className="text-sm text-mute">
                      <span className="font-semibold text-ink">{reviewCounts.accepted}</span> will be imported. Items you edited by hand are protected.
                    </p>
                    <button type="button" className="btn btn-primary" disabled={reviewCounts.accepted === 0} onClick={commit}>
                      <Check size={14} aria-hidden="true" /> Import {reviewCounts.accepted} approved
                    </button>
                  </Glass>
                </div>
              </motion.section>
            )}

            {phase.kind === "done" && (
              <motion.section key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Glass className="space-y-6 p-8">
                  <p className="eyebrow">Import complete</p>
                  <h2 className="font-display text-4xl">{phase.approved} items added to your universe</h2>
                  <dl className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <dt className="text-mute">Found</dt>
                      <dd className="font-display text-3xl">{phase.extracted}</dd>
                    </div>
                    <div>
                      <dt className="text-mute">Rejected</dt>
                      <dd className="font-display text-3xl">{phase.rejected}</dd>
                    </div>
                    <div>
                      <dt className="text-mute">Replaced by your choice</dt>
                      <dd className="font-display text-3xl">{phase.overwritten}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-primary" onClick={() => navigate("universe")}>
                      Skill Universe
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => navigate("projects")}>
                      Project Galaxy
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => navigate("certificates")}>
                      Certificate Vault
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => navigate("passport")}>
                      Passport
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => navigate("import/history")}>
                      History
                    </button>
                  </div>
                  <button type="button" className="text-sm text-accent underline-offset-4 hover:underline" onClick={() => setPhase({ kind: "idle" })}>
                    Import another source
                  </button>
                </Glass>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start" aria-label="Import summary">
          <Glass className="space-y-4 p-5">
            <p className="eyebrow">Your profile now</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Skills" value={data.skills.length} />
              <Stat label="Projects" value={data.projects.length} />
              <Stat label="Certificates" value={data.certificates.length} />
              <Stat label="Experience" value={data.profile.experience.length} />
            </dl>
            <p className="text-xs leading-relaxed text-mute">Skills start as “User-reported” and only gain proof when you link evidence. Certificates are never marked as checked automatically.</p>
          </Glass>
          <Glass className="space-y-3 p-5 text-xs leading-relaxed text-mute">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <Sparkles size={14} aria-hidden="true" /> How proof is labelled
            </p>
            <ul className="space-y-2">
              <li>• User-reported: you or the source states it.</li>
              <li>• Found in project documentation: appears in a README or a linked page.</li>
              <li>• Supported by a certificate: named in a certificate you added.</li>
              <li>• Independently verified: only after you check a credential with its issuer.</li>
            </ul>
          </Glass>
        </aside>
      </div>

      {celebrate && phase.kind === "done" && (
        <ImportComplete
          message={`${phase.approved} added`}
          detail={`From ${phase.label}. Your universe has been updated.`}
          onDone={() => setCelebrate(false)}
        />
      )}
    </div>
  );
}

function countBy(list: Candidate[]) {
  return {
    accepted: list.filter((c) => c.status === "accepted").length,
    rejected: list.filter((c) => c.status === "rejected").length,
  };
}

function existingOptions(kind: CandidateKind, data: AppData): { id: string; label: string }[] {
  switch (kind) {
    case "skill":
      return data.skills.map((s) => ({ id: s.id, label: s.name }));
    case "project":
      return data.projects.map((p) => ({ id: p.id, label: p.name }));
    case "certificate":
      return data.certificates.map((c) => ({ id: c.id, label: c.title }));
    case "experience":
      return data.profile.experience.map((e) => ({ id: e.id, label: `${e.role} · ${e.company}` }));
    case "education":
      return data.profile.education.map((e) => ({ id: e.id, label: e.school }));
    case "achievement":
      return data.achievements.map((a) => ({ id: a.id, label: a.title }));
    case "evidence":
      return data.evidence.map((e) => ({ id: e.id, label: e.title }));
    default:
      return [];
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line p-3">
      <dt className="text-[11px] text-mute">{label}</dt>
      <dd className="font-display text-2xl">{value}</dd>
    </div>
  );
}

function ConsentPanel({ consent, onChange }: { consent: boolean; onChange: (v: boolean) => void }) {
  return (
    <Glass as="section" className={cn("p-5 transition-colors", !consent && "border-warn/40")} aria-labelledby="consent-title">
      <label className="flex cursor-pointer items-start gap-4">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" checked={consent} onChange={(e) => onChange(e.target.checked)} />
        <span className="space-y-1">
          <span id="consent-title" className="block text-sm font-medium">
            I agree that SkillProof may read the files and public links I provide.
          </span>
          <span className="block text-xs leading-relaxed text-mute">
            Reading happens in this browser. Documents are not uploaded to any server. Public GitHub and website requests go directly from your browser to those sites. You can delete imported data at any time.
          </span>
        </span>
      </label>
    </Glass>
  );
}

function SourceCatalog() {
  return (
    <section aria-labelledby="catalog" className="space-y-3">
      <h2 id="catalog" className="eyebrow px-1">
        Sources & integrations
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {SOURCE_CATALOG.map((s) => (
          <li key={s.id} className="glass flex items-start justify-between gap-3 rounded-2xl p-4">
            <div>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-mute">{s.description}</p>
            </div>
            <Badge tone={s.status === "ready" ? "success" : "warn"}>{s.status === "ready" ? "Ready" : "Needs setup"}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AiPanel({ enabled, endpoint, onChange }: { enabled: boolean; endpoint: string; onChange: (enabled: boolean, endpoint: string) => void }) {
  const [local, setLocal] = useState(endpoint);
  const valid = /^https:\/\//.test(local) || /^http:\/\/(localhost|127\.0\.0\.1)/.test(local);
  return (
    <details className="glass rounded-3xl p-5">
      <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">
        <span className="flex items-center gap-2">
          <Sparkles size={14} aria-hidden="true" /> AI extraction (optional)
        </span>
        <Badge tone={enabled ? "accent" : "neutral"}>{enabled ? "On" : "Off: local parser"}</Badge>
      </summary>
      <div className="mt-4 space-y-4 text-xs leading-relaxed text-mute">
        <p>
          The local parser works without any AI. You may point SkillProof at an AI extraction service <strong className="text-ink">you run</strong>. The service keeps its own API key on the server. SkillProof never stores or sends an AI key from the browser.
        </p>
        <p>
          <strong className="text-ink">Disclosure:</strong> when enabled, the extracted text of each resume you import is sent to that endpoint. Turning this on counts as your consent for resumes. Turn it off at any time.
        </p>
        <label className="flex items-center gap-3 text-sm text-ink">
          <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={enabled} disabled={!valid && !enabled} onChange={(e) => onChange(e.target.checked, local)} />
          Send resume text to my AI endpoint
        </label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <TextInput aria-label="AI endpoint URL" placeholder="https://your-server.example/resume-extract" value={local} onChange={(e) => setLocal(e.target.value)} />
          <button type="button" className="btn btn-ghost" disabled={!valid || local === endpoint} onClick={() => onChange(enabled, local)}>
            Save endpoint
          </button>
        </div>
        {local && !valid && <p className="text-red-300">The endpoint must start with https://</p>}
      </div>
    </details>
  );
}

function ProfilePreview({ data }: { data: AppData }) {
  const p = data.profile;
  return (
    <Glass as="section" className="space-y-5 p-6" aria-label="Profile preview">
      <p className="eyebrow">Preview of your profile after import</p>
      <div>
        <p className="font-display text-3xl">{p.name || "No name yet"}</p>
        {p.headline && <p className="text-sm text-mute">{p.headline}</p>}
        <p className="mt-1 text-xs text-mute">{[p.email, p.phone, p.location].filter(Boolean).join(" · ")}</p>
      </div>
      {p.about && <p className="text-sm leading-relaxed text-mute">{p.about}</p>}
      <div className="grid gap-5 md:grid-cols-3">
        <PreviewList title="Experience" items={p.experience.map((e) => `${e.role}${e.company ? ` · ${e.company}` : ""}`)} />
        <PreviewList title="Projects" items={data.projects.map((x) => x.name)} />
        <PreviewList title="Certificates" items={data.certificates.map((x) => x.title)} />
        <PreviewList title="Skills" items={data.skills.map((s) => s.name)} />
        <PreviewList title="Languages" items={p.languages} />
        <PreviewList title="Links" items={p.links.map((l) => l.label)} />
      </div>
      <p className="text-xs text-mute">The preview reflects the items you have currently accepted.</p>
    </Glass>
  );
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-mute">None yet</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.slice(0, 8).map((i) => (
            <li key={i} className="truncate">
              {i}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
