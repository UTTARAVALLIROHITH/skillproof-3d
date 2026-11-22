import { SKILL_CATEGORIES, type AppData } from "../types";
import { escapeHtml, formatDate } from "./helpers";
import { getSkillProof } from "./proof";

/**
 * Builds a self-contained, script-free HTML passport that can be opened
 * offline or hosted anywhere. All user content is escaped.
 */
export function buildPassportHtml(data: AppData): string {
  const e = escapeHtml;
  const p = data.profile;
  const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? e(u) : "#");

  const skillsHtml = SKILL_CATEGORIES.map((cat) => {
    const list = data.skills.filter((s) => s.category === cat);
    if (list.length === 0) return "";
    const items = list
      .map((s) => {
        const proof = getSkillProof(s, data);
        return `<li>
          <div class="row"><strong>${e(s.name)}</strong><span class="pill">${e(proof.level)}</span></div>
          <div class="bar"><i style="width:${Math.max(0, Math.min(100, s.proficiency))}%"></i></div>
          <small>${e(s.learningStatus)} · ${s.proficiency}% self-assessed</small>
        </li>`;
      })
      .join("");
    return `<section><h3>${e(cat)}</h3><ul class="skills">${items}</ul></section>`;
  })
    .filter(Boolean)
    .join("");

  const projectsHtml = data.projects
    .map(
      (pr) => `<article class="card">
        <div class="swatch" style="background:${e(pr.color)}"></div>
        <div>
          <h4>${e(pr.name)} ${pr.featured ? '<span class="pill">Featured</span>' : ""}</h4>
          <p>${e(pr.summary)}</p>
          <small>${e(pr.kind)} · ${e(pr.status)}</small>
          <p class="tags">${pr.technologies.map((t) => `<span>${e(t)}</span>`).join("")}</p>
          <p class="links">${pr.githubUrl ? `<a href="${safeUrl(pr.githubUrl)}" rel="noopener noreferrer">Repository</a>` : ""}${pr.liveUrl ? `<a href="${safeUrl(pr.liveUrl)}" rel="noopener noreferrer">Live demo</a>` : ""}</p>
        </div>
      </article>`
    )
    .join("");

  const certsHtml = data.certificates
    .map((c) => {
      const media = c.fileData && c.fileType.startsWith("image/") ? `<img class="cert-img" src="${e(c.fileData)}" alt="${e(c.title)}" />` : "";
      return `<article class="card">
        <div>
          <h4>${e(c.title)}</h4>
          <p>${e(c.issuer)} · ${e(formatDate(c.issueDate))}</p>
          <p><span class="pill">${e(c.verification)}</span></p>
          ${media}
          <p class="links">${c.credentialUrl ? `<a href="${safeUrl(c.credentialUrl)}" rel="noopener noreferrer">Credential</a>` : ""}</p>
        </div>
      </article>`;
    })
    .join("");

  const achievementsHtml = data.achievements
    .map((a) => `<li><strong>${e(a.title)}</strong> <small>${e(formatDate(a.date))}</small><p>${e(a.description)}</p></li>`)
    .join("");

  const experienceHtml = p.experience
    .map((ex) => `<li><strong>${e(ex.role)}</strong>${ex.company ? ` <span class="muted">· ${e(ex.company)}</span>` : ""}<p>${e([ex.period, ex.location].filter(Boolean).join(" · "))}</p><p>${e(ex.details)}</p></li>`)
    .join("");

  const educationHtml = p.education
    .map((ed) => `<li><strong>${e(ed.school)}</strong><p>${e(ed.degree)} · ${e(ed.period)}</p><p>${e(ed.details)}</p></li>`)
    .join("");

  const contact = [
    p.email ? `<a href="mailto:${e(p.email)}">${e(p.email)}</a>` : "",
    p.github ? `<a href="${safeUrl(p.github)}" rel="noopener noreferrer">GitHub</a>` : "",
    p.linkedin ? `<a href="${safeUrl(p.linkedin)}" rel="noopener noreferrer">LinkedIn</a>` : "",
    p.website ? `<a href="${safeUrl(p.website)}" rel="noopener noreferrer">Website</a>` : "",
  ]
    .filter(Boolean)
    .join("");

  const initials = e((p.name.trim()[0] ?? "S").toUpperCase());
  const avatar = p.avatar ? `<img class="avatar" src="${e(p.avatar)}" alt="${e(p.name)}" />` : `<div class="avatar initials">${initials}</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="${e(p.name)} — SkillProof passport. ${e(p.headline)}" />
<title>${e(p.name || "Passport")} — SkillProof 3D</title>
<style>
  :root { color-scheme: dark; --canvas:#070a12; --ink:#f2f4f9; --mute:#9aa4b8; --line:rgba(255,255,255,.1); --glass:rgba(255,255,255,.05); --accent:#b7c8ff; --proof:#8fe3b4; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif; background: radial-gradient(900px 600px at 85% -10%, rgba(183,200,255,.14), transparent 60%), var(--canvas); color: var(--ink); line-height: 1.6; }
  main { max-width: 980px; margin: 0 auto; padding: 56px 22px 80px; }
  h1, h2 { font-family: "Instrument Serif", Georgia, serif; font-weight: 400; letter-spacing: -.01em; }
  h1 { font-size: clamp(2.6rem, 6vw, 4.2rem); margin: .2rem 0; line-height: 1.02; }
  h2 { font-size: 2rem; margin: 0 0 1rem; }
  h3 { font-size: .75rem; letter-spacing: .2em; text-transform: uppercase; color: var(--mute); margin: 1.2rem 0 .6rem; }
  h4 { margin: 0 0 .2rem; font-size: 1rem; }
  section, .hero { background: var(--glass); border: 1px solid var(--line); border-radius: 28px; padding: 28px; margin-bottom: 20px; }
  .hero { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
  .avatar { width: 96px; height: 96px; border-radius: 999px; object-fit: cover; border: 1px solid var(--line); }
  .initials { display:flex; align-items:center; justify-content:center; font-family: "Instrument Serif", serif; font-size: 2.2rem; background: var(--glass); }
  .eyebrow { font-size: .72rem; letter-spacing: .22em; text-transform: uppercase; color: var(--mute); }
  .muted, small, p { color: var(--mute); }
  .pill { display:inline-block; border:1px solid var(--line); border-radius: 999px; padding: 2px 10px; font-size: .72rem; color: var(--mute); }
  .row { display:flex; justify-content:space-between; gap:12px; align-items:center; }
  .bar { height: 6px; border-radius: 999px; background: var(--line); overflow:hidden; margin: 8px 0 4px; }
  .bar i { display:block; height:100%; background: var(--accent); border-radius: 999px; }
  ul { list-style:none; padding:0; margin:0; }
  .skills > li { padding: 10px 0; border-bottom: 1px solid var(--line); }
  .skills > li:last-child { border-bottom: 0; }
  .grid { display:grid; gap:14px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .card { display:flex; gap:14px; border:1px solid var(--line); border-radius: 20px; padding: 16px; }
  .swatch { width: 14px; min-height: 100%; border-radius: 999px; flex-shrink: 0; }
  .tags span { display:inline-block; margin: 0 6px 6px 0; border:1px solid var(--line); border-radius: 999px; padding: 1px 9px; font-size:.72rem; color: var(--mute); }
  .links a, .contact a { color: var(--accent); margin-right: 14px; text-decoration: none; }
  .links a:hover, .contact a:hover { text-decoration: underline; }
  .cert-img { width: 100%; max-width: 360px; border-radius: 12px; margin-top: 8px; border:1px solid var(--line); }
  .timeline li { padding: 12px 0; border-bottom: 1px solid var(--line); }
  .notice { font-size: .8rem; color: var(--mute); text-align: center; margin-top: 30px; }
  .sep { color: var(--line); margin: 0 6px; }
</style>
</head>
<body>
<main>
  <header class="hero">
    ${avatar}
    <div style="flex:1; min-width: 240px">
      <p class="eyebrow">SkillProof passport</p>
      <h1>${e(p.name || "Untitled passport")}</h1>
      <p style="font-size:1.05rem;color:var(--ink)">${e(p.headline)}</p>
      <p>${e(p.location)}</p>
      <p class="contact">${contact}</p>
    </div>
  </header>

  ${p.about ? `<section><p class="eyebrow">About</p><p style="font-size:1.05rem;color:var(--ink);white-space:pre-line">${e(p.about)}</p></section>` : ""}

  ${p.education.length ? `<section><h2>Education</h2><ul class="timeline">${educationHtml}</ul></section>` : ""}

  ${p.experience.length ? `<section><h2>Experience</h2><ul class="timeline">${experienceHtml}</ul></section>` : ""}

  ${skillsHtml ? `<section><h2>Skills</h2><p>Self-reported proficiency. Each skill shows how it is proven.</p>${skillsHtml}</section>` : ""}

  ${projectsHtml ? `<section><h2>Projects</h2><div class="grid">${projectsHtml}</div></section>` : ""}

  ${certsHtml ? `<section><h2>Certificates</h2><p>“Issuer-checked” means the owner confirmed the credential on the issuer’s page. SkillProof does not verify automatically.</p><div class="grid">${certsHtml}</div></section>` : ""}

  ${achievementsHtml ? `<section><h2>Achievements</h2><ul class="timeline">${achievementsHtml.replace(/<li>/g, "<li>")}</ul></section>` : ""}

  <p class="notice">Exported from SkillProof 3D · Don't just claim your skills. Show the proof.</p>
</main>
</body>
</html>`;
}
