import type { AppData, Achievement, Certificate, Evidence, Profile, Project, Skill } from "../types";

/*
 * DEMONSTRATION CONTENT ONLY.
 * Every name, institution, certificate, and URL below is sample data so the app
 * is useful the moment it opens. Replace it in the Dashboard with your own.
 * Links point to placeholder domains on purpose.
 */

export const DEMO_PROFILE: Profile = {
  name: "Alex Rivera",
  headline: "Computer Science student · Full-stack web & security enthusiast",
  about:
    "I build web products and then try to break them. This universe maps my coursework, side projects and certificates to the skills they actually prove. (Demonstration content — replace with your own.)",
  location: "Lisbon, Portugal",
  email: "hello@example.com",
  github: "https://github.com/demo-user",
  linkedin: "https://www.linkedin.com/in/demo-user",
  website: "https://example.com",
  avatar: "",
  phone: "",
  languages: ["English", "Portuguese"],
  links: [{ id: "link-portfolio", label: "Portfolio", url: "https://example.com" }],
  experience: [
    {
      id: "exp-1",
      role: "Frontend Engineering Intern",
      company: "Demo Labs (sample)",
      period: "Jun 2025 – Aug 2025",
      location: "Remote",
      details: "Built a shared component library in React and TypeScript and cut bundle size by 18%.",
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "Demo University of Technology",
      degree: "B.Sc. Computer Science",
      period: "2023 – 2026",
      details: "Coursework: Distributed Systems, Databases, Human-Computer Interaction, Network Security.",
    },
  ],
};

const skills: Skill[] = [
  { id: "s-ts", name: "TypeScript", category: "Programming", proficiency: 85, learningStatus: "Proficient", summary: "Typed application code, shared models and component APIs.", updatedAt: "2025-11-02" },
  { id: "s-py", name: "Python", category: "Programming", proficiency: 80, learningStatus: "Proficient", summary: "Scripting, data processing and small security tooling.", updatedAt: "2025-10-12" },
  { id: "s-java", name: "Java", category: "Programming", proficiency: 55, learningStatus: "Learning", summary: "Object-oriented design through university coursework.", updatedAt: "2025-06-03" },
  { id: "s-rust", name: "Rust", category: "Programming", proficiency: 25, learningStatus: "Exploring", summary: "Early exploration of memory-safe systems programming.", updatedAt: "2025-09-20" },
  { id: "s-react", name: "React", category: "Web Development", proficiency: 88, learningStatus: "Proficient", summary: "Component architecture, hooks, state management and performance.", updatedAt: "2025-11-02" },
  { id: "s-node", name: "Node.js", category: "Web Development", proficiency: 75, learningStatus: "Practicing", summary: "REST APIs, authentication flows and background jobs.", updatedAt: "2025-10-30" },
  { id: "s-tw", name: "Tailwind CSS", category: "Web Development", proficiency: 85, learningStatus: "Proficient", summary: "Design systems, responsive layouts and theming.", updatedAt: "2025-08-14" },
  { id: "s-three", name: "Three.js", category: "Web Development", proficiency: 65, learningStatus: "Learning", summary: "Scene graphs, materials, lighting and camera choreography.", updatedAt: "2025-10-15" },
  { id: "s-netsec", name: "Network Defense", category: "Cybersecurity", proficiency: 60, learningStatus: "Learning", summary: "Firewalls, intrusion detection basics and log analysis labs.", updatedAt: "2025-07-22" },
  { id: "s-owasp", name: "OWASP Top 10", category: "Cybersecurity", proficiency: 70, learningStatus: "Practicing", summary: "Identifying and mitigating common web vulnerabilities.", updatedAt: "2025-11-02" },
  { id: "s-pentest", name: "Penetration Testing", category: "Cybersecurity", proficiency: 40, learningStatus: "Learning", summary: "Authorised testing inside intentionally vulnerable lab environments.", updatedAt: "2025-09-05" },
  { id: "s-tcp", name: "TCP/IP & Routing", category: "Networking", proficiency: 70, learningStatus: "Practicing", summary: "Packet flow, subnetting and routing fundamentals.", updatedAt: "2025-04-10" },
  { id: "s-wire", name: "Wireshark Analysis", category: "Networking", proficiency: 50, learningStatus: "Learning", summary: "Capturing and reading protocol traces in lab settings.", updatedAt: "2025-04-02" },
  { id: "s-pg", name: "PostgreSQL", category: "Database", proficiency: 75, learningStatus: "Practicing", summary: "Schema design, migrations, indexing and transactions.", updatedAt: "2025-10-30" },
  { id: "s-sql", name: "SQL Query Design", category: "Database", proficiency: 80, learningStatus: "Proficient", summary: "Joins, window functions and query plan reading.", updatedAt: "2025-06-06" },
  { id: "s-mongo", name: "MongoDB", category: "Database", proficiency: 50, learningStatus: "Learning", summary: "Document modelling for prototypes and event logs.", updatedAt: "2025-05-18" },
  { id: "s-figma", name: "Figma", category: "UI/UX Design", proficiency: 85, learningStatus: "Proficient", summary: "Prototyping, component libraries and design handoff.", updatedAt: "2025-09-28" },
  { id: "s-a11y", name: "Accessibility Design", category: "UI/UX Design", proficiency: 70, learningStatus: "Practicing", summary: "WCAG-driven audits, contrast systems and keyboard flows.", updatedAt: "2025-05-28" },
  { id: "s-research", name: "User Research", category: "UI/UX Design", proficiency: 55, learningStatus: "Learning", summary: "Moderated sessions, synthesis and affinity mapping.", updatedAt: "2025-05-28" },
  { id: "s-git", name: "Git & GitHub", category: "Tools & Technologies", proficiency: 90, learningStatus: "Proficient", summary: "Branching strategies, reviews and GitHub Actions pipelines.", updatedAt: "2025-11-02" },
  { id: "s-docker", name: "Docker", category: "Tools & Technologies", proficiency: 60, learningStatus: "Practicing", summary: "Containerising services and local development stacks.", updatedAt: "2025-08-01" },
];

const projects: Project[] = [
  {
    id: "p-market",
    name: "Campus Marketplace",
    summary: "Peer-to-peer marketplace for textbooks and equipment.",
    description:
      "Full-stack marketplace with listings, messaging, a moderation queue and role-based access. Built as a capstone project with a team of four.",
    kind: "Web App",
    technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"],
    screenshots: [],
    githubUrl: "https://github.com/demo-user/campus-marketplace",
    liveUrl: "https://example.com/campus-marketplace",
    status: "Completed",
    featured: true,
    skillIds: ["s-react", "s-ts", "s-node", "s-pg", "s-tw"],
    contributions: [
      "Designed the listing and search API",
      "Implemented JWT authentication with refresh flow",
      "Wrote integration tests (78% line coverage)",
    ],
    color: "#9fb8ff",
    startedAt: "2025-01-15",
  },
  {
    id: "p-orbit",
    name: "Orbit Planner 3D",
    summary: "Interactive 3D planner for weekly study schedules.",
    description:
      "Experimental planner that places weekly tasks on orbital rings. Rendered with React Three Fiber and persisted to local storage.",
    kind: "Game & 3D",
    technologies: ["React", "Three.js", "TypeScript"],
    screenshots: [],
    githubUrl: "https://github.com/demo-user/orbit-planner",
    liveUrl: "",
    status: "In Progress",
    featured: true,
    skillIds: ["s-three", "s-ts", "s-react", "s-figma"],
    contributions: ["Built the camera transition system", "Designed the orbit visual language in Figma"],
    color: "#c9b8ff",
    startedAt: "2025-09-10",
  },
  {
    id: "p-sniff",
    name: "Packet Analysis Lab",
    summary: "Guided lab for analysing captured network traffic.",
    description:
      "Python scripts and worksheets that parse PCAP files and flag suspicious TCP handshake patterns in a controlled lab environment.",
    kind: "Security",
    technologies: ["Python", "Scapy", "Wireshark"],
    screenshots: [],
    githubUrl: "https://github.com/demo-user/packet-lab",
    liveUrl: "",
    status: "Prototype",
    featured: false,
    skillIds: ["s-py", "s-tcp", "s-wire", "s-netsec"],
    contributions: ["Wrote the PCAP parser", "Authored three lab worksheets"],
    color: "#8fd6cc",
    startedAt: "2025-03-02",
  },
  {
    id: "p-study",
    name: "Accessible Checkout Study",
    summary: "UX research on accessible e-commerce checkout flows.",
    description:
      "Moderated usability sessions with 12 participants, a prioritised accessibility audit and a redesigned checkout prototype.",
    kind: "Research",
    technologies: ["Figma", "User interviews", "WCAG 2.2"],
    screenshots: [],
    githubUrl: "",
    liveUrl: "https://example.com/checkout-prototype",
    status: "Completed",
    featured: false,
    skillIds: ["s-figma", "s-a11y", "s-research"],
    contributions: ["Ran 12 moderated sessions", "Produced the prioritised audit report"],
    color: "#f0cf9b",
    startedAt: "2025-05-20",
  },
  {
    id: "p-secnotes",
    name: "Secure Notes API",
    summary: "Note-taking API hardened against OWASP Top 10 risks.",
    description:
      "Express API with PostgreSQL, rate limiting, parameterised queries and a separate intentionally vulnerable branch used for training.",
    kind: "Security",
    technologies: ["Node.js", "PostgreSQL", "OWASP ZAP"],
    screenshots: [],
    githubUrl: "https://github.com/demo-user/secure-notes-api",
    liveUrl: "",
    status: "In Progress",
    featured: false,
    skillIds: ["s-owasp", "s-node", "s-pg", "s-pentest"],
    contributions: ["Fixed 6 findings from a ZAP scan", "Added parameterised query layer"],
    color: "#e8b0c4",
    startedAt: "2025-10-01",
  },
];

const certificates: Certificate[] = [
  {
    id: "c-cyber",
    title: "Introduction to Cybersecurity (sample)",
    issuer: "Demo Academy",
    issueDate: "2025-02-14",
    credentialUrl: "https://example.com/credentials/cyber-intro",
    skillIds: ["s-netsec", "s-owasp"],
    verification: "Credential linked",
    fileName: "",
    fileType: "",
    fileData: "",
    notes: "Sample record. Replace with your real certificate.",
  },
  {
    id: "c-rwd",
    title: "Responsive Web Design (sample)",
    issuer: "Demo Web Institute",
    issueDate: "2024-08-30",
    credentialUrl: "https://example.com/credentials/rwd",
    skillIds: ["s-tw", "s-react"],
    verification: "Issuer-checked",
    fileName: "",
    fileType: "",
    fileData: "",
    notes: "Sample record marked as checked against the issuer's public record.",
  },
  {
    id: "c-sql",
    title: "Relational Databases Fundamentals (sample)",
    issuer: "Demo Data School",
    issueDate: "2025-06-05",
    credentialUrl: "",
    skillIds: ["s-sql", "s-pg"],
    verification: "Unverified",
    fileName: "",
    fileType: "",
    fileData: "",
    notes: "No credential link yet. Add one, then check it against the issuer.",
  },
];

const evidence: Evidence[] = [
  { id: "e-1", title: "Campus Marketplace repository", type: "GitHub Repository", skillId: "s-react", url: "https://github.com/demo-user/campus-marketplace", description: "Component library and hooks used across listing pages.", dateAdded: "2025-06-01" },
  { id: "e-2", title: "Campus Marketplace live demo", type: "Live Project", skillId: "s-node", url: "https://example.com/campus-marketplace", description: "Hosted demo with seeded data.", dateAdded: "2025-06-10" },
  { id: "e-3", title: "Packet Analysis Lab worksheets", type: "Practical Work", skillId: "s-wire", url: "", description: "Worksheets with step-by-step traffic analysis.", dateAdded: "2025-04-02" },
  { id: "e-4", title: "Checkout research synthesis", type: "Documentation", skillId: "s-research", url: "https://example.com/docs/checkout-research", description: "Synthesis of 12 sessions with prioritised findings.", dateAdded: "2025-05-28" },
  { id: "e-5", title: "Orbit Planner walkthrough", type: "Demo Video", skillId: "s-three", url: "https://example.com/videos/orbit-planner", description: "Three-minute walkthrough of scene rendering and camera transitions.", dateAdded: "2025-10-15" },
  { id: "e-6", title: "Secure Notes ZAP report", type: "Documentation", skillId: "s-owasp", url: "", description: "Summary of scan results and the fixes applied.", dateAdded: "2025-11-02" },
  { id: "e-7", title: "Secure Notes schema & migrations", type: "GitHub Repository", skillId: "s-pg", url: "https://github.com/demo-user/secure-notes-api", description: "Schema, migrations and seed scripts.", dateAdded: "2025-10-20" },
];

const achievements: Achievement[] = [
  { id: "a-1", title: "Hackathon finalist — CampusHack 2025", date: "2025-04-12", description: "Top 5 of 60 teams with the Campus Marketplace prototype." },
  { id: "a-2", title: "Dean's List", date: "2025-01-20", description: "Recognised for academic excellence in the autumn term." },
  { id: "a-3", title: "Open-source contributor", date: "2025-08-03", description: "Merged accessibility and documentation fixes into a charting library." },
];

export const sampleData: AppData = {
  version: 1,
  profile: DEMO_PROFILE,
  skills,
  projects,
  certificates,
  evidence,
  achievements,
  theme: "midnight",
};
