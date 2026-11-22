import { useCallback, useEffect, useState } from "react";
import type { ImportRecord, Provenance } from "../importer/types";
import { storageKeyFor } from "../utils/storage";
import { useAuth } from "./useAuth";

/**
 * Import state for the current workspace: consent, AI-proxy settings, import history and
 * provenance (where each stored value came from). Kept beside the profile, never inside it,
 * so original extracted data stays separate from the user's own edits.
 */
export interface Ledger {
  consent: boolean;
  aiEnabled: boolean;
  aiEndpoint: string;
  records: ImportRecord[];
  provenance: Record<string, Provenance>;
}

const EMPTY: Ledger = { consent: false, aiEnabled: false, aiEndpoint: "", records: [], provenance: {} };

function load(key: string): Ledger {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Ledger>) };
  } catch {
    return EMPTY;
  }
}

export function useImportLedger() {
  const { session } = useAuth();
  const key = `${storageKeyFor(session?.userId ?? null)}:imports`;
  const [ledger, setLedger] = useState<Ledger>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(ledger));
    } catch {
      /* storage full: the profile itself will report the problem */
    }
  }, [key, ledger]);

  const setConsent = useCallback((consent: boolean) => setLedger((l) => ({ ...l, consent })), []);
  const setAi = useCallback((aiEnabled: boolean, aiEndpoint: string) => setLedger((l) => ({ ...l, aiEnabled, aiEndpoint: aiEndpoint.trim() })), []);
  const addRecord = useCallback((record: ImportRecord) => setLedger((l) => ({ ...l, records: [record, ...l.records] })), []);
  const removeRecord = useCallback((id: string) => setLedger((l) => ({ ...l, records: l.records.filter((r) => r.id !== id) })), []);
  const setProvenance = useCallback((provenance: Record<string, Provenance>) => setLedger((l) => ({ ...l, provenance })), []);
  const dropProvenance = useCallback(
    (keys: string[]) =>
      setLedger((l) => {
        const provenance = { ...l.provenance };
        for (const k of keys) delete provenance[k];
        return { ...l, provenance };
      }),
    []
  );

  return { ledger, setConsent, setAi, addRecord, removeRecord, setProvenance, dropProvenance };
}
