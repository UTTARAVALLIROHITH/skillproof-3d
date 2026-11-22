import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "../utils/helpers";

/* ------------------------------------------------------------------ Text animations */

/** Words rise out of a 3D fold with a blur-to-sharp resolve. Pass `inView` to play on scroll. */
export function SplitWords({
  text,
  className = "",
  delay = 0,
  stagger = 0.07,
  inView = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  inView?: boolean;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  if (reduced) return <span className={className}>{text}</span>;

  const hidden = { opacity: 0, y: "0.65em", rotateX: -75, filter: "blur(10px)" };
  const shown = { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" };

  return (
    <span className={cn("inline-block", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-block" style={{ perspective: 900 }}>
        {words.map((w, i) => (
          <span key={`${w}-${i}`}>
            <motion.span
              className="inline-block origin-bottom"
              initial={hidden}
              {...(inView ? { whileInView: shown, viewport: { once: true, margin: "-40px" } } : { animate: shown })}
              transition={{ duration: 0.95, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Paragraph whose words light up one by one as the reader scrolls through it. */
export function ScrollWords({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.5"] });
  const words = text.split(" ");
  if (reduced) return <p className={className}>{text}</p>;
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <ScrollWord key={`${w}-${i}`} word={w} index={i} total={words.length} progress={scrollYProgress} />
      ))}
    </p>
  );
}

function ScrollWord({ word, index, total, progress }: { word: string; index: number; total: number; progress: MotionValue<number> }) {
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(progress, [start, end], [0.16, 1]);
  const y = useTransform(progress, [start, end], [8, 0]);
  return (
    <>
      <motion.span className="inline-block" style={{ opacity, y }}>
        {word}
      </motion.span>
      {index < total - 1 ? " " : null}
    </>
  );
}

/** A word that slides in and out in a loop, for “Made for ___” lines. */
export function RotatingWord({ words, interval = 2400 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => window.clearInterval(t);
  }, [words.length, interval, reduced]);
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <span className="invisible">{words.reduce((a, b) => (a.length >= b.length ? a : b))}</span>
      <motion.span
        key={words[i]}
        className="absolute inset-0 text-accent"
        initial={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
        animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
        exit={{ y: "-100%", opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {words[i]}
      </motion.span>
    </span>
  );
}

const SCRAMBLE = "!<>-_\\/[]{}=+*^?#";

/** Hover over text to see it decode letter by letter. */
export function ScrambleText({ text, className = "" }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  const run = () => {
    if (timer.current) window.clearInterval(timer.current);
    let frame = 0;
    const total = 16;
    timer.current = window.setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      setDisplay(
        text
          .split("")
          .map((c, i) => (i < reveal || c === " " ? c : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]))
          .join("")
      );
      if (frame >= total && timer.current) {
        window.clearInterval(timer.current);
        setDisplay(text);
      }
    }, 35);
  };

  return (
    <span onMouseEnter={run} className={className}>
      {display}
    </span>
  );
}

/* ------------------------------------------------------------------ Scroll effects */

/** Thin accent bar at the top of the viewport that tracks reading progress. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return <motion.div aria-hidden="true" className="fixed inset-x-0 top-0 z-[55] h-[2px] origin-left bg-accent" style={{ scaleX }} />;
}

/** Moves its content vertically at a different rate than the page, creating depth. */
export function Parallax({ children, speed = 0.2, className }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * -160, speed * 160]);
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/** Counts from zero to `to` once it scrolls into view. */
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(reduced ? to : 0);

  useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, reduced]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ Hover & depth */

/** Glass card that tilts toward the pointer and shows a moving specular highlight. */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const rx = useSpring(0, { stiffness: 200, damping: 20 });
  const ry = useSpring(0, { stiffness: 200, damping: 20 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.16), transparent 55%)`;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 12);
    rx.set(-(py - 0.5) * 12);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={cn("relative rounded-3xl", className)}
    >
      {children}
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glare }} />
    </motion.div>
  );
}

/** Pulls its child slightly toward the cursor. */
export function Magnetic({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const reduced = useReducedMotion();
  const x = useSpring(0, { stiffness: 250, damping: 18 });
  const y = useSpring(0, { stiffness: 250, damping: 18 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div onMouseMove={onMove} onMouseLeave={onLeave} style={{ x, y }} className="inline-block">
      {children}
    </motion.div>
  );
}

/** Endless horizontal ticker. Pauses under reduced motion. */
export function Marquee({ items, duration = 40 }: { items: string[]; duration?: number }) {
  const row = (
    <div className="flex shrink-0 items-center gap-12 pr-12">
      {items.map((t, i) => (
        <span key={i} className="font-display whitespace-nowrap text-4xl text-mute/70 md:text-5xl">
          {t}
          <span className="ml-12 text-accent">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y border-line py-7" aria-hidden="true">
      <div className="marquee-track flex w-max" style={{ animationDuration: `${duration}s` }}>
        {row}
        {row}
      </div>
    </div>
  );
}
