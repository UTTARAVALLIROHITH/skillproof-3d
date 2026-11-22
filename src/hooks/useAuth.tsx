import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { blankData, saveData, storageKeyFor } from "../utils/storage";

/**
 * PROTOTYPE AUTHENTICATION — local only.
 * Accounts live in this browser's localStorage. Nothing is sent to a server.
 * Passwords are salted and hashed with SHA-256 (when WebCrypto is available),
 * which is a learning prototype, not production-grade security.
 */

export interface Session {
  userId: string;
  name: string;
  email: string;
}

interface Account extends Session {
  salt: string;
  hash: string;
  createdAt: string;
}

const ACCOUNTS_KEY = "skillproof3d:accounts";
const SESSION_KEY = "skillproof3d:session";
const DEMO_SESSION: Session = { userId: "demo", name: "Alex Rivera (demo)", email: "demo@skillproof.local" };

function readAccounts(): Account[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Account[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(list: Account[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

function readSession(): Session | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
    if (parsed && typeof parsed === "object" && typeof (parsed as Session).userId === "string") return parsed as Session;
  } catch {
    /* ignore */
  }
  return null;
}

function writeSession(session: Session | null): void {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

const encoder = new TextEncoder();

export async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `${salt}:${password}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", encoder.encode(input));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Insecure contexts (e.g. opening the built file from disk) lack WebCrypto.
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519);
  }
  return `fallback-${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
}

interface AuthValue {
  session: Session | null;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInDemo: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const signUp = useCallback(async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const normalized = email.trim().toLowerCase();
    const accounts = readAccounts();
    if (accounts.some((a) => a.email === normalized)) throw new Error("An account with this email already exists. Try signing in.");
    const userId = `u-${Date.now().toString(36)}${randomHex(3)}`;
    const salt = randomHex(16);
    const hash = await hashPassword(password, salt);
    const account: Account = { userId, name: name.trim(), email: normalized, salt, hash, createdAt: new Date().toISOString() };
    writeAccounts([...accounts, account]);
    saveData(blankData(account.name, normalized), storageKeyFor(userId));
    const next: Session = { userId, name: account.name, email: normalized };
    writeSession(next);
    setSession(next);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const account = readAccounts().find((a) => a.email === normalized);
    if (!account) throw new Error("Email or password is incorrect.");
    const hash = await hashPassword(password, account.salt);
    if (hash !== account.hash) throw new Error("Email or password is incorrect.");
    const next: Session = { userId: account.userId, name: account.name, email: account.email };
    writeSession(next);
    setSession(next);
  }, []);

  const signInDemo = useCallback(() => {
    writeSession(DEMO_SESSION);
    setSession(DEMO_SESSION);
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthValue>(() => ({ session, signUp, signIn, signInDemo, signOut }), [session, signUp, signIn, signInDemo, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
