# [SkillProof 3D](https://github.com/UTTARAVALLIROHITH/skillproof-3d)

> **Don't just claim your skills. Show the proof.**

SkillProof 3D is an interactive, 3D digital portfolio and evidence workspace for students, developers, and early-career professionals. It turns a conventional résumé into a visual **Skill Universe**, **Project Galaxy**, **Certificate Vault**, and shareable **Skill Passport**—with an import centre to collect profile information and a review step before applying it.

The application is built with React, TypeScript, Three.js / React Three Fiber, Vite, Tailwind CSS, and Framer Motion. It is currently a **client-side prototype**: profile data is stored in the browser, and authentication is local to that browser. It does not currently use a hosted backend or cloud account database.

## Project Overview

SkillProof 3D helps students, developers, and early-career professionals present skills through evidence instead of relying only on résumé claims. It brings skills, projects, certificates, achievements, and supporting links into an interactive 3D portfolio with an import-and-review workflow.

**Live website:** https://uttaravallirohith.github.io/skillproof-3d/

**Repository:** https://github.com/UTTARAVALLIROHITH/skillproof-3d

**Current implementation status:** Front-end prototype. Profile data and local accounts are stored in the browser; there is no hosted backend, cloud sync, or production authentication yet.

## At a Glance

- **Skill Universe** — Explore skills and their supporting evidence in a visual 3D layout.
- **Project Galaxy** — Present projects with descriptions, technologies, contributions, screenshots, repository links, and demos.
- **Certificate Vault** — Organise certificates, credentials, and related skills.
- **Evidence Engine** — Connect each skill to practical proof such as projects, repositories, certificates, and demonstrations.
- **Skill Passport** — Share a structured public-facing profile and export a standalone HTML version.
- **Import Center** — Bring in résumé, public GitHub, LinkedIn archive, certificate, and website information, then review proposed changes before applying them.

## Contents

- [What you can do](#what-you-can-do)
- [Pages and navigation](#pages-and-navigation)
- [How to use SkillProof](#how-to-use-skillproof)
- [Importing existing profile information](#importing-existing-profile-information)
- [Understanding proof levels](#understanding-proof-levels)
- [Privacy, storage, and current limitations](#privacy-storage-and-current-limitations)
- [Technology](#technology)
- [Run locally](#run-locally)
- [Deploy to GitHub Pages](#deploy-to-github-pages)
- [Project structure](#project-structure)
- [Testing and troubleshooting](#testing-and-troubleshooting)
- [Screenshots](#screenshots)

## What you can do

| Feature | Description |
| --- | --- |
| **3D landing experience** | An animated hero scene with a 3D skill-and-project universe, ambient particles, mouse parallax, and scroll-driven camera movement. |
| **Skill Universe** | Explore skills as nodes grouped into category rings. Search and filter skills, inspect proficiency, and open the evidence attached to a skill. |
| **Project Galaxy** | Browse projects as planets. Search and filter by status or featured state, then inspect project descriptions, technologies, contributions, screenshots, GitHub links, and live demos. |
| **Certificate Vault** | View certificates in a 3D glass-style vault and a managed list. Store issuer, date, credential URL, related skills, verification status, and an image or PDF attachment (up to 1.5 MB). |
| **Evidence Engine** | Organise proof for individual skills: repositories, live projects, certificates, screenshots, demo videos, documentation, and practical work. |
| **Skill Passport** | Present your profile, education, skills, projects, certificates, achievements, and contact links. Switch between owner and public views and export a standalone HTML passport. |
| **Dashboard** | Create, edit, and delete profile details, skills, projects, certificates, evidence, and achievements. Change the visual theme and manage data backups. |
| **Profile importer** | Import résumé content, public GitHub repository details, LinkedIn data archives, certificates, and website/project links. Review extracted information before applying it. |
| **Import history** | Review previous imports and see the source/provenance associated with imported profile information. |
| **Local account prototype** | Create an account or use the demo sign-in. Each local account has its own workspace in the current browser. |
| **Responsive motion and accessibility** | Adaptive 3D quality, lazy-loaded pages, reduced-motion support, keyboard-operable controls, a skip link, and 2D fallbacks when WebGL is unavailable. |

## Pages and navigation

The app uses hash-based routes, so GitHub Pages does not need custom server-side route rewrites.

| Route | Page | Purpose |
| --- | --- | --- |
| `#/` | Home | Introduction and 3D landing experience |
| `#/universe` | Skill Universe | Explore and manage skill evidence visually |
| `#/projects` | Project Galaxy | Showcase projects and their details |
| `#/certificates` | Certificate Vault | Organise certificates and credentials |
| `#/evidence` | Evidence Engine | Inspect proof linked to skills |
| `#/passport` | Skill Passport | Owner-facing profile |
| `#/passport?view=public` | Public Passport | Public presentation view |
| `#/dashboard` | Dashboard | Edit profile and portfolio data |
| `#/import` | Import Center | Import profile information |
| `#/import/history` | Import History | Review past imports |
| `#/login` / `#/signup` | Authentication | Local sign-in and account creation |
| `#/onboarding` | Onboarding | Initial profile setup |

## How to use SkillProof

### 1. Open the app and set up your profile

1. Open the deployed website or run the project locally.
2. Use **Sign up** to create a local account, or choose the demo sign-in if available.
3. Complete onboarding if it appears.
4. Open **Dashboard** and add your real name, headline, profile summary, education, and public links.

> **Important:** local sign-up is only a prototype. Your account is not created on a server and will not automatically follow you to another browser or device.

### 2. Add your skills

1. Open **Dashboard** and find the skills editor.
2. Add a skill name and choose its category.
3. Set your proficiency level honestly.
4. Save the skill.
5. Open **Skill Universe** to explore the skill in the 3D view.
6. Attach evidence to support the skill instead of relying only on a self-rating.

### 3. Add projects

1. Open **Dashboard** and add a project.
2. Enter its title, description, status, and technologies.
3. Add your role or contributions.
4. Add a GitHub repository URL and/or live demo URL when available.
5. Add project screenshots if the editor offers them.
6. Open **Project Galaxy** to see the project in the visual portfolio.

### 4. Add certificates

1. Open **Dashboard** or **Certificate Vault**.
2. Add the certificate title, issuing organisation, issue date, credential URL, and related skills.
3. Attach a certificate image or PDF if needed (the app's current attachment limit is 1.5 MB).
4. Select the correct verification status. Do not mark a certificate as issuer-checked unless you have checked it with the issuer.

### 5. Build evidence for each skill

1. Open **Evidence Engine**.
2. Select the skill you want to support.
3. Add evidence such as a repository, live project, certificate, screenshot, video, documentation, or practical work.
4. Include a useful description and URL/date where applicable.
5. Review the evidence trail and make sure the links are accessible.

### 6. Import information from other sources

1. Open **Import** in the navigation.
2. Select the source type.
3. Upload a supported file or paste a URL/username.
4. Review the candidate information, duplicates, and conflicts.
5. Approve only the details you want to add.
6. Open **Import History** to review the import record.

The importer is designed to avoid silently overwriting information you manually edited. Review the source and proposed values before approving.

### 7. Share your portfolio

1. Open **Passport** and review your profile.
2. Switch to the public view to check what visitors will see.
3. Use the export option to generate a standalone HTML passport, if you want a portable copy.
4. Share the public page URL or exported file.

Before sharing, remove private contact details or information you do not want to publish.

### 8. Back up your data

Open **Dashboard → Data & backup** and export a JSON backup regularly. Use the restore/import option to bring a previous backup back into the same browser workspace.

## Importing existing profile information

The Import Center supports the following paths, subject to the limitations below:

| Source | Supported input | What it can do |
| --- | --- | --- |
| Résumé | PDF, DOCX, TXT/MD, or pasted text | Extract profile details, education, experience, skills, projects, certificates, and achievements from readable text. |
| GitHub | Public GitHub username or repository/profile URL | Query public repository information and offer repositories for project import, including detected languages and links. |
| LinkedIn | Official LinkedIn data archive ZIP or CSV files | Parse available profile archive data such as experience, education, skills, certifications, and projects. |
| LinkedIn profile URL | Profile link | Save the URL as a profile link; it does not scrape private LinkedIn profile content. |
| Portfolio/project website | URL | Attempt to read accessible public page content; if the site blocks browser access, retain the URL as a link. |
| Certificate | PDF or image | Add certificate material for your review and profile organisation. |

### Import review process

The import pipeline follows this sequence:

1. **Validate** the file or URL, including supported formats and safety checks.
2. **Extract** readable content from the selected source.
3. **Normalise** values into SkillProof profile fields.
4. **Detect** duplicates, possible conflicts, and skill mentions.
5. **Review** the proposed changes.
6. **Approve** the candidates you want.
7. **Apply** approved information to your profile.

The importer records provenance so you can identify where a value came from. It does not intentionally treat every extracted suggestion as verified fact.

## Understanding proof levels

SkillProof distinguishes between a claim and evidence supporting that claim:

- **Self-reported** — the skill is listed or rated by the profile owner, without supporting evidence.
- **Evidence-backed** — at least one project or evidence item supports the skill. This does not mean a third party has verified it.
- **Independently verified** — a linked certificate has been marked **Issuer-checked** by the profile owner after checking the credential with the issuer. SkillProof does not perform that issuer verification automatically.

Certificate statuses include **Unverified**, **Credential linked**, and **Issuer-checked**. Choose the status accurately; a URL by itself is not proof that a credential is valid.

## Privacy, storage, and current limitations

This repository contains a front-end prototype, not a production multi-user service.

- **Local-first storage:** profile data, accounts, and sessions are stored in the browser's `localStorage`. Clearing browser data can remove them.
- **No cloud sync:** data does not automatically sync between browsers, devices, or users.
- **Prototype authentication:** local passwords are hashed in the browser, but this is not production-grade authentication. Do not use a reused or sensitive password.
- **No hosted database/backend:** the current project does not include a Supabase or other server database integration.
- **AI extraction is optional:** the default importer uses a local rules-based parser. An optional proxy-provider interface exists, but you must deploy and secure your own server-side endpoint; never put an AI API key in browser code.
- **Résumé PDFs:** text-based PDFs can be parsed; scanned/image-only PDFs require OCR and may not produce extracted text.
- **LinkedIn:** official archive files are supported. The project does not include authorised LinkedIn API access or private profile scraping.
- **External websites:** some portfolio sites block browser requests. In those cases the importer may save only the URL.
- **GitHub API limits:** unauthenticated public API requests are subject to GitHub's rate limit (commonly 60 requests per hour per IP).
- **Issuer verification:** SkillProof does not contact certificate issuers or validate credentials automatically.
- **Sample content:** demonstration entries in `src/data/sampleData.ts` are sample data. Replace them with your own information before publishing.

Do not use this prototype to store sensitive personal information or treat it as a secure credential vault.

## Technology

- **React 19** and **TypeScript**
- **Vite 7** and `vite-plugin-singlefile`
- **Three.js**, **React Three Fiber 9**, and **Drei 10**
- **Tailwind CSS 4**
- **Framer Motion 12**
- **Lucide React**
- **JSZip** and **Mammoth** for supported archive/document import flows
- **Vitest** for importer tests
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

A GitHub Actions workflow is included at `.github/workflows/deploy.yml`. It installs dependencies, type-checks, builds the app, uploads the `dist` artifact, and deploys it to GitHub Pages when code is pushed to `main`.

1. Push the project to the repository's `main` branch.
2. Open the repository's **Settings → Pages**.
3. Set the build/deployment source to **GitHub Actions**.
4. Open the **Actions** tab and watch the **Build & Deploy to GitHub Pages** workflow.
5. After a successful deployment, open:

   **https://uttaravallirohith.github.io/skillproof-3d/**

6. If Pages has not been enabled yet, enable it as described above and re-run the workflow.

The app uses hash-based navigation (for example, `#/projects` and `#/passport`), so it does not require server-side route rewrites. The build is configured for a single-file output, which helps it work from the repository subpath.

## Project structure

```text
.github/workflows/deploy.yml   GitHub Actions build and Pages deployment
public/                        Favicon and static public assets
src/
  3d/                           Three-dimensional scenes and shared canvas helpers
  components/                   Navigation, UI, forms, loading and import components
  data/                         Theme palette and labelled sample profile data
  hooks/                        Authentication, routing, state and import hooks
  importer/
    adapters/                   Resume, GitHub, LinkedIn, web and document adapters
    ai/                         Optional server-proxy AI extraction interface
    __tests__/                  Importer tests
    apply.ts                    Apply approved import candidates
    candidates.ts               Normalisation, duplicate and conflict detection
    pipeline.ts                 Import pipeline orchestration
    validate.ts                 File and URL validation
  pages/                        Landing, dashboard, passport, import and portfolio pages
  utils/                        Storage, proof, export, capability and helper utilities
  App.tsx                       App shell, route map, lazy loading and transitions
  main.tsx                      React entry point
  index.css                     Global styles, theme tokens and visual utilities
  types.ts                      Shared domain types
```

## Testing and troubleshooting

| Symptom | What to check |
| --- | --- |
| 3D scene is blank or unavailable | Use a browser with WebGL enabled and updated graphics drivers. The app includes 2D fallbacks for supported views. |
| The page looks different on another device | 3D quality adapts to device capability; local profile data is also device/browser-specific. |
| Imported résumé fields are missing | Confirm the PDF contains selectable text, or try DOCX/TXT/MD/pasted text. Review the import candidates before applying. |
| A portfolio URL cannot be read | The site may block browser access. Save the URL as a link instead. |
| GitHub import stops returning data | Public unauthenticated API rate limits may have been reached. Try again later. |
| Data is missing on another device | This prototype has no cloud sync. Export a JSON backup from the original browser and restore it in the other browser. |
| GitHub Pages does not update | Check the latest Actions run, confirm Pages source is set to GitHub Actions, and verify the workflow is deploying from `main`. |

## Screenshots

Screenshots should show the real running application, not mockups. Add captures to `public/screenshots/` and update this section when screenshots are available. Suggested captures:

- `landing.png` — 3D landing page
- `skill-universe.png` — interactive skill map
- `project-galaxy.png` — project browser
- `certificate-vault.png` — certificate collection
- `dashboard.png` — profile and portfolio editor
- `import-center.png` — source selection and import review
- `passport.png` — public skill passport

No screenshots are bundled in this source archive yet.

## Contributing

1. Fork the repository and create a feature branch.
2. Install dependencies with `npm install`.
3. Run `npx tsc --noEmit`, `npx vitest run`, and `npm run build`.
4. Keep changes focused and preserve the accessibility, reduced-motion, and local-data safeguards.

## License

See [LICENSE](LICENSE).
