import { lazy, Suspense, useMemo, useState } from "react";
import { Award, Download, FileText, Pencil, Plus, Trash2, Crosshair } from "lucide-react";
import { useStore } from "../hooks/useStore";
import { useWebGL } from "../hooks/useEnvironment";
import { VERIFICATION_LEVELS, type Certificate, type VerificationLevel } from "../types";
import { VERIFICATION_COLORS } from "../data/palette";
import { VERIFICATION_COPY } from "../utils/proof";
import { formatDate, cn } from "../utils/helpers";
import { CertificateForm } from "../components/forms";
import { Badge, Chip, EmptyState, ExtLink, Glass, Modal, Select, confirmAction } from "../components/ui";
import { WebGLNotice } from "../components/Fallback2D";

const VaultScene = lazy(() => import("../3d/VaultScene"));

export default function CertificateVault() {
  const { data, upsertCertificate, deleteCertificate } = useStore();
  const webgl = useWebGL();
  const [filter, setFilter] = useState<VerificationLevel | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Certificate | "new" | null>(null);

  const list = useMemo(
    () => data.certificates.filter((c) => filter === "All" || c.verification === filter),
    [data.certificates, filter]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Certificate Vault</p>
          <h1 className="font-display mt-3 text-5xl leading-tight md:text-6xl">Credentials, kept under glass.</h1>
          <p className="mt-4 text-mute">
            Store certificates with their credential links and files. Verification is only ever set by you, after you check the issuer.
          </p>
        </div>
        <button type="button" className="btn btn-primary self-start px-6 py-3 md:self-auto" onClick={() => setEditing("new")}>
          <Plus size={16} aria-hidden="true" /> Add certificate
        </button>
      </header>

      <Glass className="mt-8 flex items-start gap-3 p-5 text-sm leading-relaxed text-mute">
        <Award size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
        <p>
          SkillProof does not contact issuers or verify credentials automatically. <strong className="text-ink">Unverified</strong> means nothing has been checked.{" "}
          <strong className="text-ink">Credential linked</strong> means a URL or file is attached. <strong className="text-ink">Issuer-checked</strong> means you confirmed
          the credential on the issuer’s own page.
        </p>
      </Glass>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by verification status">
        <Chip active={filter === "All"} onClick={() => setFilter("All")}>
          All ({data.certificates.length})
        </Chip>
        {VERIFICATION_LEVELS.map((v) => (
          <Chip key={v} active={filter === v} onClick={() => setFilter(v)}>
            <span className="h-2 w-2 rounded-full" style={{ background: VERIFICATION_COLORS[v] }} aria-hidden="true" />
            {v} ({data.certificates.filter((c) => c.verification === v).length})
          </Chip>
        ))}
      </div>

      <div className="glass-strong relative mt-6 h-[52vh] min-h-[400px] overflow-hidden rounded-[2rem]">
        {webgl ? (
          <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-mute">Opening vault…</div>}>
            <VaultScene certs={list} selectedId={selectedId} onSelect={setSelectedId} />
          </Suspense>
        ) : (
          <div className="h-full overflow-y-auto p-6">
            <WebGLNotice />
          </div>
        )}
        <div className="pointer-events-none absolute bottom-4 left-4 flex gap-2 text-[11px] text-mute">
          <span className="glass rounded-full px-3 py-1.5">Drag to look around</span>
          <span className="glass rounded-full px-3 py-1.5">Click a card</span>
        </div>
      </div>

      <section aria-labelledby="cert-list" className="mt-14">
        <h2 id="cert-list" className="font-display mb-6 text-3xl">
          Your certificates
        </h2>
        {list.length === 0 ? (
          <EmptyState
            title={data.certificates.length === 0 ? "Your vault is empty" : "No certificates in this view"}
            text={data.certificates.length === 0 ? "Add a certificate with its issuer, date and credential link, or upload the file itself." : "Change the filter to see other certificates."}
            action={
              data.certificates.length === 0 ? (
                <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
                  <Plus size={15} aria-hidden="true" /> Add certificate
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => {
              const isSelected = selectedId === c.id;
              const relatedSkills = data.skills.filter((s) => c.skillIds.includes(s.id));
              return (
                <li key={c.id}>
                  <Glass className={cn("flex h-full flex-col gap-4 p-5 transition-colors", isSelected && "border-accent/60")}>
                    <div className="flex gap-4">
                      <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-glass">
                        {c.fileData && c.fileType.startsWith("image/") ? (
                          <img src={c.fileData} alt={`Preview of ${c.title}`} className="h-full w-full object-cover" />
                        ) : c.fileData ? (
                          <FileText size={22} className="text-mute" aria-label="PDF file attached" />
                        ) : (
                          <Award size={22} className="text-mute" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-snug">{c.title}</h3>
                        <p className="mt-1 text-xs text-mute">
                          {c.issuer} · {formatDate(c.issueDate)}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="h-2 w-2 rounded-full" style={{ background: VERIFICATION_COLORS[c.verification] }} aria-hidden="true" />
                          <span>{c.verification}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-mute">{VERIFICATION_COPY[c.verification]}</p>
                    {relatedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {relatedSkills.map((s) => (
                          <Badge key={s.id}>{s.name}</Badge>
                        ))}
                      </div>
                    )}
                    {c.notes && <p className="text-xs text-mute">{c.notes}</p>}

                    <div className="mt-auto space-y-3 border-t border-line pt-4">
                      <label className="block text-xs text-mute">
                        Verification status (set after checking)
                        <Select
                          className="mt-1.5 py-2 text-xs"
                          value={c.verification}
                          onChange={(e) => upsertCertificate({ ...c, verification: e.target.value as VerificationLevel })}
                        >
                          {VERIFICATION_LEVELS.map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </Select>
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {c.credentialUrl && <ExtLink href={c.credentialUrl} className="text-xs">Credential</ExtLink>}
                        {c.fileData && (
                          <a href={c.fileData} download={c.fileName || "certificate"} className="inline-flex items-center gap-1 text-xs text-accent underline-offset-4 hover:underline">
                            <Download size={12} aria-hidden="true" /> File
                          </a>
                        )}
                        <div className="ml-auto flex gap-1">
                          <button type="button" className="btn-icon" aria-label={`Spotlight ${c.title} in the vault`} aria-pressed={isSelected} onClick={() => setSelectedId(isSelected ? null : c.id)}>
                            <Crosshair size={16} />
                          </button>
                          <button type="button" className="btn-icon" aria-label={`Edit ${c.title}`} onClick={() => setEditing(c)}>
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon hover:text-red-400"
                            aria-label={`Delete ${c.title}`}
                            onClick={() => {
                              if (!confirmAction(`Delete "${c.title}" from your vault? This cannot be undone.`)) return;
                              deleteCertificate(c.id);
                              if (selectedId === c.id) setSelectedId(null);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Glass>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add certificate" : "Edit certificate"} wide>
        {editing !== null && (
          <CertificateForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? undefined : editing}
            onSubmit={(c) => {
              upsertCertificate(c);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
