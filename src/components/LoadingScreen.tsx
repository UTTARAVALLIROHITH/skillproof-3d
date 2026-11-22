import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useReducedMotion } from "../hooks/useEnvironment";

/** Pure-CSS 3D orbital loader shown on first paint. */
export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), reduced ? 300 : 1700);
    return () => window.clearTimeout(t);
  }, [reduced]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="Loading SkillProof 3D"
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-canvas"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative h-44 w-44" style={{ perspective: 600 }}>
            <div className="preserve-3d absolute inset-0">
              <div className="orbit-ring absolute inset-0 rounded-full border border-titanium/60" />
              <div className="orbit-ring-2 absolute inset-4 rounded-full border border-accent/50" />
              <div className="orbit-ring absolute inset-10 rounded-full border border-line" style={{ animationDuration: "2.4s" }} />
              <div className="float-bob absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_40px_var(--accent)]" />
              <div className="absolute left-1/2 top-[18%] h-3 w-3 -translate-x-1/2 rounded-full bg-proof shadow-[0_0_14px_var(--proof)]" />
              <div className="absolute bottom-[22%] right-[14%] h-2.5 w-2.5 rounded-full bg-warn shadow-[0_0_12px_var(--warn)]" />
            </div>
          </div>
          <p className="font-display mt-8 text-2xl">SkillProof 3D</p>
          <p className="mt-2 text-xs tracking-[0.25em] text-mute uppercase">Mapping your proof…</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
