import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return { x: Math.cos(a) * 64, y: Math.sin(a) * 40, color: i % 3 === 0 ? "var(--proof)" : i % 3 === 1 ? "var(--accent)" : "var(--warn)" };
});

/**
 * Completion animation. It is non-blocking: pointer events pass through everywhere except the card,
 * it dismisses itself after a few seconds, and it can be closed at once.
 */
export function ImportComplete({ message, detail, onDone }: { message: string; detail: string; onDone: () => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const t = window.setTimeout(() => doneRef.current(), 4200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4" role="status" aria-live="polite">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong pointer-events-auto relative flex items-center gap-5 rounded-3xl py-4 pl-5 pr-12"
        >
          <div className="relative h-16 w-16 shrink-0" aria-hidden="true">
            {PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                style={{ background: p.color }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: p.x, y: p.y, opacity: 0 }}
                transition={{ duration: 1.4, delay: 0.25, ease: "easeOut" }}
              />
            ))}
            <motion.span
              className="absolute inset-0 rounded-full bg-accent shadow-[0_0_30px_var(--accent)]"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.1, 0.9, 1], opacity: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              style={{ width: 22, height: 22, margin: "auto" }}
            />
            <motion.span
              className="orbit-ring absolute inset-0 rounded-full border border-titanium/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          </div>
          <div>
            <p className="font-display text-2xl leading-tight">{message}</p>
            <p className="mt-1 text-xs text-mute">{detail}</p>
          </div>
          <button type="button" onClick={() => doneRef.current()} aria-label="Dismiss" className="btn-icon absolute right-2 top-2">
            <X size={15} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
