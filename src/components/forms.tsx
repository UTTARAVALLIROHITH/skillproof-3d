import { useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { useStore } from "../hooks/useStore";
import {
  EVIDENCE_TYPES,
  LEARNING_STATUSES,
  PROJECT_KINDS,
  PROJECT_STATUSES,
  SKILL_CATEGORIES,
  VERIFICATION_LEVELS,
  type Achievement,
  type Certificate,
  type Education,
  type Evidence,
  type Experience,
  type Profile,
  type Project,
  type Skill,
} from "../types";
import { isSafeUrl, readFileAsDataUrl, splitList, todayISO, uid } from "../utils/helpers";
import { VERIFICATION_COPY } from "../utils/proof";
import { Chip, Field, Select, TextArea, TextInput } from "./ui";

const MAX_SCREENSHOT = 450 * 1024;
const MAX_CERTIFICATE = 1.5 * 1024 * 1024;
const MAX_AVATAR = 300 * 1024;

interface FormProps<T> {
  initial?: T;
  onSubmit: (item: T) => void;
  onCancel?: () => void;
}

function makeSetter<T>(setDraft: Dispatch<SetStateAction<T>>) {
  return <K extends keyof T>(key: K, value: T[K]) => setDraft((d) => ({ ...d, [key]: value }) as T);
}

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
      {message}
    </p>
  );
}

function FormActions({ onCancel, label }: { onCancel?: () => void; label: string }) {
  return (
    <div className="flex flex-wrap justify-end gap-3 pt-2">
      {onCancel && (
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      )}
      <button type="submit" className="btn btn-primary">
        {label}
      </button>
    </div>
  );
}

function FileButton({ label, accept, multiple = false, onFiles }: { label: string; accept: string; multiple?: boolean; onFiles: (files: File[]) => void }) {
  return (
    <label className="btn btn-ghost cursor-pointer focus-within:ring-2 focus-within:ring-accent">
      <Upload size={15} aria-hidden="true" />
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}

function SkillPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const { data } = useStore();
  if (data.skills.length === 0) {
    return <p className="text-xs text-mute">Add skills first, then link them here.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Related skills">
      {data.skills.map((s) => (
        <Chip
          key={s.id}
          active={selected.includes(s.id)}
          onClick={() => onChange(selected.includes(s.id) ? selected.filter((x) => x !== s.id) : [...selected, s.id])}
        >
          {s.name}
        </Chip>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Skill */

export function SkillForm({ initial, onSubmit, onCancel }: FormProps<Skill>) {
  const [draft, setDraft] = useState<Skill>(
    () =>
      initial ?? {
        id: uid("skill"),
        name: "",
        category: "Programming",
        proficiency: 50,
        learningStatus: "Learning",
        summary: "",
        updatedAt: todayISO(),
      }
  );
  const [error, setError] = useState("");
  const set = makeSetter(setDraft);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("Skill name is required.");
      return;
    }
    setError("");
    onSubmit({ ...draft, name: draft.name.trim(), proficiency: Math.round(Math.min(100, Math.max(0, draft.proficiency))) });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Skill name" htmlFor="sk-name">
          <TextInput id="sk-name" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. TypeScript" />
        </Field>
        <Field label="Category" htmlFor="sk-cat">
          <Select id="sk-cat" value={draft.category} onChange={(e) => set("category", e.target.value as Skill["category"])}>
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Self-assessed proficiency: ${draft.proficiency}%`} htmlFor="sk-prof" hint="Your own estimate. It is labelled self-reported until evidence is linked.">
          <input
            id="sk-prof"
            type="range"
            min={0}
            max={100}
            value={draft.proficiency}
            onChange={(e) => set("proficiency", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </Field>
        <Field label="Learning status" htmlFor="sk-status">
          <Select id="sk-status" value={draft.learningStatus} onChange={(e) => set("learningStatus", e.target.value as Skill["learningStatus"])}>
            {LEARNING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Summary" htmlFor="sk-sum">
        <TextArea id="sk-sum" value={draft.summary} onChange={(e) => set("summary", e.target.value)} placeholder="What can you do with this skill?" />
      </Field>
      <FormActions onCancel={onCancel} label={initial ? "Save skill" : "Add skill"} />
    </form>
  );
}

/* ------------------------------------------------------------------ Project */

export function ProjectForm({ initial, onSubmit, onCancel }: FormProps<Project>) {
  const [draft, setDraft] = useState<Project>(
    () =>
      initial ?? {
        id: uid("project"),
        name: "",
        summary: "",
        description: "",
        kind: "Web App",
        technologies: [],
        screenshots: [],
        githubUrl: "",
        liveUrl: "",
        status: "In Progress",
        featured: false,
        skillIds: [],
        contributions: [],
        color: "#9fb8ff",
        startedAt: todayISO(),
      }
  );
  const [techText, setTechText] = useState(() => initial?.technologies.join(", ") ?? "");
  const [contribText, setContribText] = useState(() => initial?.contributions.join("\n") ?? "");
  const [error, setError] = useState("");
  const set = makeSetter(setDraft);

  const addScreenshots = async (files: File[]) => {
    try {
      const urls = await Promise.all(files.slice(0, 4).map((f) => readFileAsDataUrl(f, MAX_SCREENSHOT)));
      setDraft((d) => ({ ...d, screenshots: [...d.screenshots, ...urls].slice(0, 6) }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Screenshot upload failed.");
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Project name is required.");
    if (!isSafeUrl(draft.githubUrl) || !isSafeUrl(draft.liveUrl)) return setError("URLs must start with https:// or http://.");
    setError("");
    onSubmit({
      ...draft,
      name: draft.name.trim(),
      technologies: splitList(techText),
      contributions: contribText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project name" htmlFor="pr-name">
          <TextInput id="pr-name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Type" htmlFor="pr-kind">
          <Select id="pr-kind" value={draft.kind} onChange={(e) => set("kind", e.target.value as Project["kind"])}>
            {PROJECT_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="One-line summary" htmlFor="pr-sum">
        <TextInput id="pr-sum" value={draft.summary} onChange={(e) => set("summary", e.target.value)} />
      </Field>
      <Field label="Description" htmlFor="pr-desc">
        <TextArea id="pr-desc" value={draft.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status" htmlFor="pr-status">
          <Select id="pr-status" value={draft.status} onChange={(e) => set("status", e.target.value as Project["status"])}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Started" htmlFor="pr-start">
          <TextInput id="pr-start" type="date" value={draft.startedAt} onChange={(e) => set("startedAt", e.target.value)} />
        </Field>
        <Field label="Planet colour" htmlFor="pr-color">
          <input id="pr-color" type="color" value={draft.color} onChange={(e) => set("color", e.target.value)} className="input h-[42px] p-1" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="GitHub repository URL" htmlFor="pr-gh" error={!isSafeUrl(draft.githubUrl) ? "Invalid URL" : undefined}>
          <TextInput id="pr-gh" value={draft.githubUrl} onChange={(e) => set("githubUrl", e.target.value)} placeholder="https://github.com/you/repo" />
        </Field>
        <Field label="Live demo URL" htmlFor="pr-live" error={!isSafeUrl(draft.liveUrl) ? "Invalid URL" : undefined}>
          <TextInput id="pr-live" value={draft.liveUrl} onChange={(e) => set("liveUrl", e.target.value)} placeholder="https://" />
        </Field>
      </div>
      <Field label="Technologies" htmlFor="pr-tech" hint="Separate with commas.">
        <TextInput id="pr-tech" value={techText} onChange={(e) => setTechText(e.target.value)} placeholder="React, TypeScript, PostgreSQL" />
      </Field>
      <Field label="Your contributions" htmlFor="pr-contrib" hint="One per line. Be specific: this is evidence.">
        <TextArea id="pr-contrib" value={contribText} onChange={(e) => setContribText(e.target.value)} />
      </Field>
      <Field label="Skills demonstrated">
        <SkillPicker selected={draft.skillIds} onChange={(ids) => set("skillIds", ids)} />
      </Field>
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-mute">Screenshots (up to 6, 450 KB each)</p>
        <div className="flex flex-wrap items-center gap-3">
          <FileButton label="Add screenshots" accept="image/*" multiple onFiles={addScreenshots} />
          {draft.screenshots.map((src, i) => (
            <div key={i} className="relative h-16 w-24 overflow-hidden rounded-xl border border-line">
              <img src={src} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label={`Remove screenshot ${i + 1}`}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                onClick={() => set("screenshots", draft.screenshots.filter((_, j) => j !== i))}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={draft.featured} onChange={(e) => set("featured", e.target.checked)} />
        Feature this project in the galaxy
      </label>
      <FormActions onCancel={onCancel} label={initial ? "Save project" : "Add project"} />
    </form>
  );
}

/* ------------------------------------------------------------------ Certificate */

export function CertificateForm({ initial, onSubmit, onCancel }: FormProps<Certificate>) {
  const [draft, setDraft] = useState<Certificate>(
    () =>
      initial ?? {
        id: uid("cert"),
        title: "",
        issuer: "",
        issueDate: todayISO(),
        credentialUrl: "",
        skillIds: [],
        verification: "Unverified",
        fileName: "",
        fileType: "",
        fileData: "",
        notes: "",
      }
  );
  const [error, setError] = useState("");
  const set = makeSetter(setDraft);

  const attach = async (files: File[]) => {
    const file = files[0];
    try {
      const fileData = await readFileAsDataUrl(file, MAX_CERTIFICATE);
      setDraft((d) => ({ ...d, fileData, fileName: file.name, fileType: file.type }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.issuer.trim()) return setError("Title and issuing organisation are required.");
    if (!isSafeUrl(draft.credentialUrl)) return setError("The credential URL must start with https:// or http://.");
    if (draft.verification === "Issuer-checked" && !draft.credentialUrl && !draft.fileData) {
      return setError("To mark a certificate as issuer-checked, add the credential URL you checked.");
    }
    setError("");
    onSubmit({ ...draft, title: draft.title.trim(), issuer: draft.issuer.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Certificate title" htmlFor="ce-title">
        <TextInput id="ce-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Issuing organisation" htmlFor="ce-issuer">
          <TextInput id="ce-issuer" value={draft.issuer} onChange={(e) => set("issuer", e.target.value)} />
        </Field>
        <Field label="Issue date" htmlFor="ce-date">
          <TextInput id="ce-date" type="date" value={draft.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
        </Field>
      </div>
      <Field label="Credential URL" htmlFor="ce-url" error={!isSafeUrl(draft.credentialUrl) ? "Invalid URL" : undefined}>
        <TextInput id="ce-url" value={draft.credentialUrl} onChange={(e) => set("credentialUrl", e.target.value)} placeholder="https://issuer.example/credential/123" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Verification status" htmlFor="ce-ver" hint={VERIFICATION_COPY[draft.verification]}>
          <Select id="ce-ver" value={draft.verification} onChange={(e) => set("verification", e.target.value as Certificate["verification"])}>
            {VERIFICATION_LEVELS.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </Field>
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-mute">Certificate file (image or PDF, 1.5 MB max)</p>
          <div className="flex flex-wrap items-center gap-3">
            <FileButton label={draft.fileData ? "Replace file" : "Upload file"} accept="image/*,application/pdf" onFiles={attach} />
            {draft.fileData && (
              <button type="button" className="btn btn-ghost" onClick={() => setDraft((d) => ({ ...d, fileData: "", fileName: "", fileType: "" }))}>
                <Trash2 size={14} aria-hidden="true" /> Remove
              </button>
            )}
          </div>
          {draft.fileName && <p className="truncate text-xs text-mute">{draft.fileName}</p>}
        </div>
      </div>
      <Field label="Related skills">
        <SkillPicker selected={draft.skillIds} onChange={(ids) => set("skillIds", ids)} />
      </Field>
      <Field label="Notes" htmlFor="ce-notes">
        <TextArea id="ce-notes" value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      <p className="rounded-2xl border border-line p-3 text-xs leading-relaxed text-mute">
        SkillProof does not contact issuers or verify credentials automatically. Choose “Issuer-checked” only after you have confirmed the credential on the issuer’s own page.
      </p>
      <FormActions onCancel={onCancel} label={initial ? "Save certificate" : "Add to vault"} />
    </form>
  );
}

/* ------------------------------------------------------------------ Evidence */

export function EvidenceForm({ initial, onSubmit, onCancel, defaultSkillId }: FormProps<Evidence> & { defaultSkillId?: string }) {
  const { data } = useStore();
  const [draft, setDraft] = useState<Evidence>(
    () =>
      initial ?? {
        id: uid("ev"),
        title: "",
        type: "GitHub Repository",
        skillId: defaultSkillId ?? data.skills[0]?.id ?? "",
        url: "",
        description: "",
        dateAdded: todayISO(),
      }
  );
  const [error, setError] = useState("");
  const set = makeSetter(setDraft);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return setError("Give this evidence a title.");
    if (!draft.skillId) return setError("Choose the skill this evidence supports.");
    if (!isSafeUrl(draft.url)) return setError("The URL must start with https:// or http://.");
    setError("");
    onSubmit({ ...draft, title: draft.title.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={error} />
      {data.skills.length === 0 && <p className="text-sm text-mute">Add a skill first. Evidence always supports a skill.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Evidence title" htmlFor="ev-title">
          <TextInput id="ev-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Evidence type" htmlFor="ev-type">
          <Select id="ev-type" value={draft.type} onChange={(e) => set("type", e.target.value as Evidence["type"])}>
            {EVIDENCE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Related skill" htmlFor="ev-skill">
          <Select id="ev-skill" value={draft.skillId} onChange={(e) => set("skillId", e.target.value)}>
            <option value="">Select a skill…</option>
            {data.skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="External URL" htmlFor="ev-url" error={!isSafeUrl(draft.url) ? "Invalid URL" : undefined}>
          <TextInput id="ev-url" value={draft.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
        </Field>
      </div>
      <Field label="Description" htmlFor="ev-desc">
        <TextArea id="ev-desc" value={draft.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label="Date added" htmlFor="ev-date">
        <TextInput id="ev-date" type="date" value={draft.dateAdded} onChange={(e) => set("dateAdded", e.target.value)} className="sm:max-w-xs" />
      </Field>
      <FormActions onCancel={onCancel} label={initial ? "Save evidence" : "Add evidence"} />
    </form>
  );
}

/* ------------------------------------------------------------------ Achievement */

export function AchievementForm({ initial, onSubmit, onCancel }: FormProps<Achievement>) {
  const [draft, setDraft] = useState<Achievement>(() => initial ?? { id: uid("ach"), title: "", date: todayISO(), description: "" });
  const [error, setError] = useState("");
  const set = makeSetter(setDraft);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return setError("Title is required.");
    setError("");
    onSubmit({ ...draft, title: draft.title.trim() });
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Title" htmlFor="ach-title">
        <TextInput id="ach-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Date" htmlFor="ach-date">
        <TextInput id="ach-date" type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} className="sm:max-w-xs" />
      </Field>
      <Field label="Description" htmlFor="ach-desc">
        <TextArea id="ach-desc" value={draft.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <FormActions onCancel={onCancel} label={initial ? "Save achievement" : "Add achievement"} />
    </form>
  );
}

/* ------------------------------------------------------------------ Profile */

export function ProfileForm({ initial, onSubmit }: { initial: Profile; onSubmit: (p: Profile) => void }) {
  const [draft, setDraft] = useState<Profile>(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [langText, setLangText] = useState(initial.languages.join(", "));
  const setLink = (id: string, key: "label" | "url", value: string) =>
    setDraft((d) => ({ ...d, links: d.links.map((l) => (l.id === id ? { ...l, [key]: value } : l)) }));
  const set = makeSetter(setDraft);

  const setExp = (id: string, key: keyof Experience, value: string) =>
    setDraft((d) => ({ ...d, experience: d.experience.map((x) => (x.id === id ? { ...x, [key]: value } : x)) }));

  const setEdu = (id: string, key: keyof Education, value: string) =>
    setDraft((d) => ({ ...d, education: d.education.map((e) => (e.id === id ? { ...e, [key]: value } : e)) }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Your name is required.");
    if (!isSafeUrl(draft.github) || !isSafeUrl(draft.linkedin) || !isSafeUrl(draft.website)) return setError("Links must start with https:// or http://.");
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email)) return setError("Enter a valid email address.");
    setError("");
    onSubmit({
      ...draft,
      name: draft.name.trim(),
      languages: langText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      links: draft.links.filter((l) => l.url.trim()),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <FormError message={error} />
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-line bg-glass">
          {draft.avatar ? (
            <img src={draft.avatar} alt="Profile avatar preview" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-2xl text-mute">{draft.name.trim()[0] ?? "?"}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <FileButton
            label="Upload avatar"
            accept="image/*"
            onFiles={async (files) => {
              try {
                const avatar = await readFileAsDataUrl(files[0], MAX_AVATAR);
                setDraft((d) => ({ ...d, avatar }));
                setError("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed.");
              }
            }}
          />
          {draft.avatar && (
            <button type="button" className="btn btn-ghost" onClick={() => set("avatar", "")}>
              Remove
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="pf-name">
          <TextInput id="pf-name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Location" htmlFor="pf-loc">
          <TextInput id="pf-loc" value={draft.location} onChange={(e) => set("location", e.target.value)} />
        </Field>
      </div>
      <Field label="Headline" htmlFor="pf-head">
        <TextInput id="pf-head" value={draft.headline} onChange={(e) => set("headline", e.target.value)} />
      </Field>
      <Field label="About me" htmlFor="pf-about">
        <TextArea id="pf-about" value={draft.about} onChange={(e) => set("about", e.target.value)} className="min-h-[130px]" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="pf-mail">
          <TextInput id="pf-mail" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="GitHub profile URL" htmlFor="pf-gh">
          <TextInput id="pf-gh" value={draft.github} onChange={(e) => set("github", e.target.value)} placeholder="https://github.com/you" />
        </Field>
        <Field label="LinkedIn URL" htmlFor="pf-li">
          <TextInput id="pf-li" value={draft.linkedin} onChange={(e) => set("linkedin", e.target.value)} />
        </Field>
        <Field label="Website" htmlFor="pf-web">
          <TextInput id="pf-web" value={draft.website} onChange={(e) => set("website", e.target.value)} />
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Education</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                education: [...d.education, { id: uid("edu"), school: "", degree: "", period: "", details: "" }],
              }))
            }
          >
            <Plus size={14} aria-hidden="true" /> Add
          </button>
        </div>
        {draft.education.map((ed) => (
          <div key={ed.id} className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2">
            <TextInput aria-label="School" placeholder="School" value={ed.school} onChange={(e) => setEdu(ed.id, "school", e.target.value)} />
            <TextInput aria-label="Degree" placeholder="Degree" value={ed.degree} onChange={(e) => setEdu(ed.id, "degree", e.target.value)} />
            <TextInput aria-label="Period" placeholder="2023 – 2026" value={ed.period} onChange={(e) => setEdu(ed.id, "period", e.target.value)} />
            <div className="flex gap-2">
              <TextInput aria-label="Details" placeholder="Details" value={ed.details} onChange={(e) => setEdu(ed.id, "details", e.target.value)} />
              <button
                type="button"
                className="btn-icon shrink-0"
                aria-label="Remove education entry"
                onClick={() => setDraft((d) => ({ ...d, education: d.education.filter((x) => x.id !== ed.id) }))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" htmlFor="pf-phone">
          <TextInput id="pf-phone" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Languages" htmlFor="pf-langs" hint="Separate with commas.">
          <TextInput id="pf-langs" value={langText} onChange={(e) => setLangText(e.target.value)} placeholder="English, Portuguese" />
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Links</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setDraft((d) => ({ ...d, links: [...d.links, { id: uid("link"), label: "Website", url: "" }] }))}
          >
            <Plus size={14} aria-hidden="true" /> Add link
          </button>
        </div>
        {draft.links.map((l) => (
          <div key={l.id} className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
            <TextInput aria-label="Link label" value={l.label} onChange={(e) => setLink(l.id, "label", e.target.value)} />
            <TextInput aria-label="Link URL" placeholder="https://" value={l.url} onChange={(e) => setLink(l.id, "url", e.target.value)} />
            <button
              type="button"
              className="btn-icon"
              aria-label="Remove link"
              onClick={() => setDraft((d) => ({ ...d, links: d.links.filter((x) => x.id !== l.id) }))}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Experience</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                experience: [...d.experience, { id: uid("exp"), role: "", company: "", period: "", location: "", details: "" }],
              }))
            }
          >
            <Plus size={14} aria-hidden="true" /> Add
          </button>
        </div>
        {draft.experience.map((ex) => (
          <div key={ex.id} className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2">
            <TextInput aria-label="Role" placeholder="Role" value={ex.role} onChange={(e) => setExp(ex.id, "role", e.target.value)} />
            <TextInput aria-label="Company" placeholder="Company" value={ex.company} onChange={(e) => setExp(ex.id, "company", e.target.value)} />
            <TextInput aria-label="Period" placeholder="Jun 2025 – Present" value={ex.period} onChange={(e) => setExp(ex.id, "period", e.target.value)} />
            <TextInput aria-label="Location" placeholder="Location" value={ex.location} onChange={(e) => setExp(ex.id, "location", e.target.value)} />
            <div className="flex gap-2 sm:col-span-2">
              <TextInput aria-label="Details" placeholder="What did you do?" value={ex.details} onChange={(e) => setExp(ex.id, "details", e.target.value)} />
              <button
                type="button"
                className="btn-icon shrink-0"
                aria-label="Remove experience entry"
                onClick={() => setDraft((d) => ({ ...d, experience: d.experience.filter((x) => x.id !== ex.id) }))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {saved && <span role="status" className="text-sm text-proof">Profile saved</span>}
        <button type="submit" className="btn btn-primary">
          Save profile
        </button>
      </div>
    </form>
  );
}

/** Small wrapper to label a block of form content consistently. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="eyebrow mb-2">{title}</legend>
      {children}
    </fieldset>
  );
}
