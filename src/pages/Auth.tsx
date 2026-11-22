import { useState, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Eye, EyeOff, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { navigate } from "../hooks/useRoute";
import { SplitWords } from "../components/motion";
import { Field, TextInput } from "../components/ui";
import { cn } from "../utils/helpers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function passwordChecks(pw: string) {
  return [
    { label: "At least 8 characters", ok: pw.length >= 8 },
    { label: "Letters and numbers", ok: /[A-Za-z]/.test(pw) && /\d/.test(pw) },
    { label: "Upper and lower case", ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  ];
}

function OrbitVisual() {
  return (
    <div className="relative mx-auto h-[340px] w-[340px]" style={{ perspective: 700 }} aria-hidden="true">
      <div className="preserve-3d absolute inset-0">
        <div className="orbit-ring absolute inset-0 rounded-full border border-titanium/50" />
        <div className="orbit-ring-2 absolute inset-6 rounded-full border border-accent/40" />
        <div className="orbit-ring absolute inset-14 rounded-full border border-line" style={{ animationDuration: "2.6s" }} />
        <div className="float-bob absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_50px_var(--accent)]" />
        <div className="absolute left-[18%] top-[22%] h-3 w-3 rounded-full bg-proof shadow-[0_0_14px_var(--proof)]" />
        <div className="absolute bottom-[20%] right-[16%] h-2.5 w-2.5 rounded-full bg-warn shadow-[0_0_12px_var(--warn)]" />
      </div>
    </div>
  );
}

function AuthLayout({ eyebrow, title, subtitle, children, footer }: { eyebrow: string; title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="relative mx-auto grid min-h-[100svh] max-w-6xl items-center gap-12 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-2">
      <div className="hidden flex-col items-center lg:flex">
        <OrbitVisual />
        <p className="font-display mt-10 max-w-md text-center text-4xl leading-tight">
          <SplitWords text="Don't just claim your skills." delay={0.2} />
          <br />
          <span className="text-accent">
            <SplitWords text="Show the proof." delay={0.7} />
          </span>
        </p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }} className="mt-4 max-w-sm text-center text-sm text-mute">
          One workspace per account, stored in this browser. Connect GitHub and LinkedIn to fill it in minutes.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97, rotateX: 6 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformPerspective: 1200 }}
        className="glass-strong mx-auto w-full max-w-md rounded-[2rem] p-7 sm:p-9"
      >
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="font-display mt-3 text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-mute">{subtitle}</p>
        <div className="mt-7">{children}</div>
        <div className="mt-7 border-t border-line pt-5 text-sm text-mute">{footer}</div>
      </motion.div>
    </div>
  );
}

function Notice({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-2xl border px-4 py-2.5 text-sm", tone === "error" ? "border-red-400/35 bg-red-500/10 text-red-300" : "border-accent/30 bg-accent/10 text-accent")}
    >
      {children}
    </p>
  );
}

export function LoginPage() {
  const { signIn, signInDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailOk = EMAIL_RE.test(email.trim());
  const emailError = touched && email && !emailOk ? "Enter a valid email address." : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!emailOk || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
      navigate("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Continue to your universe."
      footer={
        <div className="space-y-4">
          <p>
            New here?{" "}
            <button type="button" className="text-accent underline-offset-4 hover:underline" onClick={() => navigate("signup")}>
              Create an account
            </button>
          </p>
          <button type="button" onClick={() => { signInDemo(); navigate("universe"); }} className="btn btn-ghost w-full">
            <Sparkles size={14} aria-hidden="true" /> Try the demo account
          </button>
          <button type="button" onClick={() => navigate("")} className="block text-xs text-mute underline-offset-4 hover:text-ink hover:underline">
            Continue without an account
          </button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Email" htmlFor="li-email" error={emailError}>
          <TextInput id="li-email" type="email" autoComplete="email" value={email} onBlur={() => setTouched(true)} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
        </Field>
        <Field label="Password" htmlFor="li-pass">
          <div className="relative">
            <TextInput id="li-pass" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-mute hover:text-ink"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <button type="submit" disabled={busy} className="btn btn-primary w-full py-3">
          {busy ? "Signing in…" : "Sign in"}
          {!busy && <ArrowRight size={15} aria-hidden="true" />}
        </button>
      </form>
    </AuthLayout>
  );
}

export function SignupPage() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const checks = passwordChecks(password);
  const score = checks.filter((c) => c.ok).length + (password.length >= 12 ? 1 : 0);
  const matches = confirm.length > 0 && confirm === password;
  const emailOk = EMAIL_RE.test(email.trim());
  const ready = name.trim().length > 1 && emailOk && checks.every((c) => c.ok) && matches;

  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"][Math.min(score, 4)];
  const strengthColor = ["bg-red-400", "bg-red-400", "bg-warn", "bg-accent", "bg-proof"][Math.min(score, 4)];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready) {
      setError("Complete every field and requirement to continue.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signUp({ name, email, password });
      navigate("onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Create your passport"
      title="Sign up"
      subtitle="Takes under a minute. You can connect GitHub and LinkedIn next."
      footer={
        <p>
          Already have an account?{" "}
          <button type="button" className="text-accent underline-offset-4 hover:underline" onClick={() => navigate("login")}>
            Sign in
          </button>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Full name" htmlFor="su-name">
          <TextInput id="su-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
        </Field>
        <Field label="Email" htmlFor="su-email" error={email && !emailOk ? "Enter a valid email address." : undefined}>
          <TextInput id="su-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
        </Field>
        <Field label="Password" htmlFor="su-pass">
          <div className="relative">
            <TextInput id="su-pass" type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-mute hover:text-ink"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-3 space-y-2" aria-live="polite">
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <motion.div
                  className={cn("h-full rounded-full", strengthColor)}
                  animate={{ width: password ? `${(Math.min(score, 4) / 4) * 100}%` : "0%" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="w-16 text-right text-[11px] text-mute">{password ? strengthLabel : ""}</span>
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {checks.map((c) => (
                <li key={c.label} className={cn("flex items-center gap-2 text-xs transition-colors", c.ok ? "text-proof" : "text-mute")}>
                  <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", c.ok ? "border-proof bg-proof/20" : "border-line")}>
                    {c.ok && <Check size={10} aria-hidden="true" />}
                  </span>
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        </Field>
        <Field label="Confirm password" htmlFor="su-confirm" error={confirm && !matches ? "Passwords do not match yet." : undefined}>
          <TextInput id="su-confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <button type="submit" disabled={busy || !ready} className="btn btn-primary w-full py-3">
          {busy ? "Creating…" : "Create account"}
          {!busy && <ArrowRight size={15} aria-hidden="true" />}
        </button>
        <p className="text-[11px] leading-relaxed text-mute">
          Prototype: your account and workspace are stored only in this browser. Nothing is sent to a server. Use a password you don’t reuse elsewhere.
        </p>
      </form>
    </AuthLayout>
  );
}
