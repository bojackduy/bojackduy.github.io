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

// NOTE: use the public users/:login endpoint, not /user — the latter 403s for
// GitHub Actions' integration token, which this script also runs with in CI.
const user = gh(["api", `users/${LOGIN}`, "--jq", "{login:.login,name:.name,followers:.followers,following:.following,public_repos:.public_repos}"]);
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

// ---- npm downloads (registry search + downloads API, no auth needed) ----
const NPM_USER = "bojackduy";
let npmRows = [];
let npmMonthTotal = 0, npmAllTotal = 0;
let npmTrend = new Array(12).fill(0);
let npmTrendLabels = [];
try {
  const search = JSON.parse(
    execFileSync("curl", ["-sL", "--fail", "--max-time", "30", `https://registry.npmjs.org/-/v1/search?text=maintainer:${NPM_USER}&size=100`], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 })
  );
  const names = [...new Set(search.objects.map((o) => o.package.name))];
  // 12 buckets of 30 days ending today (labels = bucket-end month).
  const endD = new Date(date + "T00:00:00Z");
  const iso = (d) => d.toISOString().slice(0, 10);
  const rangeStr = `${iso(new Date(endD.getTime() - 359 * 864e5))}:${iso(endD)}`;
  const per = [];
  for (const name of names) {
    try {
      const r = JSON.parse(execFileSync("curl", ["-sL", "--fail", "--max-time", "60", `https://api.npmjs.org/downloads/range/${rangeStr}/${encodeURIComponent(name)}`], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }));
      const t = JSON.parse(execFileSync("curl", ["-sL", "--fail", "--max-time", "30", `https://api.npmjs.org/downloads/point/2015-01-01:${date}/${encodeURIComponent(name)}`], { encoding: "utf8" }));
      const byDay = new Map((r.downloads || []).map((d) => [d.day, d.downloads || 0]));
      const buckets = [];
      for (let b = 11; b >= 0; b--) {
        const endB = new Date(endD.getTime() - b * 30 * 864e5);
        let s = 0;
        for (let k = 0; k < 30; k++) s += byDay.get(iso(new Date(endB.getTime() - k * 864e5))) || 0;
        buckets.push(s);
      }
      per.push({ name, month: buckets[11], total: t.downloads || 0, buckets });
    } catch {
      // Transient per-package error — skip it this run.
    }
  }
  // Fold tetris-io platform binaries into the parent package.
  const grouped = new Map();
  for (const p of per) {
    const key = p.name.startsWith("@bojackduy/tetris-io") ? "@bojackduy/tetris-io" : p.name;
    let g = grouped.get(key);
    if (!g) { g = { name: key, month: 0, total: 0, buckets: new Array(12).fill(0) }; grouped.set(key, g); }
    g.month += p.month; g.total += p.total;
    p.buckets.forEach((v, i) => { g.buckets[i] += v; });
  }
  npmRows = [...grouped.values()]
    .map((g) => ({ ...g, short: g.name.replace("@bojackduy/", "") }))
    .sort((a, b) => b.month - a.month);
  npmMonthTotal = npmRows.reduce((n, r) => n + r.month, 0);
  npmAllTotal = npmRows.reduce((n, r) => n + r.total, 0);
  npmTrendLabels = [];
  for (let b = 11; b >= 0; b--) npmTrendLabels.push(new Date(endD.getTime() - b * 30 * 864e5).toLocaleString("en-US", { month: "short", timeZone: "UTC" }));
} catch {
  npmRows = [];
}

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

// Top languages — hand-drawn donut
const langTitleY = heatY0 + 7 * pitch + 56;
const langTitle = `<text x="52" y="${langTitleY}" font-size="29" fill="${CHALK}">top languages</text>` + squiggle(52, langTitleY + 10, 150, BLUE, 2.5);
const donutCx = 210, donutCy = langTitleY + 160, donutR = 92;
const rad = (deg) => (deg * Math.PI) / 180;
// Point at t degrees clockwise from 12 o'clock (screen coords, y down).
const dpt = (cx, cy, r, t) => [cx + r * Math.sin(rad(t)), cy - r * Math.cos(rad(t))];
let donutAcc = 0;
const donutSegs = topLangs
  .map((l) => {
    const frac = l.pct / 100;
    const color = LANG_COLORS[l.lang] ?? FALLBACK_COLOR;
    const GAP = 2; // degrees of breathing room on each side
    const a0 = donutAcc * 360 + GAP, a1 = (donutAcc + frac) * 360 - GAP;
    const ccx = donutCx + j(1.5), ccy = donutCy + j(1.5), rr = donutR + j(1);
    let seg;
    if (a1 > a0) {
      const [x0, y0] = dpt(ccx, ccy, rr, a0);
      const [x1, y1] = dpt(ccx, ccy, rr, a1);
      const large = frac * 360 - GAP * 2 > 180 ? 1 : 0;
      seg = `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${rr.toFixed(1)} ${rr.toFixed(1)} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${color}" stroke-width="30" stroke-linecap="round"/>`;
    } else {
      // Sliver too small for an arc — a dot at its midpoint instead.
      const [dx, dy] = dpt(ccx, ccy, rr, (donutAcc + frac / 2) * 360);
      seg = `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="9" fill="${color}"/>`;
    }
    donutAcc += frac;
    return seg;
  })
  .join("\n  ");
const langLegend = topLangs
  .map((l, i) => {
    const ly = langTitleY + 66 + i * 37;
    const color = LANG_COLORS[l.lang] ?? FALLBACK_COLOR;
    return `<rect x="392" y="${ly - 14}" width="17" height="17" rx="5" fill="${color}" transform="rotate(${j(3).toFixed(1)} 400 ${ly - 5})"/>` +
      `<text x="420" y="${ly + 2}" font-size="24" fill="${CHALK}">${esc(l.lang)}</text>` +
      `<text x="700" y="${ly + 2}" font-size="24" fill="${DIM}">${l.pct.toFixed(1)}%</text>`;
  })
  .join("\n  ");
const langBottom = langTitleY + 66 + (topLangs.length - 1) * 37 + 30;

// npm downloads — hand-drawn trend lines, star-history style
function niceCeil(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}
let npmSection = "";
let npmBottom = langBottom;
if (npmRows.length > 0) {
  const TREND_COLORS = [BLUE, "#3fb950", "#a371f7"];
  const trendTop = npmRows.slice(0, 3);
  npmTrend = npmRows.reduce((acc, r) => acc.map((v, i) => v + r.buckets[i]), new Array(12).fill(0));
  const tMax = niceCeil(Math.max(...npmTrend, 1));
  const tX0 = 84, tX1 = 852, tH = 190;
  const tY1 = langBottom + 326, tY0 = tY1 - tH;
  const tx = (i) => tX0 + (i * (tX1 - tX0)) / 11;
  const ty = (v) => tY1 - (v / tMax) * tH;
  const lineFor = (vals, color, width, dots) => {
    let s = `<path d="${vals.map((v, i) => `${i === 0 ? "M" : "L"} ${tx(i).toFixed(1)} ${ty(v).toFixed(1)}`).join(" ")}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (dots) s += vals.map((v, i) => `<circle cx="${tx(i).toFixed(1)}" cy="${ty(v).toFixed(1)}" r="4" fill="${color}"/>`).join("");
    return s;
  };
  const tGrid = [0.25, 0.5, 0.75]
    .map((fr) => {
      const gy = tY1 - fr * tH;
      return `<line x1="${tX0}" y1="${gy.toFixed(1)}" x2="${tX1}" y2="${(gy + j(1.5)).toFixed(1)}" stroke="#3a3f47" stroke-width="1.5" stroke-dasharray="6 6"/>` +
        `<text x="${tX0 - 10}" y="${(gy + 6).toFixed(1)}" text-anchor="end" font-size="18" fill="${DIM}">${fmt(Math.round(tMax * fr))}</text>`;
    })
    .join("\n  ");
  const tAxes = `<path d="M ${tX0} ${(tY0 - 8).toFixed(1)} Q ${(tX0 + j(3)).toFixed(1)} ${((tY0 + tY1) / 2).toFixed(1)} ${tX0} ${tY1} L ${(tX1 + 6).toFixed(1)} ${(tY1 + j(2)).toFixed(1)}" fill="none" stroke="${CHALK}" stroke-width="2.5" stroke-linecap="round"/>`;
  const tXLabels = npmTrendLabels
    .map((m, i) => (i % 2 === 0 ? `<text x="${tx(i).toFixed(1)}" y="${tY1 + 26}" text-anchor="middle" font-size="18" fill="${DIM}">${m}</text>` : ""))
    .filter(Boolean)
    .join("\n  ");
  const trendLines = lineFor(npmTrend, ACCENT, 4.5, true) + "\n  " +
    trendTop.map((r, i) => lineFor(r.buckets, TREND_COLORS[i % TREND_COLORS.length], 2.5, false)).join("\n  ");
  let legX = 84, legY = tY1 + 58;
  const trendLegend = [{ label: "all", color: ACCENT, width: 4 }, ...trendTop.map((r, i) => ({ label: `${r.short} · ${fmt(r.month)}/mo`, color: TREND_COLORS[i % TREND_COLORS.length], width: 2.5 }))]
    .map((e) => {
      const w = e.label.length * 8.5 + 52;
      if (legX + w > 860) { legX = 84; legY += 30; }
      const s = `<line x1="${legX}" y1="${legY}" x2="${legX + 34}" y2="${(legY + j(1)).toFixed(1)}" stroke="${e.color}" stroke-width="${e.width}" stroke-linecap="round"/>` +
        `<text x="${legX + 42}" y="${legY + 7}" font-size="20" fill="${CHALK}">${esc(e.label)}</text>`;
      legX += w + 18;
      return s;
    })
    .join("\n  ");
  const npmTitleY = langBottom + 64;
  npmSection =
    `<text x="52" y="${npmTitleY}" font-size="29" fill="${CHALK}">npm downloads - last 12 mo · ${fmt(npmMonthTotal)}/mo · ${fmt(npmAllTotal)} all-time</text>` + squiggle(52, npmTitleY + 10, 300, ACCENT, 2.5) + "\n  " +
    tGrid + "\n  " + tAxes + "\n  " + tXLabels + "\n  " + trendLines + "\n  " + trendLegend;
  npmBottom = legY + 40;
}

const footerY = npmBottom + 52;
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
  `  ${donutSegs}\n` +
  `  ${langLegend}\n` +
  `  ${npmSection}\n` +
  `  ${footer}\n` +
  `</svg>\n`;

mkdirSync(join(ROOT, "public/img"), { recursive: true });
writeFileSync(join(ROOT, "public/img/github-stats.svg"), svg);

// Star-history chart: live-rendered by star-history.com on every view (xkcd
// hand-drawn style). The repo list below is rebuilt from live data on each
// refresh, so new repos join the chart automatically.
const starRepos = [...owned].sort((a, b) => b.stars - a.stars).map((r) => `${LOGIN}/${r.name}`);
const starParam = starRepos.map((r) => encodeURIComponent(r)).join("%2C");
const starChartUrl = `https://api.star-history.com/svg?repos=${starParam}&type=Date`;
const starPageUrl = `https://star-history.com/#${starRepos.join("&")}&Date`;
const starEmbed =
  `[![Star history across all ${owned.length} repos](${starChartUrl})](${starPageUrl})\n`;

const badgesRow =
  `[![GitHub followers](https://img.shields.io/github/followers/${LOGIN}?style=for-the-badge&color=00bfff&label=Followers)](https://github.com/${LOGIN}?tab=followers) ` +
  `![Profile views](https://komarev.com/ghpvc/?username=${LOGIN}&style=for-the-badge&color=00bfff&labelColor=0d1117&label=Profile+Views)\n`;

const md =
  `# GitHub Stats\n\n` +
  `![GitHub statistics card](/img/github-stats.svg)\n\n` +
  starEmbed + `\n` +
  badgesRow + `\n` +
  `*Snapshot of [github.com/${user.login}](https://github.com/${user.login}) on ${date} — ${fmt(user.public_repos)} public repos, ${fmt(totalStars)} stars earned, ${fmt(npmAllTotal)} npm downloads. Star chart is live, re-rendered by star-history.com on every view. Refresh with \`npm run stats\`.*\n`;

writeFileSync(join(ROOT, "public/markdown/github-stats.md"), md);

// Full profile README for the bojackduy/bojackduy repo — kept in sync by the
// monthly refresh-stats workflows (see .github/workflows in both repos).
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
  `![GitHub statistics card](https://bojackduy.github.io/img/github-stats.svg)\n\n` +
  starEmbed + `\n` +
  `*Snapshot of this profile on ${date} — ${fmt(user.public_repos)} public repos, ${fmt(totalStars)} stars earned, ${fmt(npmAllTotal)} npm downloads. Star chart is live, re-rendered by star-history.com on every view.*\n\n` +
  `<div align="center">\n` +
  `  <br>\n` +
  `  <img src="${streakUrl}" alt="GitHub Streak" height="200px"/>\n` +
  `</div>\n\n` +
  `---\n\n` +
  `*Stats are generated from live GitHub data — refresh flow documented in [bojackduy.github.io](https://github.com/bojackduy/bojackduy.github.io).*\n\n` +
  `<img width="100%" src="${capsuleFooter}" alt="footer"/>\n`;

mkdirSync(join(ROOT, "stats-output"), { recursive: true });
writeFileSync(join(ROOT, "stats-output/profile-README.md"), profileMd);

console.log(`repos=${user.public_repos} stars=${totalStars} forks=${totalForks} followers=${user.followers} contributions=${calendar.total} heat_weeks=${calendar.weeks.length} langs=${topLangs.map((l) => `${l.lang} ${l.pct.toFixed(0)}%`).join(", ")} npm_month=${npmMonthTotal} npm_total=${npmAllTotal}`);
