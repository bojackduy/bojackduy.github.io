// Generates self-hosted GitHub stats for the portfolio.
// Reads live data through `gh-personal` and writes:
//   public/img/github-stats.svg   — hand-drawn chalkboard card (avatar, totals,
//                                   contributions heatmap, top languages)
//   public/markdown/github-stats.md — Bear note embedding the card + tables
// Refresh with: npm run stats
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOGIN = "bojackduy";

// ---------------------------------------------------------------- data ------

const LANG_COLORS = {
  TypeScript: "#3178c6",
  Rust: "#dea584",
  Python: "#3572A5",
  Kotlin: "#A97BFF",
  Lua: "#51a0cf",
  Shell: "#89e051",
  JavaScript: "#f1e05a",
  Dockerfile: "#384d54",
  CSS: "#a371f7",
  HTML: "#e34c26",
  C: "#6e7681",
  "C++": "#f34b7d",
  Java: "#b07219",
  Go: "#00ADD8",
  Swift: "#F05138",
  Vue: "#41b883"
};
const FALLBACK_COLOR = "#8b949e";

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

let calendar = { total: null, weeks: [] };
try {
  const q = `{ user(login: "${LOGIN}") { contributionsCollection { contributionCalendar { totalContributions weeks { firstDay contributionDays { contributionCount date } } } } } }`;
  const data = gh(["api", "graphql", "-f", `query=${q}`, "--jq", ".data.user.contributionsCollection.contributionCalendar"]);
  calendar = { total: data.totalContributions, weeks: data.weeks.slice(-26) };
} catch {
  calendar = { total: null, weeks: [] };
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

let fontFace = "";
try {
  const font = readFileSync(join(ROOT, "scripts/assets/caveat-subset.woff2"));
  fontFace = `@font-face{font-family:'Caveat';font-weight:700;src:url(data:font/woff2;base64,${font.toString("base64")}) format('woff2');}`;
} catch {
  fontFace = "";
}

const date = new Date().toISOString().slice(0, 10);
const fmt = (n) => (n ?? 0).toLocaleString("en-US");

// ------------------------------------------------------- hand-drawn ----------

// Deterministic wobble so re-runs with the same data produce the same card.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260921);
const j = (amt) => (rnd() * 2 - 1) * amt;
const f1 = (n) => n.toFixed(1);

// Wobbly closed frame through jittered corners.
function framePath(x, y, w, h, amp = 2.5) {
  const c = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  let d = `M ${f1(c[0][0] + j(amp))} ${f1(c[0][1] + j(amp))}`;
  for (let i = 0; i < 4; i++) {
    const a = c[i], b = c[(i + 1) % 4];
    d += ` Q ${f1((a[0] + b[0]) / 2 + j(amp * 1.6))} ${f1((a[1] + b[1]) / 2 + j(amp * 1.6))} ${f1(b[0] + j(amp))} ${f1(b[1] + j(amp))}`;
  }
  return d + " Z";
}

// Hand-drawn underline squiggle.
function squiggle(x, y, len, color = "#e3b341", width = 3) {
  let d = `M ${f1(x)} ${f1(y)}`;
  const segs = Math.max(2, Math.round(len / 30));
  const step = len / segs;
  d += ` q 15 ${f1(-7 + j(3))} ${f1(step)} 0`;
  for (let i = 1; i < segs; i++) d += " t 30 0";
  void step;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

// Sketchy five-point star.
function starDoodle(cx, cy, r, color = "#e3b341", width = 2.5) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5 + j(0.06);
    const rad = (i % 2 === 0 ? r : r / 2.4) + j(1.5);
    pts.push(`${f1(cx + rad * Math.cos(ang))} ${f1(cy + rad * Math.sin(ang))}`);
  }
  return `<polyline points="${pts.join(", ")}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// Curvy arrow with a small head.
function arrowDoodle(x1, y1, x2, y2, color = "#8ab4f8", width = 2.5) {
  const mx = (x1 + x2) / 2 + j(8), my = (y1 + y2) / 2 - 14 + j(6);
  const d = `M ${f1(x1)} ${f1(y1)} Q ${f1(mx)} ${f1(my)} ${f1(x2)} ${f1(y2)}`;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const s = 9;
  const h1 = `${f1(x2 - s * Math.cos(ang - 0.45))} ${f1(y2 - s * Math.sin(ang - 0.45))}`;
  const h2 = `${f1(x2 - s * Math.cos(ang + 0.45))} ${f1(y2 - s * Math.sin(ang + 0.45))}`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/><polyline points="${h1}, ${f1(x2)} ${f1(y2)}, ${h2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

// ------------------------------------------------------------- card ----------

const W = 900;
const CHALK = "#f2ede4";
const DIM = "#a8a29e";
const BOARD = "#26282e";
const ACCENT = "#e3b341";
const BLUE = "#8ab4f8";

const stats = [
  { label: "public repos", value: fmt(user.public_repos) },
  { label: "total stars", value: fmt(totalStars) },
  { label: "followers", value: fmt(user.followers) },
  { label: calendar.total === null ? "contributions" : "contributions / yr", value: calendar.total === null ? "--" : fmt(calendar.total) }
];

// Header
const avatarCx = 96, avatarCy = 108, avatarR = 46;
const avatarImg = avatarDataUri
  ? `<clipPath id="avatarClip"><circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}"/></clipPath>` +
    `<image href="${avatarDataUri}" x="${avatarCx - avatarR}" y="${avatarCy - avatarR}" width="${avatarR * 2}" height="${avatarR * 2}" clip-path="url(#avatarClip)"/>`
  : `<circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="#33373f"/><text x="${avatarCx}" y="${avatarCy + 14}" text-anchor="middle" font-size="40" fill="${DIM}">@</text>`;
const header = [
  avatarImg,
  `<circle cx="${f1(avatarCx + j(2))}" cy="${f1(avatarCy + j(2))}" r="${avatarR + 6}" fill="none" stroke="${CHALK}" stroke-width="3"/>`,
  `<circle cx="${f1(avatarCx + j(2))}" cy="${f1(avatarCy + j(2))}" r="${avatarR + 12}" fill="none" stroke="${CHALK}" stroke-width="1.5" opacity="0.55"/>`,
  `<text x="176" y="106" font-size="52" font-weight="700" fill="${CHALK}">${esc(user.login)}</text>`,
  `<text x="178" y="146" font-size="25" fill="${DIM}">github by the numbers - updated ${date}</text>`,
  squiggle(178, 158, 340)
].join("\n");

// Stats row
const statXs = [52, 274, 496, 718];
const statCols = stats
  .map((s, i) => {
    const x = statXs[i];
    return `<text x="${x}" y="252" font-size="56" font-weight="700" fill="${CHALK}">${esc(s.value)}</text>` +
      `<text x="${x + 2}" y="288" font-size="24" fill="${DIM}">${esc(s.label)}</text>`;
  })
  .join("\n");
// Doodles: star by the stars column, scribble around the contributions number.
const scribbleX = statXs[3];
const statDoodles = [
  starDoodle(statXs[1] - 30, 200, 13),
  `<ellipse cx="${scribbleX + 34}" cy="238" rx="52" ry="34" fill="none" stroke="${ACCENT}" stroke-width="2.5" transform="rotate(-4 ${scribbleX + 34} 238)"/>`,
  `<ellipse cx="${scribbleX + 34}" cy="238" rx="58" ry="40" fill="none" stroke="${ACCENT}" stroke-width="1.5" opacity="0.6" transform="rotate(3 ${scribbleX + 34} 238)"/>`
].join("\n");

// Contributions heatmap
const heatLevels = ["#343842", "#0e4429", "#006d32", "#26a641", "#39d353"];
const heatFor = (c) => (c <= 0 ? 0 : c <= 2 ? 1 : c <= 4 ? 2 : c <= 9 ? 3 : 4);
const pitch = 19, cell = 15;
const heatW = calendar.weeks.length * pitch - (pitch - cell);
const heatX0 = Math.round((W - heatW) / 2);
const heatY0 = 392;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let heatCells = "";
const monthLabels = [];
let lastMonth = "", lastLabelX = -100;
calendar.weeks.forEach((wk, wi) => {
  const days = wk.contributionDays ?? [];
  if (days.length > 0) {
    const m = MONTHS[parseInt(days[0].date.slice(5, 7), 10) - 1];
    const lx = heatX0 + wi * pitch;
    if (m !== lastMonth && lx - lastLabelX > 56) {
      monthLabels.push(`<text x="${lx}" y="${heatY0 - 12}" font-size="17" fill="${DIM}">${m}</text>`);
      lastMonth = m; lastLabelX = lx;
    }
  }
  days.forEach((d) => {
    const dt = new Date(d.date + "T00:00:00Z");
    const di = (dt.getUTCDay() + 7) % 7;
    const x = heatX0 + wi * pitch, yy = heatY0 + di * pitch;
    const rot = j(4).toFixed(1);
    heatCells += `<rect x="${x}" y="${yy}" width="${cell}" height="${cell}" rx="4" fill="${heatLevels[heatFor(d.contributionCount)]}" transform="rotate(${rot} ${x + cell / 2} ${yy + cell / 2})}"><title>${esc(d.date)}: ${d.contributionCount}</title></rect>`;
  });
});
const heatTitle = calendar.total === null
  ? `<text x="${W / 2}" y="342" text-anchor="middle" font-size="29" fill="${CHALK}">recent contributions</text>`
  : `<text x="${W / 2}" y="342" text-anchor="middle" font-size="29" fill="${CHALK}">${fmt(calendar.total)} contributions in the last year</text>`;
const heatArrow = arrowDoodle(heatX0 + heatW + 44, heatY0 + 118, heatX0 + heatW + 8, heatY0 + 78);

// Top languages
const langTitleY = heatY0 + 7 * pitch + 56;
const langRows = topLangs
  .map((l, i) => {
    const ly = langTitleY + 30 + i * 38;
    const bw = Math.max(4, (l.pct / 100) * 400);
    const deg = j(0.9).toFixed(2);
    const color = LANG_COLORS[l.lang] ?? FALLBACK_COLOR;
    return `<text x="52" y="${ly + 7}" font-size="24" fill="${CHALK}">${esc(l.lang)}</text>` +
      `<rect x="262" y="${ly - 9}" width="400" height="15" rx="7" fill="#33373f" opacity="0.85" transform="rotate(${deg} 462 ${ly})"/>` +
      `<rect x="262" y="${ly - 9}" width="${bw.toFixed(1)}" height="15" rx="7" fill="${color}" transform="rotate(${deg} 462 ${ly})"/>` +
      `<text x="678" y="${ly + 7}" font-size="24" fill="${DIM}">${l.pct.toFixed(1)}%</text>`;
  })
  .join("\n");
const langTitle = `<text x="52" y="${langTitleY}" font-size="29" fill="${CHALK}">top languages</text>` + squiggle(52, langTitleY + 10, 150, BLUE, 2.5);

const footerY = langTitleY + 30 + (topLangs.length - 1) * 38 + 62;
const footer = `<text x="52" y="${footerY}" font-size="22" fill="${BLUE}">drawn with code - github.com/${esc(user.login)}</text>` +
  starDoodle(W - 70, footerY - 8, 12, DIM, 2);

const cardH = footerY + 34;
const frame = `<path d="${framePath(14, 14, W - 28, cardH - 28, 3)}" fill="none" stroke="${CHALK}" stroke-width="3" stroke-linecap="round"/>` +
  `<path d="${framePath(24, 24, W - 48, cardH - 48, 2)}" fill="none" stroke="${CHALK}" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>`;

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${cardH}" viewBox="0 0 ${W} ${cardH}" font-family="Caveat, 'Segoe Print', 'Bradley Hand', 'Chalkboard SE', cursive">\n` +
  (fontFace ? `<style>${fontFace}</style>\n` : "") +
  `  <rect x="0" y="0" width="${W}" height="${cardH}" rx="18" fill="${BOARD}"/>\n` +
  `  ${frame}\n` +
  `  ${header}\n` +
  `  ${statCols}\n` +
  `  ${statDoodles}\n` +
  `  ${heatTitle}\n` +
  `  ${monthLabels.join("\n  ")}\n` +
  `  ${heatCells}\n` +
  `  ${heatArrow}\n` +
  `  ${langTitle}\n` +
  `  ${langRows}\n` +
  `  ${footer}\n` +
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

// Full profile README for the bojackduy/bojackduy repo — kept in sync by the
// monthly refresh-stats workflows (see .github/workflows in both repos).
const profileMd =
  `# Hi, I'm Trinh Chan Duy 👋\n\n` +
  `Backend software engineer and open-source developer working across production systems, AI-enabled products, and developer tooling.\n\n` +
  `- 🌐 Portfolio: **[bojackduy.github.io](https://bojackduy.github.io)**\n` +
  `- 📧 Contact: [trinhchanduy.30072005@gmail.com](mailto:trinhchanduy.30072005@gmail.com)\n` +
  `- 🎓 Honors Program in Computer Science @ VNU-HCM\n\n` +
  `## GitHub stats\n\n` +
  `![GitHub statistics card](https://bojackduy.github.io/img/github-stats.svg)\n\n` +
  `*Snapshot of this profile on ${date} — ${fmt(user.public_repos)} public repos, ${fmt(totalStars)} stars earned, ${fmt(user.following)} following.*\n\n` +
  `## Most starred\n\n` +
  `| Project | What it is | ★ | Forks | Language |\n|---|---|---:|---:|---|\n${repoRows}\n\n` +
  `## Top languages\n\n` +
  `| Language | Share |\n|---|---:|\n${langTable}\n\n` +
  `*Stats are generated from live GitHub data — refresh flow documented in [bojackduy.github.io](https://github.com/bojackduy/bojackduy.github.io).*\n`;

mkdirSync(join(ROOT, "stats-output"), { recursive: true });
writeFileSync(join(ROOT, "stats-output/profile-README.md"), profileMd);

console.log(`repos=${user.public_repos} stars=${totalStars} forks=${totalForks} followers=${user.followers} contributions=${calendar.total} heat_weeks=${calendar.weeks.length} langs=${topLangs.map((l) => `${l.lang} ${l.pct.toFixed(0)}%`).join(", ")}`);
