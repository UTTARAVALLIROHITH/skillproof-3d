import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import BackToTop from "./components/BackToTop";
import LoadingScreen from "./components/LoadingScreen";
import Navbar from "./components/Navbar";
import { useAuth, AuthProvider } from "./hooks/useAuth";
import { useRoute } from "./hooks/useRoute";
import { StoreProvider, useStore } from "./hooks/useStore";
import { storageKeyFor } from "./utils/storage";

// Pages are code-split so the landing experience loads quickly; 3D scenes load only where used.
const Landing = lazy(() => import("./pages/Landing"));
const SkillUniverse = lazy(() => import("./pages/SkillUniverse"));
const ProjectGalaxy = lazy(() => import("./pages/ProjectGalaxy"));
const CertificateVault = lazy(() => import("./pages/CertificateVault"));
const EvidenceEngine = lazy(() => import("./pages/EvidenceEngine"));
const Passport = lazy(() => import("./pages/Passport"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const LoginPage = lazy(() => import("./pages/Auth").then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("./pages/Auth").then((m) => ({ default: m.SignupPage })));
const ImportCenter = lazy(() => import("./pages/ImportCenter"));
const ImportHistory = lazy(() => import("./pages/ImportHistory"));

const ROUTES: Record<string, ComponentType> = {
  "": Landing,
  universe: SkillUniverse,
  projects: ProjectGalaxy,
  certificates: CertificateVault,
  evidence: EvidenceEngine,
  passport: Passport,
  dashboard: Dashboard,
  onboarding: Onboarding,
  login: LoginPage,
  signup: SignupPage,
  import: ImportCenter,
  "import/history": ImportHistory,
};

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-mute" role="status">
      Loading…
    </div>
  );
}

/** A full-screen wipe that plays on every route change. Skipped under reduced motion. */
function TransitionCurtain({ path }: { path: string }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <motion.div
      key={path}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[58] origin-top bg-canvas"
      initial={{ scaleY: 1 }}
      animate={{ scaleY: 0 }}
      transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-accent/70" />
    </motion.div>
  );
}

function Shell() {
  const { data, saveError } = useStore();
  const route = useRoute();
  const known = route.path in ROUTES;
  const Page = ROUTES[known ? route.path : ""];
  const pageKey = known ? route.path || "home" : "home";

  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
  }, [data.theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [route.path]);

  return (
    <>
      <button
        type="button"
        onClick={() => document.getElementById("main")?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
      >
        Skip to content
      </button>

      <Navbar activePath={known ? route.path : ""} />

      {saveError && (
        <div role="alert" className="glass-strong fixed bottom-5 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-2xl px-5 py-3 text-sm text-red-300">
          {saveError}
        </div>
      )}

      <TransitionCurtain path={pageKey} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main"
          tabIndex={-1}
          key={pageKey}
          className="relative min-h-screen outline-none"
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Suspense fallback={<PageFallback />}>
            <Page />
          </Suspense>
        </motion.main>
      </AnimatePresence>
    </>
  );
}

/** Each signed-in account gets its own store; guests use the shared guest workspace. */
function Workspace() {
  const { session } = useAuth();
  const storageKey = storageKeyFor(session?.userId ?? null);
  return (
    <StoreProvider key={storageKey} storageKey={storageKey}>
      <Shell />
    </StoreProvider>
  );
}

function Root() {
  const [booting, setBooting] = useState(true);
  return (
    <MotionConfig reducedMotion="user">
      {booting && <LoadingScreen onDone={() => setBooting(false)} />}
      <Workspace />
      <BackToTop />
    </MotionConfig>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
