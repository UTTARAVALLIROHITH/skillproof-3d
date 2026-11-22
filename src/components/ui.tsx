import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldCheck, FileCheck2, Circle, ExternalLink } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../utils/helpers";
import { PROOF_COPY } from "../utils/proof";
import type { ProofLevel } from "../types";

export function Glass({
  children,
  className,
  strong = false,
  as = "div",
  ...aria
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  as?: "div" | "section" | "article" | "aside";
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  const Tag = as;
  return (
    <Tag className={cn("rounded-3xl", strong ? "glass-strong" : "glass", className)} {...aria}>
      {children}
    </Tag>
  );
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({ eyebrow, title, text, align = "left" }: { eyebrow?: string; title: string; text?: string; align?: "left" | "center" }) {
  return (
    <div className={cn("space-y-3", align === "center" && "mx-auto max-w-2xl text-center")}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="font-display text-4xl leading-tight md:text-5xl">{title}</h2>
      {text && <p className="text-base leading-relaxed text-mute md:text-lg">{text}</p>}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium tracking-wide text-mute">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-mute/80">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex max-w-full items-center gap-1.5 break-all text-sm text-accent underline-offset-4 hover:underline", className)}
    >
      {children}
      <ExternalLink size={13} aria-hidden="true" className="shrink-0" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("input", props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("input min-h-[96px] resize-y", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("input appearance-none pr-9", props.className)} />;
}

export function Chip({
  children,
  active = false,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button type="button" className={cn("chip", className)} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "success" | "warn"; className?: string }) {
  const tones = {
    neutral: "border-line text-mute",
    accent: "border-accent/40 text-accent",
    success: "border-proof/50 text-proof",
    warn: "border-warn/50 text-warn",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function ProofBadge({ level, compact = false }: { level: ProofLevel; compact?: boolean }) {
  const Icon = level === "Independently verified" ? ShieldCheck : level === "Evidence-backed" ? FileCheck2 : Circle;
  const copy = PROOF_COPY[level];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border bg-glass px-2.5 py-1 text-[11px] font-medium", copy.tone)}
      title={copy.text}
    >
      <Icon size={12} aria-hidden="true" />
      {!compact && <span>{level}</span>}
      {compact && <span className="sr-only">{level}</span>}
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between text-xs text-mute">
          <span>{label}</span>
          <span>{v}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line p-10 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="max-w-md text-sm text-mute">{text}</p>
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "glass-strong relative flex max-h-[92vh] w-full flex-col rounded-t-3xl sm:rounded-3xl",
              wide ? "max-w-3xl" : "max-w-xl"
            )}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
              <h2 id={titleId} className="font-display text-2xl">
                {title}
              </h2>
              <button ref={closeRef} type="button" className="btn-icon" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function confirmAction(message: string): boolean {
  return window.confirm(message);
}
