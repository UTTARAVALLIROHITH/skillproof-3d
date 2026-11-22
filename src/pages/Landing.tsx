import { lazy, Suspense, useMemo } from "react";
import { ArrowRight, ChevronDown, Orbit, FolderGit2, ShieldCheck, FileCheck2, IdCard, LayoutDashboard } from "lucide-react";
import { navigate } from "../hooks/useRoute";
import { useStore } from "../hooks/useStore";
import { useWebGL } from "../hooks/useEnvironment";
import { HeroFallback } from "../components/Fallback2D";
import { Glass, ProofBadge, Reveal, SectionTitle } from "../components/ui";
import { CountUp, Marquee, Parallax, RotatingWord, ScrambleText, ScrollProgress, ScrollWords, SplitWords, TiltCard } from "../components/motion";
import { PROOF_COPY } from "../utils/proof";
import { PROOF_LEVELS } from "../types";

const HeroScene = lazy(() => import("../3d/HeroScene"));

const FEATURES = [
  { icon: Orbit, title: "Skill Universe", text: "Every skill orbits in its category. Node size reflects proficiency. Select one to see its proof.", path: "universe" },
  { icon: FolderGit2, title: "Project Galaxy", text: "Projects become planets. Open one for screenshots, contributions, repositories and live demos.", path: "projects" },
  { icon: ShieldCheck, title: "Certificate Vault", text: "Store certificates with credential links and file uploads. Verification status is always explicit.", path: "certificates" },
  { icon: FileCheck2, title: "Evidence Engine", text: "Attach repositories, demos, documents and practical work to each skill, with dates and links.", path: "evidence" },
  { icon: IdCard, title: "Personal Passport", text: "A shareable profile with experience, education and achievements. Export it as one standalone HTML file.", path: "passport" },
  { icon: LayoutDashboard, title: "Import from GitHub & LinkedIn", text: "Paste a GitHub link to pull repositories and languages live. Upload your LinkedIn archive for the rest.", path: "onboarding" },
];

const MARQUEE = ["TypeScript", "React", "Three.js", "Cybersecurity", "PostgreSQL", "Figma", "Accessibility", "Networking", "Git & GitHub", "Docker"];

export default function Landing() {
  const webgl = useWebGL();
  const { data } = useStore();

  const stats = useMemo(
    () => [
      { label: "Skills mapped", value: data.skills.length },
      { label: "Projects", value: data.projects.length },
      { label: "Evidence items", value: data.evidence.length },
      { label: "Issuer-checked certificates", value: data.certificates.filter((c) => c.verification === "Issuer-checked").length },
    ],
    [data]
  );

  return (
    <div>
      <ScrollProgress />

      <section className="relative flex min-h-[100svh] items-center overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          {webgl ? (
            <Suspense fallback={<HeroFallback />}>
              <HeroScene />
            </Suspense>
          ) : (
            <HeroFallback />
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-canvas to-transparent" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-28 pt-32 sm:px-8">
          <Parallax speed={-0.12}>
            <Reveal>
              <p className="eyebrow">Don't just claim your skills. Show the proof.</p>
            </Reveal>
            <h1 className="font-display mt-6 max-w-3xl text-[3.1rem] leading-[0.98] sm:text-7xl lg:text-[6rem]">
              <span className="block">
                <SplitWords text="Your Skills." />
              </span>
              <span className="block text-accent">
                <SplitWords text="Your Proof." delay={0.3} />
              </span>
              <span className="block">
                <SplitWords text="Your Universe." delay={0.6} />
              </span>
            </h1>
            <Reveal delay={0.35}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-mute">
                An interactive space to showcase what you know, what you've built, and what you can prove.
              </p>
              <p className="mt-3 text-sm text-mute">
                Made for <RotatingWord words={["developers", "designers", "researchers", "security students"]} />
              </p>
            </Reveal>
            <Reveal delay={0.45}>
              <div className="mt-10 flex flex-wrap gap-3">
                <button type="button" className="btn btn-primary px-6 py-3.5 text-[0.95rem]" onClick={() => navigate("universe")}>
                  Explore My Universe
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-ghost px-6 py-3.5 text-[0.95rem]" onClick={() => navigate("signup")}>
                  Create Your Passport
                </button>
              </div>
            </Reveal>
            <p className="mt-6 text-xs text-mute">Showing demonstration content. Replace it from the Dashboard.</p>
          </Parallax>
        </div>

        <button
          type="button"
          onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-xs text-mute hover:text-ink"
        >
          Scroll to explore
          <ChevronDown size={16} aria-hidden="true" className="animate-bounce" />
        </button>
      </section>

      <Marquee items={MARQUEE} />

      <section className="relative z-10 mx-auto max-w-4xl px-5 py-32 sm:px-8">
        <p className="eyebrow mb-8">The question every portfolio should answer</p>
        <ScrollWords
          className="font-display text-3xl leading-[1.35] md:text-5xl"
          text="Most portfolios say “I know React.” SkillProof asks the next question: where is the proof? Every skill links to the repositories, demos, documents and checked credentials behind it, and says plainly when there are none."
        />
      </section>

      <section id="how" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
        <Reveal>
          <SectionTitle eyebrow="How it works" title="From claim to proof in three steps" />
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            { n: "01", t: "Connect what you already have", d: "Paste your GitHub link to import repositories and languages. Upload your LinkedIn archive for experience, education and certifications." },
            { n: "02", t: "Attach the proof", d: "Link repositories, live projects, certificates, documents and demo videos to the skills they support." },
            { n: "03", t: "Share your universe", d: "Publish a public passport or export a standalone HTML file that anyone can open." },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 0.12}>
              <TiltCard className="h-full">
                <Glass className="h-full p-7">
                  <p className="font-display text-5xl text-accent">{step.n}</p>
                  <h3 className="mt-4 text-xl font-semibold">{step.t}</h3>
                  <p className="mt-2 leading-relaxed text-mute">{step.d}</p>
                </Glass>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionTitle eyebrow="Honest by design" title="Three levels of proof, never blurred" text="SkillProof never upgrades a claim on its own. A level changes only when you attach evidence or confirm a credential yourself." />
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROOF_LEVELS.map((level, i) => (
            <Reveal key={level} delay={i * 0.12}>
              <TiltCard className="h-full">
                <Glass className="h-full p-7">
                  <ProofBadge level={level} />
                  <p className="mt-5 leading-relaxed text-mute">{PROOF_COPY[level].text}</p>
                </Glass>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionTitle eyebrow="Explore" title="Everything lives in one universe" />
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <TiltCard className="h-full">
                <button type="button" onClick={() => navigate(f.path)} className="group block h-full w-full text-left focus-visible:outline-accent">
                  <Glass className="h-full p-6 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">
                    <f.icon size={22} className="text-accent" aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-semibold">
                      <ScrambleText text={f.title} />
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-mute">{f.text}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent">
                      Open <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </Glass>
                </button>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal>
          <Glass className="grid gap-10 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
            <div>
              <p className="eyebrow">Your universe today</p>
              <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="text-xs text-mute">{s.label}</dt>
                    <dd className="font-display mt-1 text-4xl">
                      <CountUp to={s.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <button type="button" className="btn btn-primary px-7 py-3.5" onClick={() => navigate("passport")}>
              View the passport
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </Glass>
        </Reveal>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pb-12 text-xs text-mute sm:px-8">
        <span>SkillProof 3D · Open source under the MIT License</span>
        <span>Data stays in your browser (localStorage). Sign-in is a local prototype.</span>
      </footer>
    </div>
  );
}
