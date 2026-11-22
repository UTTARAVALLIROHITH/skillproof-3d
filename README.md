# SkillProof 3D

**An interactive 3D portfolio and evidence workspace. Don't just claim your skills. Show the proof.**

> **Project links**
> - 🌐 **Live website:** https://uttaravallirohith.github.io/skillproof-3d/
> - 💻 **GitHub repository:** https://github.com/UTTARAVALLIROHITH/skillproof-3d
> - 👤 **Developer:** [Uttaravalli Rohith](https://github.com/UTTARAVALLIROHITH)

SkillProof 3D helps students, developers, and early-career professionals present skills through evidence instead of relying only on résumé claims. It turns a conventional résumé into a visual **Skill Universe**, **Project Galaxy**, **Certificate Vault**, and shareable **Skill Passport**, with an import centre to collect profile information and a review step before applying it.

> **Current status:** SkillProof 3D is a client-side front-end prototype. Profile data, accounts, and sessions are stored in the current browser. There is no hosted backend, cloud sync, or production authentication.

## Website and source code

- **Live website:** https://uttaravallirohith.github.io/skillproof-3d/
- **Source code:** https://github.com/UTTARAVALLIROHITH/skillproof-3d
- **Deployment:** GitHub Pages through GitHub Actions
- **Application type:** React + TypeScript single-page web application

## Features

- **3D landing experience** — Animated 3D skill-and-project universe with ambient particles, mouse parallax, and scroll-driven camera movement.
- **Skill Universe** — Explore skills as nodes grouped into category rings. Search and filter skills, inspect proficiency, and open supporting evidence.
- **Project Galaxy** — Browse projects as planets, with descriptions, technologies, contributions, screenshots, repository links, and live demos.
- **Certificate Vault** — Organise certificates, issuers, dates, credential URLs, related skills, verification status, and image/PDF attachments (up to 1.5 MB).
- **Evidence Engine** — Connect skills to practical proof such as repositories, live projects, certificates, screenshots, demo videos, documentation, and practical work.
- **Skill Passport** — Present profile, education, skills, projects, certificates, achievements, and contact links. Switch between owner and public views and export a standalone HTML passport.
- **Dashboard** — Create, edit, and delete profile details, skills, projects, certificates, evidence, and achievements. Manage themes and data backups.
- **Import Center** — Import résumé content, public GitHub repository details, LinkedIn data archives, certificates, and website/project links. Review extracted information before applying it.
- **Import History** — Review previous imports and the source/provenance associated with imported information.
- **Local account prototype** — Create a local account or use demo sign-in. Each account has its own workspace in the current browser.
- **Responsive and accessible experience** — Adaptive 3D quality, lazy-loaded pages, reduced-motion support, keyboard-operable controls, skip link, and 2D fallbacks when WebGL is unavailable.

## Main application screens

| Screen | Route | Purpose |
| --- | --- | --- |
| Home | `#/` | Introduction and 3D landing experience |
| Skill Universe | `#/universe` | Explore and manage skill evidence visually |
| Project Galaxy | `#/projects` | Showcase projects and their details |
| Certificate Vault | `#/certificates` | Organise certificates and credentials |
| Evidence Engine | `#/evidence` | Inspect proof linked to skills |
| Skill Passport | `#/passport` | Owner-facing profile |
| Public Passport | `#/passport?view=public` | Public presentation view |
| Dashboard | `#/dashboard` | Edit profile and portfolio data |
| Import Center | `#/import` | Import profile information |
| Import History | `#/import/history` | Review past imports |
| Login / Signup | `#/login` / `#/signup` | Local sign-in and account creation |
| Onboarding | `#/onboarding` | Initial profile setup |

## Getting started

1. Open the [live website](https://uttaravallirohith.github.io/skillproof-3d/).
2. Choose **Sign up** to create a local account, or use demo sign-in if available.
3. Complete onboarding if it appears.
4. Open **Dashboard** and add your profile details, education, skills, projects, certificates, and public links.
5. Attach evidence to your skills and projects.
6. Open **Skill Universe**, **Project Galaxy**, and **Certificate Vault** to explore your portfolio.
7. Review **Skill Passport** and switch to public view before sharing.

> **Important:** Local sign-up is only a prototype. Your account is not created on a server and will not automatically follow you to another browser or device.

## Importing profile information

The Import Center supports the following sources, subject to the limitations below:

| Source | Supported input | What it can do |
| --- | --- | --- |
| Résumé | PDF, DOCX, TXT/MD, or pasted text | Extract readable profile details, education, experience, skills, projects, certificates, and achievements. |
| GitHub | Public GitHub username or repository/profile URL | Retrieve public repository details, detected languages, and links for possible project imports. |
| LinkedIn | Official LinkedIn data archive ZIP or CSV files | Parse available experience, education, skills, certifications, and projects. |
| LinkedIn profile URL | Profile link | Save the URL as a profile link; it does not scrape private LinkedIn profile content. |
| Portfolio/project website | Public URL | Attempt to read accessible page content; if blocked, retain the URL as a link. |
| Certificate | PDF or image | Add certificate material for review and profile organisation. |

### Import review workflow

1. Validate the selected file or URL.
2. Extract readable content.
3. Normalise values into SkillProof profile fields.
4. Detect duplicates, possible conflicts, and skill mentions.
5. Review the proposed changes and their source.
6. Approve only the candidates you want.
7. Apply approved information to your profile.

The importer records provenance so you can identify where information came from. Extracted suggestions should not automatically be treated as verified facts, and the review step is designed to avoid silently overwriting manually edited information.

## Understanding evidence and proof levels

SkillProof distinguishes between a skill claim and evidence that supports it:

- **Self-reported** — The skill is listed or rated by the profile owner without supporting evidence.
- **Evidence-backed** — At least one project or evidence item supports the skill. This does not mean a third party has verified it.
- **Independently verified** — A linked certificate has been marked **Issuer-checked** by the profile owner after checking it with the issuer. SkillProof does not perform issuer verification automatically.

Certificate statuses include **Unverified**, **Credential linked**, and **Issuer-checked**. A URL by itself does not prove that a credential is valid.

## Privacy, data handling, and limitations

SkillProof 3D is currently a front-end prototype, not a production multi-user service.

- **Browser storage:** Profile data, accounts, and sessions are stored in browser `localStorage`. Clearing browser data can remove them.
- **No cloud sync:** Data does not automatically sync between browsers, devices, or users.
- **Prototype authentication:** Local passwords are hashed in the browser, but this is not production-grade authentication. Do not use a reused or sensitive password.
- **No hosted backend:** The current project does not include Supabase or another hosted database integration.
- **Optional AI extraction:** The default importer uses a local rules-based parser. An optional proxy-provider interface exists, but it requires your own secured server-side endpoint. Never put an AI API key in browser code.
- **Résumé PDFs:** Text-based PDFs can be parsed. Scanned/image-only PDFs require OCR and may not produce extracted text.
- **LinkedIn:** Official archive files are supported. The project does not include authorised LinkedIn API access or private profile scraping.
- **External websites:** Some portfolio sites block browser requests. In those cases, the importer may save only the URL.
- **GitHub API limits:** Unauthenticated public API requests are subject to GitHub rate limits (commonly 60 requests per hour per IP).
- **Issuer verification:** SkillProof does not contact certificate issuers or validate credentials automatically.
- **Sample content:** Demonstration entries in `src/data/sampleData.ts` are sample data. Replace them with your own information before publishing.

Do not use this prototype to store sensitive personal information or treat it as a secure credential vault. Before sharing a public passport, remove contact details or other information you do not want to publish.

## Technology

- React 19 and TypeScript
- Vite 7 and `vite-plugin-singlefile`
- Three.js, React Three Fiber 9, and Drei 10
- Tailwind CSS 4
- Framer Motion 12
- Lucide React
- JSZip and Mammoth for supported archive/document import flows
- Vitest for importer tests
- Browser `localStorage` for local persistence

## Run locally

### Requirements

- Node.js 20.19+ or Node.js 22+
- npm

### Install and start

```bash
git clone https://github.com/UTTARAVALLIROHITH/skillproof-3d.git
cd skillproof-3d
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

### Useful commands

```bash
# TypeScript check
npx tsc --noEmit

# Run importer tests
npx vitest run

# Create the production build
npm run build

# Preview the production build locally
npm run preview
```

The Vite configuration uses `vite-plugin-singlefile`; the production output is intended to be a self-contained `dist/index.html` with bundled JavaScript and CSS inlined.

## Deploy to GitHub Pages

A GitHub Actions workflow is included at `.github/workflows/pages.yml`. It installs dependencies, type-checks, builds the app, uploads the `dist` artifact, and deploys it to GitHub Pages when code is pushed to `main`.

1. Push the project to the repository's `main` branch.
2. Open repository **Settings → Pages**.
3. Set the build/deployment source to **GitHub Actions**.
4. Open the **Actions** tab and monitor the Pages deployment workflow.
5. After a successful deployment, open https://uttaravallirohith.github.io/skillproof-3d/.

The app uses hash-based navigation (for example, `#/projects` and `#/passport`), so it does not require server-side route rewrites.

## App Screens

A visual tour of the actual SkillProof 3D interface should be added here. Screenshots must be captured from the running SkillProof 3D application—not copied from SafeNow or replaced with mockups.

**Screenshot status:** No SkillProof 3D screenshot image files are currently committed in this repository. Once real captures are added to `public/screenshots/`, list them here in a compact four-column gallery with a small preview, screen name, and short description.

Suggested captures:

- `landing.png` — 3D landing page and hero scene
- `skill-universe.png` — Interactive skill map
- `project-galaxy.png` — Project browser and project details
- `certificate-vault.png` — Certificate collection
- `evidence-engine.png` — Evidence linked to skills
- `dashboard.png` — Profile and portfolio editor
- `import-center.png` — Source selection and import review
- `passport.png` — Public Skill Passport

## Project structure

```text
.github/workflows/pages.yml   GitHub Actions build and Pages deployment
public/                        Favicon and static public assets
src/
  3d/                           Three-dimensional scenes and shared canvas helpers
  components/                   Navigation, UI, forms, loading and import components
  data/                         Theme palette and sample profile data
  hooks/                        Authentication, routing, state and import hooks
  importer/
    adapters/                   Résumé, GitHub, LinkedIn, web and document adapters
    ai/                         Optional server-proxy AI extraction interface
    __tests__/                  Importer tests
    apply.ts                    Apply approved import candidates
    candidates.ts               Normalisation, duplicate and conflict detection
    pipeline.ts                 Import pipeline orchestration
    validate.ts                 File and URL validation
  pages/                        Landing, dashboard, passport, import and portfolio pages
  utils/                        Storage, proof, export, capability and helper utilities
  App.tsx                        App shell, route map, lazy loading and transitions
  main.tsx                       React entry point
  index.css                      Global styles, theme tokens and visual utilities
  types.ts                       Shared domain types
```

## Testing and troubleshooting

| Symptom | What to check |
| --- | --- |
| 3D scene is blank or unavailable | Use a browser with WebGL enabled and updated graphics drivers. Supported views include 2D fallbacks. |
| The page looks different on another device | 3D quality adapts to device capability; local profile data is browser/device-specific. |
| Imported résumé fields are missing | Confirm the PDF contains selectable text, or try DOCX/TXT/MD/pasted text. Review candidates before applying. |
| A portfolio URL cannot be read | The site may block browser access. Save the URL as a link instead. |
| GitHub import stops returning data | Public unauthenticated API rate limits may have been reached. Try again later. |
| Data is missing on another device | Export a JSON backup from the original browser and restore it in the other browser. |
| GitHub Pages does not update | Check the latest Actions run, Pages source, and whether the workflow deployed from `main`. |

## Feedback and contributions

For issues or suggestions, use the repository's GitHub Issues page:

https://github.com/UTTARAVALLIROHITH/skillproof-3d/issues

To contribute:

1. Fork the repository and create a feature branch.
2. Install dependencies with `npm install`.
3. Run `npx tsc --noEmit`, `npx vitest run`, and `npm run build`.
4. Keep changes focused and preserve accessibility, reduced-motion, and local-data safeguards.

## License

See [LICENSE](LICENSE).

---

**Maintainer:** [UTTARAVALLIROHITH](https://github.com/UTTARAVALLIROHITH)
