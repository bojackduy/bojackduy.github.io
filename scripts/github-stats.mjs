// Generates self-hosted GitHub stats for the portfolio.
// Reads live data through `gh-personal` and writes:
//   public/img/github-stats.svg   — overview card (avatar, totals, top languages)
//   public/markdown/github-stats.md — Bear note embedding the card + tables
// Refresh with: npm run stats
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOGIN = "bojackduy";

const LANG_COLORS = {
  TypeScript: "#3178c6",
  Rust: "#dea584",
  Python: "#3572A5",
  Kotlin: "#A97BFF",
  Lua: "#51a0cf",
  Shell: "#89e051",
  JavaScript: "#f1e05a",
  Dockerfile: "#384d54",
  CSS: "#563d7c",
  HTML: "#e34c26",
  C: "#555555",
  "C++": "#f34b7d",
  Java: "#b07219",
  Go: "#00ADD8",
  Swift: "#F05138",
  Vue: "#41b883"
};
const FALLBACK_COLOR = "#8b949e";

function gh(args, json = true) {
  const out = execFileSync("gh-personal", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return json ? JSON.parse(out) : out;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const user = gh(["api", "user", "--jq", "{login:.login,name:.name,followers:.followers,following:.following,public_repos:.public_repos}"]);
const repos = gh(["api", `users/${LOGIN}/repos`, "--paginate", "--jq", "[.[] | {name:.name,description:.description,stars:.stargazers_count,forks:.forks_count,language:.language,fork:.fork,url:.html_url,pushed:.pushed_at}]"]);

const owned = repos.filter((r) => !r.fork);
const totalStars = owned.reduce((n, r) => n + r.stars, 0);
const totalForks = owned.reduce((n, r) => n + r.forks, 0);

const langBytes = {};
for (const r of owned) {
  try {
    const langs = gh(["api", `repos/${LOGIN}/${r.name}/languages`]);
    for (const [lang, bytes] of Object.entries(langs)) {
      langBytes[lang] = (langBytes[lang] ?? 0) + bytes;
    }
  } catch {
    // Repo with no detectable language (or transient error) — skip it.
  }
}
const totalBytes = Object.values(langBytes).reduce((n, b) => n + b, 0);
const topLangs = Object.entries(langBytes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([lang, bytes]) => ({ lang, pct: totalBytes ? (bytes / totalBytes) * 100 : 0 }));

let contributions = null;
try {
  const q = `{ user(login: "${LOGIN}") { contributionsCollection { contributionCalendar { totalContributions } totalCommitContributions totalPullRequestContributions totalIssueContributions } } }`;
  const data = gh(["api", "graphql", "-f", `query=${q}`, "--jq", ".data.user.contributionsCollection"]);
  contributions = data.contributionCalendar.totalContributions;
} catch {
  contributions = null;
}

let avatarDataUri = "";
try {
  const buf = execFileSync("curl", ["-sL", "--fail", "--max-time", "30", `https://avatars.githubusercontent.com/u/71258707?s=96&v=4`], { maxBuffer: 4 * 1024 * 1024 });
  if (buf.length > 0 && buf.length < 60 * 1024) {
    const mime = buf[0] === 0xff && buf[1] === 0xd8 ? "image/jpeg" : buf[0] === 0x89 ? "image/png" : "";
    if (mime) avatarDataUri = `data:${mime};base64,${buf.toString("base64")}`;
  }
} catch {
  avatarDataUri = "";
}

const date = new Date().toISOString().slice(0, 10);
const fmt = (n) => (n ?? 0).toLocaleString("en-US");

const stats = [
  { label: "Public repos", value: fmt(user.public_repos) },
  { label: "Total stars", value: fmt(totalStars) },
  { label: "Followers", value: fmt(user.followers) },
  { label: contributions === null ? "Contributions" : "Contributions / yr", value: contributions === null ? "—" : fmt(contributions) }
];

const barX = 210;
const barW = 400;
const langRows = topLangs
  .map((l, i) => {
    const y = 252 + i * 30;
    const w = Math.max(3, (l.pct / 100) * barW);
    const color = LANG_COLORS[l.lang] ?? FALLBACK_COLOR;
    return (
      `  <text x="36" y="${y + 5}" font-size="14" fill="#c9d1d9">${esc(l.lang)}</text>` +
      `  <rect x="${barX}" y="${y - 8}" width="${barW}" height="12" rx="6" fill="#21262d"/>` +
      `  <rect x="${barX}" y="${y - 8}" width="${w.toFixed(1)}" height="12" rx="6" fill="${color}"/>` +
      `  <text x="${barX + barW + 12}" y="${y + 5}" font-size="14" fill="#8b949e">${l.pct.toFixed(1)}%</text>`
    );
  })
  .join("\n");

const statCols = stats
  .map((s, i) => {
    const x = 36 + i * 190;
    return (
      `  <text x="${x}" y="196" font-size="30" font-weight="700" fill="#ffffff">${esc(s.value)}</text>` +
      `  <text x="${x}" y="220" font-size="14" fill="#8b949e">${esc(s.label)}</text>`
    );
  })
  .join("\n");

const avatar = avatarDataUri
  ? `  <clipPath id="avatarClip"><circle cx="74" cy="82" r="38"/></clipPath>\n  <image href="${avatarDataUri}" x="36" y="44" width="76" height="76" clip-path="url(#avatarClip)"/>`
  : `  <circle cx="74" cy="82" r="38" fill="#21262d"/>\n  <text x="74" y="94" text-anchor="middle" font-size="34" fill="#8b949e">@</text>`;

const cardH = 240 + topLangs.length * 30 + 44;
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${cardH}" viewBox="0 0 800 ${cardH}" font-family="system-ui, -apple-system, sans-serif">\n` +
  `  <rect x="1" y="1" width="798" height="${cardH - 2}" rx="16" fill="#0d1117" stroke="#30363d" stroke-width="2"/>\n` +
  `${avatar}\n` +
  `  <text x="132" y="76" font-size="28" font-weight="700" fill="#ffffff">${esc(user.login)}</text>\n` +
  `  <text x="132" y="102" font-size="14" fill="#8b949e">GitHub stats · updated ${date}</text>\n` +
  `${statCols}\n${langRows}\n` +
  `  <text x="36" y="${cardH - 18}" font-size="13" fill="#58a6ff">github.com/${esc(user.login)}</text>\n` +
  `</svg>\n`;

mkdirSync(join(ROOT, "public/img"), { recursive: true });
writeFileSync(join(ROOT, "public/img/github-stats.svg"), svg);

const topRepos = [...owned].sort((a, b) => b.stars - a.stars).slice(0, 8);
const repoRows = topRepos
  .map((r) => `| [${r.name}](${r.url}) | ${esc(r.description ?? "—")} | ${r.stars} | ${r.forks} | ${esc(r.language ?? "—")} |`)
  .join("\n");
const langTable = topLangs.map((l) => `| ${l.lang} | ${l.pct.toFixed(1)}% |`).join("\n");

const md =
  `# GitHub Stats\n\n` +
  `![GitHub statistics card](/img/github-stats.svg)\n\n` +
  `*Snapshot of [github.com/${user.login}](https://github.com/${user.login}) on ${date} — ${fmt(user.public_repos)} public repos, ${fmt(totalStars)} stars earned, ${fmt(user.following)} following. Refresh with \`npm run stats\`.*\n\n` +
  `## Most starred\n\n` +
  `| Project | What it is | ★ | Forks | Language |\n|---|---|---:|---:|---|\n${repoRows}\n\n` +
  `## Top languages\n\n` +
  `| Language | Share |\n|---|---:|\n${langTable}\n`;

writeFileSync(join(ROOT, "public/markdown/github-stats.md"), md);

console.log(`repos=${user.public_repos} stars=${totalStars} forks=${totalForks} followers=${user.followers} contributions=${contributions} langs=${topLangs.map((l) => `${l.lang} ${l.pct.toFixed(0)}%`).join(", ")}`);
