// Generates the stats snapshots for the portfolio + profile README.
// Reads live data through `gh-personal` and writes:
//   public/markdown/github-stats.md — Bear note (live star chart, live npm
//                                     badges, manual snapshot line)
//   stats-output/profile-README.md  — full profile README for bojackduy/bojackduy
// No pre-rendered image: npm totals are live shields badges and the star
// chart is live from star-history.com, so no scheduled refresh is needed.
// Refresh with: npm run stats
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOGIN = "bojackduy";

// ---------------------------------------------------------------- data ------

// `gh-personal` locally; plain `gh` in CI (GH_TOKEN provides auth there).
const GH = process.env.GH_CMD || "gh-personal";

function gh(args, json = true) {
  const out = execFileSync(GH, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return json ? JSON.parse(out) : out;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// NOTE: use the public users/:login endpoint, not /user — the latter 403s for
// GitHub Actions' integration token, which this script also runs with in CI.
const user = gh(["api", `users/${LOGIN}`, "--jq", "{login:.login,name:.name,followers:.followers,following:.following,public_repos:.public_repos}"]);
const repos = gh(["api", `users/${LOGIN}/repos`, "--paginate", "--jq", "[.[] | {name:.name,description:.description,stars:.stargazers_count,forks:.forks_count,language:.language,fork:.fork,url:.html_url,pushed:.pushed_at}]"]);

const owned = repos.filter((r) => !r.fork);
const totalStars = owned.reduce((n, r) => n + r.stars, 0);
const totalForks = owned.reduce((n, r) => n + r.forks, 0);

let contributions = null;
try {
  const q = `{ user(login: "${LOGIN}") { contributionsCollection { contributionCalendar { totalContributions } } } }`;
  const data = gh(["api", "graphql", "-f", `query=${q}`, "--jq", ".data.user.contributionsCollection.contributionCalendar"]);
  contributions = data.totalContributions;
} catch {
  contributions = null;
}

const date = new Date().toISOString().slice(0, 10);
const fmt = (n) => (n ?? 0).toLocaleString("en-US");

// ---- npm downloads (registry search + downloads API, no auth needed) ----
const NPM_USER = "bojackduy";
let npmRows = [];
let npmAllTotal = 0;
try {
  const search = JSON.parse(
    execFileSync("curl", ["-sL", "--fail", "--max-time", "30", `https://registry.npmjs.org/-/v1/search?text=maintainer:${NPM_USER}&size=100`], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 })
  );
  const names = [...new Set(search.objects.map((o) => o.package.name))];
  // The downloads API wants scoped names in `@scope/pkg` form — a fully
  // encoded `%40scope%2Fpkg` misbehaves, so only escape other characters.
  const npmName = (n) => n.split("/").map((s) => encodeURIComponent(s).replace(/%40/g, "@")).join("/");
  // All-time total per package via the point API; last-month total only to
  // rank the live badges, never displayed.
  const ALL_TIME_START = "2020-01-01";
  const per = [];
  for (const name of names) {
    try {
      const m = JSON.parse(execFileSync("curl", ["-sL", "--fail", "--max-time", "30", `https://api.npmjs.org/downloads/point/last-month/${npmName(name)}`], { encoding: "utf8" }));
      const t = JSON.parse(execFileSync("curl", ["-sL", "--fail", "--max-time", "30", `https://api.npmjs.org/downloads/point/${ALL_TIME_START}:${date}/${npmName(name)}`], { encoding: "utf8" }));
      per.push({ name, month: m.downloads || 0, total: t.downloads || 0 });
    } catch {
      // Transient per-package error — skip it this run.
    }
  }
  // Fold tetris-io platform binaries into the parent package.
  const grouped = new Map();
  for (const p of per) {
    const key = p.name.startsWith("@bojackduy/tetris-io") ? "@bojackduy/tetris-io" : p.name;
    let g = grouped.get(key);
    if (!g) { g = { name: key, month: 0, total: 0 }; grouped.set(key, g); }
    g.month += p.month; g.total += p.total;
  }
  npmRows = [...grouped.values()]
    .map((g) => ({ ...g, short: g.name.replace("@bojackduy/", "") }))
    .sort((a, b) => b.month - a.month);
  npmAllTotal = npmRows.reduce((n, r) => n + r.total, 0);
} catch {
  npmRows = [];
}

// ------------------------------------------------------- live visuals --------

// Star-history chart: live-rendered by star-history.com on every view. The
// repo list below is rebuilt from live data on each refresh, so new repos
// join the chart automatically.
const starRepos = [...owned].sort((a, b) => b.stars - a.stars).map((r) => `${LOGIN}/${r.name}`);
const starParam = starRepos.map((r) => encodeURIComponent(r)).join("%2C");
const starChartUrl = `https://api.star-history.com/svg?repos=${starParam}&type=Date`;
const starPageUrl = `https://star-history.com/#${starRepos.join("&")}&Date`;
const starEmbed =
  `[![Star history across all ${owned.length} repos](${starChartUrl})](${starPageUrl})\n`;

const badgesRow =
  `[![GitHub followers](https://img.shields.io/github/followers/${LOGIN}?style=for-the-badge&color=00bfff&label=Followers)](https://github.com/${LOGIN}?tab=followers) ` +
  `![Profile views](https://komarev.com/ghpvc/?username=${LOGIN}&style=for-the-badge&color=00bfff&labelColor=0d1117&label=Profile+Views)\n`;

// Live per-package all-time download badges: shields queries the npm API on
// every view, so these stay fresh with zero scheduled runs. The summed total
// in the snapshot lines below remains a manual snapshot. Top 3 by last-month
// downloads, so newly published packages rotate in automatically.
const npmLiveBadges = npmRows.slice(0, 3)
  .map((r) => `[![${esc(r.short)} total downloads](https://img.shields.io/npm/dt/${r.name}?label=${encodeURIComponent(`${r.short} downloads`)}&color=00bfff)](https://www.npmjs.com/package/${r.name})`)
  .join(" ");
const npmLiveLine = npmLiveBadges ? npmLiveBadges + `\n\n` : "";

const contribLine = contributions === null ? "" : `, ${fmt(contributions)} contributions in the last year`;

const md =
  `# GitHub Stats\n\n` +
  starEmbed + `\n` +
  npmLiveLine +
  badgesRow + `\n` +
  `*Snapshot of [github.com/${user.login}](https://github.com/${user.login}) on ${date} — ${fmt(user.public_repos)} public repos, ${fmt(totalStars)} stars earned${contribLine}, ${fmt(npmAllTotal)} npm downloads all-time. Totals are a manual snapshot (\`npm run stats\`); npm badges and star chart above are live on every view.*\n`;

writeFileSync(join(ROOT, "public/markdown/github-stats.md"), md);

// Full profile README for the bojackduy/bojackduy repo — synced by the
// manual-only refresh-stats workflows (see .github/workflows in both repos).
const capsuleHeader = "https://capsule-render.vercel.app/api?type=waving&height=280&color=0:1e90ff,100:00bfff&text=Hi,%20I%27m%20Bojack&fontColor=ffffff&desc=Backend%20%E2%80%A2%20AI%20Tooling%20%E2%80%A2%20Open%20Source&descAlign=50&fontAlign=50&fontAlignY=40";
const capsuleFooter = "https://capsule-render.vercel.app/api?type=waving&color=0:1e90ff,100:00bfff&height=120&section=footer";
const streakUrl = `https://streak-stats.demolab.com/?user=${LOGIN}&theme=transparent&ring=00bfff&fire=00bfff&currStreakLabel=00bfff`;

const profileMd =
  `<p align="center">\n` +
  `  <img src="${capsuleHeader}" width="100%" alt="header"/>\n` +
  `</p>\n\n` +
  `# Hi, I'm Trinh Chan Duy 👋\n\n` +
  `Backend software engineer and open-source developer working across production systems, AI-enabled products, and developer tooling.\n\n` +
  `<div align="center">\n\n` +
  badgesRow + `\n` +
  `</div>\n\n` +
  `---\n\n` +
  `<h2 align="center">👨‍💻 About Me</h2>\n\n` +
  `| | | |\n|---|---|---|\n` +
  `| 💭 | **Exploring** | Local-first AI tooling |\n` +
  `| 🚀 | **Working on** | [OpenCode plugins](https://github.com/${LOGIN}/opencode-loopd) |\n` +
  `| 🤝 | **Collaborating on** | Open-source AI tooling |\n` +
  `| 📬 | **Contact** | [trinhchanduy.30072005@gmail.com](mailto:trinhchanduy.30072005@gmail.com) |\n` +
  `| 🌐 | **Portfolio** | [bojackduy.github.io](https://bojackduy.github.io) |\n` +
  `| 🎓 | **Studying** | Honors CS @ VNU-HCM |\n\n` +
  `---\n\n` +
  `## GitHub stats\n\n` +
  starEmbed + `\n` +
  npmLiveLine +
  `*Snapshot of this profile on ${date} — ${fmt(user.public_repos)} public repos, ${fmt(totalStars)} stars earned${contribLine}, ${fmt(npmAllTotal)} npm downloads all-time. Totals are a manual snapshot; npm badges and star chart above are live on every view.*\n\n` +
  `<div align="center">\n` +
  `  <br>\n` +
  `  <img src="${streakUrl}" alt="GitHub Streak" height="200px"/>\n` +
  `</div>\n\n` +
  `---\n\n` +
  `*Totals are a manual snapshot (\`npm run stats\` or manual workflow dispatch); npm badges, star chart, and streak are live. Flow documented in [bojackduy.github.io](https://github.com/bojackduy/bojackduy.github.io).*\n\n` +
  `<img width="100%" src="${capsuleFooter}" alt="footer"/>\n`;

mkdirSync(join(ROOT, "stats-output"), { recursive: true });
writeFileSync(join(ROOT, "stats-output/profile-README.md"), profileMd);

console.log(`repos=${user.public_repos} stars=${totalStars} forks=${totalForks} followers=${user.followers} contributions=${contributions} npm_total=${npmAllTotal}`);
