import { motion } from "framer-motion";
import { SKILL_CATEGORIES, type Skill } from "../types";
import { ProgressBar } from "./ui";

/** Animated 2D stand-in for the hero when WebGL is unavailable. */
export function HeroFallback() {
  const nodes = Array.from({ length: 7 });
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
      {[220, 340, 460].map((size, i) => (
        <motion.div
          key={size}
          className="absolute rounded-full border border-line"
          style={{ width: size, height: size }}
          animate={{ rotate: i % 2 ? -360 : 360 }}
          transition={{ duration: 40 + i * 12, repeat: Infinity, ease: "linear" }}
        >
          {nodes.slice(0, 3 + i).map((_, n) => {
            const angle = (n / (3 + i)) * Math.PI * 2;
            return (
              <span
                key={n}
                className="absolute h-3 w-3 rounded-full bg-accent shadow-[0_0_14px_var(--accent)]"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * (size / 2)}px - 6px)`,
                  top: `calc(50% + ${Math.sin(angle) * (size / 2)}px - 6px)`,
                  opacity: 0.55 + (n % 3) * 0.15,
                }}
              />
            );
          })}
        </motion.div>
      ))}
      <div className="absolute h-24 w-24 rounded-full bg-accent/20 blur-2xl" />
      <div className="absolute h-14 w-14 rounded-full bg-accent shadow-[0_0_60px_var(--accent)]" />
    </div>
  );
}

/** Accessible list view of skills, used when WebGL is unavailable. */
export function SkillListFallback({ skills, selectedId, onSelect }: { skills: Skill[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {SKILL_CATEGORIES.map((cat) => {
        const list = skills.filter((s) => s.category === cat);
        if (list.length === 0) return null;
        return (
          <section key={cat} className="glass rounded-3xl p-5" aria-label={cat}>
            <h3 className="eyebrow mb-3">{cat}</h3>
            <ul className="space-y-3">
              {list.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    aria-pressed={selectedId === s.id}
                    className="w-full rounded-2xl border border-transparent p-2 text-left hover:border-line aria-pressed:border-accent/50"
                  >
                    <ProgressBar value={s.proficiency} label={s.name} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function WebGLNotice() {
  return (
    <p className="glass rounded-2xl px-4 py-3 text-sm text-mute">
      3D rendering is unavailable in this browser, so the same data is shown as an accessible 2D view.
    </p>
  );
}
