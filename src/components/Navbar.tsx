import { LayoutDashboard, FolderGit2, Orbit, IdCard, ShieldCheck, FileCheck2, Home, LogOut, UploadCloud } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { navigate } from "../hooks/useRoute";
import { cn } from "../utils/helpers";

export const NAV_ITEMS = [
  { path: "universe", label: "Skill Universe", icon: Orbit },
  { path: "projects", label: "Project Galaxy", icon: FolderGit2 },
  { path: "certificates", label: "Vault", icon: ShieldCheck },
  { path: "evidence", label: "Evidence", icon: FileCheck2 },
  { path: "passport", label: "Passport", icon: IdCard },
  { path: "import", label: "Import", icon: UploadCloud },
  { path: "dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

export default function Navbar({ activePath }: { activePath: string }) {
  const { session, signOut } = useAuth();
  const initial = (session?.name.trim()[0] ?? "").toUpperCase();
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-6 sm:pt-5">
      <nav aria-label="Main navigation" className="glass-strong pointer-events-auto flex w-full max-w-6xl items-center gap-2 rounded-full px-2 py-2">
        <button
          type="button"
          onClick={() => navigate("")}
          className="flex shrink-0 items-center gap-2.5 rounded-full px-2.5 py-1.5 text-sm font-semibold tracking-tight"
          aria-label="SkillProof 3D home"
        >
          <span className="relative inline-flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-accent/25 blur-[3px]" />
            <span className="relative h-3 w-3 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
            <span className="absolute h-7 w-7 rounded-full border border-titanium/60" style={{ transform: "rotateX(70deg)" }} />
          </span>
          <span className="hidden md:inline">SkillProof</span>
          <span className="hidden text-mute md:inline">3D</span>
        </button>

        <ul className="scrollbar-none flex flex-1 items-center gap-1 overflow-x-auto md:justify-end">
          <li>
            <button
              type="button"
              onClick={() => navigate("")}
              aria-current={activePath === "" ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors",
                activePath === "" ? "bg-accent text-accent-ink" : "text-mute hover:text-ink"
              )}
            >
              <Home size={14} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Home</span>
            </button>
          </li>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = activePath === path;
            return (
              <li key={path}>
                <button
                  type="button"
                  onClick={() => navigate(path)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors",
                    active ? "bg-accent text-accent-ink" : "text-mute hover:text-ink"
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span className={cn(!active && "hidden lg:inline", active && "inline")}>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {session ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => navigate("dashboard")}
              aria-label={`Signed in as ${session.name}. Open dashboard`}
              className="hidden items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-xs text-mute transition-colors hover:text-ink sm:flex"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-ink">{initial}</span>
              <span className="max-w-[96px] truncate">{session.name}</span>
            </button>
            <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="btn-icon">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate("login")}
            className="shrink-0 rounded-full border border-line px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:border-accent/60"
          >
            Sign in
          </button>
        )}
      </nav>
    </header>
  );
}
