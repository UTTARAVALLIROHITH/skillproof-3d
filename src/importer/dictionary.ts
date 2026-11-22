import type { SkillCategory } from "../types";

/** Curated skill vocabulary. Matching is whole-token and case-insensitive except for ambiguous names. */
const RAW: [SkillCategory, string[]][] = [
  ["Programming", ["JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "Dart", "R", "Scala", "MATLAB"]],
  ["Frontend", ["React", "Vue.js", "Angular", "Svelte", "Next.js", "HTML", "CSS", "Tailwind CSS", "Sass", "Redux", "Three.js", "WebGL", "Vite", "Bootstrap", "Webpack"]],
  ["Backend", ["Node.js", "Express", "Django", "Flask", "FastAPI", "Spring", "Laravel", "Ruby on Rails", "GraphQL", "REST APIs", ".NET", "NestJS"]],
  ["Database", ["SQL", "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Firebase", "Supabase", "Oracle", "DynamoDB"]],
  ["Cybersecurity", ["OWASP", "Penetration Testing", "Cryptography", "Threat Modeling", "Burp Suite", "Kali Linux", "SIEM", "Metasploit", "Incident Response", "Nmap"]],
  ["Networking", ["TCP/IP", "DNS", "Routing", "Subnetting", "VLAN", "Cisco", "Wireshark", "Firewalls", "BGP"]],
  ["Cloud", ["AWS", "Azure", "Google Cloud", "Kubernetes", "Terraform", "Serverless", "Cloudflare", "Vercel", "Netlify"]],
  ["UI/UX Design", ["Figma", "UI Design", "UX Research", "Accessibility", "Adobe Photoshop", "Adobe Illustrator", "Sketch", "Prototyping", "Wireframing", "Typography"]],
  ["Tools & Technologies", ["Git", "GitHub", "GitLab", "Docker", "Linux", "Jira", "Postman", "VS Code", "CI/CD", "Jenkins", "GitHub Actions", "npm"]],
  ["Other", ["Machine Learning", "Data Analysis", "TensorFlow", "PyTorch", "Pandas", "NumPy", "scikit-learn", "Excel", "Project Management", "Unity", "Blockchain"]],
];

/** Short names that are common English words or letters: match only with exact case. */
const CASE_SENSITIVE = new Set(["C", "R", "Go", "Dart"]);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MATCHERS = RAW.flatMap(([category, names]) =>
  names.map((name) => ({
    name,
    category,
    re: new RegExp(`(?<![A-Za-z0-9+#.])${escapeRe(name)}(?![A-Za-z0-9+#])`, CASE_SENSITIVE.has(name) ? "" : "i"),
  }))
);

export function categoryFor(name: string): SkillCategory {
  const lower = name.trim().toLowerCase();
  return MATCHERS.find((m) => m.name.toLowerCase() === lower)?.category ?? "Other";
}

export function detectSkills(text: string, max = 60): { name: string; category: SkillCategory }[] {
  const found: { name: string; category: SkillCategory }[] = [];
  for (const m of MATCHERS) {
    if (found.length >= max) break;
    if (m.re.test(text)) found.push({ name: m.name, category: m.category });
  }
  return found;
}
