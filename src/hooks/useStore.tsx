import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppData, Achievement, Certificate, Evidence, Profile, Project, Skill, ThemeId } from "../types";
import { loadData, saveData } from "../utils/storage";
import { sampleData } from "../data/sampleData";
import { todayISO } from "../utils/helpers";

interface StoreValue {
  data: AppData;
  saveError: string | null;
  updateProfile: (profile: Profile) => void;
  upsertSkill: (skill: Skill) => void;
  deleteSkill: (id: string) => void;
  upsertProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  upsertCertificate: (cert: Certificate) => void;
  deleteCertificate: (id: string) => void;
  upsertEvidence: (item: Evidence) => void;
  deleteEvidence: (id: string) => void;
  upsertAchievement: (item: Achievement) => void;
  deleteAchievement: (id: string) => void;
  setTheme: (theme: ThemeId) => void;
  replaceData: (data: AppData) => void;
  resetToDemo: () => void;
  clearAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function upsertIn<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((x) => x.id === item.id);
  if (index < 0) return [item, ...list];
  const copy = [...list];
  copy[index] = item;
  return copy;
}

export function StoreProvider({ children, storageKey }: { children: ReactNode; storageKey: string }) {
  const [data, setData] = useState<AppData>(() => loadData(storageKey));
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const ok = saveData(data, storageKey);
    setSaveError(ok ? null : "Browser storage is full. Export a backup and remove large screenshots or files.");
  }, [data, storageKey]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((prev) => fn(prev)), []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      saveError,
      updateProfile: (profile) => update((d) => ({ ...d, profile })),
      upsertSkill: (skill) => update((d) => ({ ...d, skills: upsertIn(d.skills, { ...skill, updatedAt: todayISO() }) })),
      deleteSkill: (id) =>
        update((d) => ({
          ...d,
          skills: d.skills.filter((s) => s.id !== id),
          evidence: d.evidence.filter((e) => e.skillId !== id),
          projects: d.projects.map((p) => ({ ...p, skillIds: p.skillIds.filter((x) => x !== id) })),
          certificates: d.certificates.map((c) => ({ ...c, skillIds: c.skillIds.filter((x) => x !== id) })),
        })),
      upsertProject: (project) => update((d) => ({ ...d, projects: upsertIn(d.projects, project) })),
      deleteProject: (id) => update((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) })),
      upsertCertificate: (cert) => update((d) => ({ ...d, certificates: upsertIn(d.certificates, cert) })),
      deleteCertificate: (id) => update((d) => ({ ...d, certificates: d.certificates.filter((c) => c.id !== id) })),
      upsertEvidence: (item) => update((d) => ({ ...d, evidence: upsertIn(d.evidence, item) })),
      deleteEvidence: (id) => update((d) => ({ ...d, evidence: d.evidence.filter((e) => e.id !== id) })),
      upsertAchievement: (item) => update((d) => ({ ...d, achievements: upsertIn(d.achievements, item) })),
      deleteAchievement: (id) => update((d) => ({ ...d, achievements: d.achievements.filter((a) => a.id !== id) })),
      setTheme: (theme) => update((d) => ({ ...d, theme })),
      replaceData: (next) => update(() => next),
      resetToDemo: () => update(() => sampleData),
      clearAll: () =>
        update((d) => ({
          ...d,
          skills: [],
          projects: [],
          certificates: [],
          evidence: [],
          achievements: [],
        })),
    }),
    [data, saveError, update]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
