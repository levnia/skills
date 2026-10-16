#!/usr/bin/env node
/*
 * render-sheet.js — turn an archetype-scoring JSON into a self-contained HTML
 * "persona build sheet": an inline-SVG radar (overlays 1..N repos) plus
 * per-axis comparison rows, a combined read, and a caveat.
 *
 * WHY this exists: the radar polygon coordinates are fiddly trig that is easy
 * to get wrong by hand, and the output MUST be JS-free inline SVG so it renders
 * in VS Code's HTML preview (a <canvas>+JS chart shows blank there). This script
 * fixes both: correct geometry, zero-JS interactivity (CSS :hover + <title>).
 *
 * Usage:
 *   node render-sheet.js <config.json> <out.html>
 *
 * config.json shape (see references/config.schema.md):
 * {
 *   "title": "同一個人，兩種原型面孔",         // h1 (HTML allowed)
 *   "subtitle": "deploy-toolkit 把你照成…",     // thesis paragraph (HTML allowed)
 *   "prompt": "git log --author=roy … | classify",   // optional terminal-style line
 *   "axes": ["Builder","Maintainer","Sweeper","Prototyper","Grower"],
 *   "repos": [
 *     { "name":"deploy-toolkit", "color":"#E8B04B",
 *       "meta":"159 commits · 2026-02→06<br>feat 59 · fix 26",
 *       "scores": { "Builder":9, "Maintainer":7, "Sweeper":6, "Prototyper":5, "Grower":4 } }
 *   ],
 *   "rows": [        // optional; one card per axis. Omit -> auto-generated bare cards.
 *     { "axis":"Grower", "zh":"市場成長者", "note":"最大反差。…<code>feedback</code>…", "tag":"+3" }
 *   ],
 *   "combined": ["核心是 Builder + Maintainer …", "…"],   // optional bullet list
 *   "caveat": "分數是傾向不是絕對值 …"                      // optional
 * }
 */
'use strict';
const fs = require('fs');

const PALETTE = ['#E8B04B', '#5BC0C7', '#C77DCE', '#83C77D', '#E0915B', '#8FA6FF'];

function die(msg) { console.error('render-sheet: ' + msg); process.exit(1); }

const [, , cfgPath, outPath] = process.argv;
if (!cfgPath || !outPath) die('usage: node render-sheet.js <config.json> <out.html>');

let cfg;
try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); }
catch (e) { die('cannot read/parse config: ' + e.message); }

const axes = cfg.axes || ['Builder', 'Maintainer', 'Sweeper', 'Prototyper', 'Grower'];
const repos = (cfg.repos || []).map((r, i) => ({
  color: r.color || PALETTE[i % PALETTE.length],
  ...r,
}));
if (!repos.length) die('config has no repos');
const n = axes.length;

// ---- geometry -------------------------------------------------------------
const CX = 280, CY = 238, R = 168;
const ang = i => (-90 + i * (360 / n)) * Math.PI / 180;
const pt = (i, r) => [
  +(CX + Math.cos(ang(i)) * r).toFixed(2),
  +(CY + Math.sin(ang(i)) * r).toFixed(2),
];
const polyPts = arr => arr.map(p => p.join(',')).join(' ');

function hexToRgba(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const int = parseInt(m[1], 16);
  return `rgba(${(int >> 16) & 255},${(int >> 8) & 255},${int & 255},${a})`;
}
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- SVG radar ------------------------------------------------------------
function buildSvg() {
  const out = [];
  const aria = repos.map(r =>
    `${r.name}：` + axes.map(a => `${a} ${r.scores[a] ?? 0}`).join('、')).join('。');
  out.push(`<svg viewBox="0 0 560 470" role="img" aria-label="${esc(axes.join('/'))} 雷達對照。${esc(aria)}。" class="radar-svg">`);

  // grid rings
  for (let ring = 1; ring <= 5; ring++) {
    const pts = axes.map((_, i) => pt(i, R * ring / 5));
    out.push(`  <polygon points="${polyPts(pts)}" fill="none" stroke="${ring === 5 ? '#32494B' : '#223638'}" stroke-width="1"/>`);
  }
  // spokes
  for (let i = 0; i < n; i++) {
    const p = pt(i, R);
    out.push(`  <line x1="${CX}" y1="${CY}" x2="${p[0]}" y2="${p[1]}" stroke="#223638" stroke-width="1"/>`);
  }
  // data: one <g class="series"> per repo (polygon + vertices with <title> tooltips)
  out.push('  <g class="data">');
  for (const r of repos) {
    out.push('    <g class="series">');
    const pts = axes.map((a, i) => pt(i, R * (r.scores[a] ?? 0) / 10));
    out.push(`      <polygon points="${polyPts(pts)}" fill="${hexToRgba(r.color, 0.16)}" stroke="${r.color}" stroke-width="2" stroke-linejoin="round"/>`);
    axes.forEach((a, i) => {
      const p = pt(i, R * (r.scores[a] ?? 0) / 10);
      out.push(`      <circle cx="${p[0]}" cy="${p[1]}" r="3.4" fill="${r.color}" stroke="#0E1619" stroke-width="1.5"><title>${esc(a)} · ${esc(r.name)} · ${r.scores[a] ?? 0}/10</title></circle>`);
    });
    out.push('    </g>');
  }
  out.push('  </g>');
  // axis labels
  for (let i = 0; i < n; i++) {
    const lp = pt(i, R + 24);
    const c = Math.cos(ang(i));
    const anchor = Math.abs(c) < 0.3 ? 'middle' : (c > 0 ? 'start' : 'end');
    const dy = i === 0 ? -2 : 4;
    out.push(`  <text x="${lp[0]}" y="${lp[1] + dy}" text-anchor="${anchor}" class="ax-label">${esc(axes[i])}</text>`);
  }
  out.push('</svg>');
  return out.join('\n');
}

// ---- comparison rows ------------------------------------------------------
function buildRows() {
  const byAxis = {};
  (cfg.rows || []).forEach(row => { byAxis[row.axis] = row; });
  const cards = axes.map(axis => {
    const row = byAxis[axis] || {};
    const tracks = repos.map(r => {
      const v = r.scores[axis] ?? 0;
      return `        <div class="track" style="--val:${v}"><span class="lbl"><span class="dot" style="background:${r.color}"></span>${esc(r.name)}</span><span class="bar"><i style="background:${r.color}"></i></span><span class="sc" style="color:${r.color}">${v}</span></div>`;
    }).join('\n');
    const zh = row.zh ? `<span class="skill-zh">${esc(row.zh)}</span>` : '';
    const tag = row.tag ? `<span class="gap-tag">${esc(row.tag)}</span>` : '';
    const note = row.note ? `<p class="note">${row.note}</p>` : '';
    return `    <article class="skill">
      <div class="skill-head"><span class="skill-name">${esc(axis)}</span>${zh}${tag}</div>
      <div class="tracks">
${tracks}
      </div>
      ${note}
    </article>`;
  }).join('\n\n');
  return cards;
}

function buildLegend() {
  return repos.map(r =>
    `    <span><span class="sw" style="background:${r.color}"></span><b>${esc(r.name)}</b></span>`).join('\n');
}
function buildRepoCards() {
  return repos.map(r =>
    `      <div class="repo" style="--rc:${r.color}">
        <div class="nm"><span class="dot"></span>${esc(r.name)}</div>
        <div class="meta">${r.meta || ''}</div>
      </div>`).join('\n');
}
function buildCombined() {
  if (!cfg.combined || !cfg.combined.length) return '';
  const items = cfg.combined.map(c => `      <li>${c}</li>`).join('\n');
  return `  <div class="combined">
    <h3>合看 · 整體側寫</h3>
    <ul>
${items}
    </ul>
  </div>`;
}
function buildCaveat() {
  if (!cfg.caveat) return '';
  return `  <div class="caveat"><p>${cfg.caveat}</p></div>`;
}

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(cfg.title || 'Git Persona Sheet')}</title>
<style>
  :root{
    --ink:#0E1619;--panel:#14201F;--panel2:#1A2A2C;--line:#26393B;--line2:#32494B;
    --text:#E7EEF0;--muted:#829598;--faint:#586B6E;
    --mono:ui-monospace,"SF Mono","JetBrains Mono","Cascadia Code",Menlo,Consolas,monospace;
    --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;
  }
  *{box-sizing:border-box}html,body{margin:0;padding:0}
  body{background:radial-gradient(1200px 600px at 80% -8%,rgba(232,176,75,.07),transparent 60%),radial-gradient(1000px 560px at 0% 106%,rgba(91,192,199,.07),transparent 60%),var(--ink);color:var(--text);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh}
  .sheet{max-width:880px;margin:0 auto;padding:clamp(24px,5vw,64px) clamp(18px,4vw,40px) 72px}
  .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:${repos[0].color};margin:0 0 18px}
  .prompt{font-family:var(--mono);font-size:clamp(12px,2.3vw,14.5px);color:var(--faint);margin:0 0 16px;word-break:break-word}
  .prompt .cm{color:var(--text)}
  h1{font-family:var(--mono);font-weight:700;font-size:clamp(28px,6.4vw,52px);line-height:1.06;letter-spacing:-.01em;margin:0;text-wrap:balance}
  .thesis{max-width:62ch;font-size:clamp(15px,2.3vw,17px);color:var(--muted);margin:18px 0 0}
  .thesis strong{color:var(--text);font-weight:600}
  .repos{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:28px}
  .repo{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:14px 16px;border-top:2px solid var(--rc)}
  .repo .nm{font-family:var(--mono);font-size:14px;font-weight:700;color:var(--rc);display:flex;align-items:center;gap:8px}
  .repo .nm .dot{width:9px;height:9px;border-radius:50%;background:var(--rc);flex:none}
  .repo .meta{font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-top:8px;font-variant-numeric:tabular-nums;line-height:1.7}
  .repo .meta b{color:var(--text);font-weight:600}
  .rule{height:1px;background:linear-gradient(90deg,var(--line2),transparent);border:0;margin:40px 0 28px}
  .legend{display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-bottom:8px;font-family:var(--mono);font-size:12.5px}
  .legend span{display:inline-flex;align-items:center;gap:7px;color:var(--muted)}
  .legend .sw{width:14px;height:3px;border-radius:2px}
  .legend b{color:var(--text);font-weight:600}
  .radar-wrap{display:flex;justify-content:center;padding:4px 0}
  .radar-svg{width:100%;max-width:520px;height:auto;display:block}
  .ax-label{font-family:var(--mono);font-size:14px;font-weight:700;fill:var(--text)}
  .data{transform-box:view-box;transform-origin:280px 238px;animation:radar-grow 900ms cubic-bezier(.2,.8,.2,1) both}
  @keyframes radar-grow{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
  /* JS-free interactivity: hover a series to spotlight it; hover a vertex for its value */
  .series{transition:opacity .22s ease}
  .series polygon{transition:stroke-width .15s ease}
  .series circle{transition:r .12s ease;cursor:pointer}
  .data:hover .series{opacity:.26}
  .data .series:hover{opacity:1}
  .data .series:hover polygon{stroke-width:3.5}
  .series circle:hover{r:6}
  .section-label{font-family:var(--mono);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--faint);margin:30px 0 20px}
  .skills{display:flex;flex-direction:column;gap:12px}
  .skill{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:clamp(15px,3vw,20px)}
  .skill-head{display:flex;align-items:baseline;gap:11px;flex-wrap:wrap}
  .skill-name{font-family:var(--mono);font-size:clamp(16px,2.8vw,19px);font-weight:700}
  .skill-zh{color:var(--muted);font-size:13.5px}
  .gap-tag{margin-left:auto;font-family:var(--mono);font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink);background:${repos[repos.length>1?1:0].color};border-radius:999px;padding:3px 9px;font-weight:700}
  .tracks{display:flex;flex-direction:column;gap:9px;margin:14px 0 12px}
  .track{display:flex;align-items:center;gap:11px}
  .track .lbl{font-family:var(--mono);font-size:11px;width:120px;flex:none;color:var(--muted);display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .track .lbl .dot{width:8px;height:8px;border-radius:50%;flex:none}
  .track .bar{flex:1;height:8px;border-radius:6px;background:var(--panel2);border:1px solid var(--line);overflow:hidden}
  .track .bar>i{display:block;height:100%;width:calc(var(--val) * 10%);border-radius:inherit;transform-origin:left;animation:grow 1000ms cubic-bezier(.2,.8,.2,1) both}
  .track .sc{font-family:var(--mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:17px;width:30px;text-align:right;flex:none}
  @keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  .note{color:var(--muted);font-size:13.5px;margin:0;padding-top:10px;border-top:1px solid var(--line)}
  .note code{font-family:var(--mono);font-size:12px;color:var(--text);background:var(--panel2);padding:1px 5px;border-radius:4px}
  .combined{margin-top:30px;padding:22px 24px;border:1px solid var(--line2);border-radius:14px;background:linear-gradient(135deg,rgba(232,176,75,.05),rgba(91,192,199,.05))}
  .combined h3{font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--text);margin:0 0 12px}
  .combined ul{margin:0;padding-left:18px;color:var(--muted);font-size:14.5px;max-width:64ch}
  .combined li{margin:6px 0}.combined strong{color:var(--text);font-weight:600}
  .caveat{margin-top:18px;padding:18px 22px;border:1px dashed var(--line2);border-radius:14px}
  .caveat p{margin:0;color:var(--faint);font-size:13.5px;max-width:66ch}.caveat strong{color:var(--muted);font-weight:600}
  @media (prefers-reduced-motion:reduce){.track .bar>i,.data{animation:none;transform:none}}
</style>
</head>
<body>
<main class="sheet">
  <header>
    <p class="eyebrow">Git Persona Sheet · 開發者原型盤點</p>
    ${cfg.prompt ? `<p class="prompt"><span class="cm">${esc(cfg.prompt)}</span></p>` : ''}
    <h1>${cfg.title || 'Git Persona Sheet'}</h1>
    ${cfg.subtitle ? `<p class="thesis">${cfg.subtitle}</p>` : ''}
    <div class="repos">
${buildRepoCards()}
    </div>
  </header>

  <hr class="rule" />

  <div class="legend">
${buildLegend()}
  </div>
  <div class="radar-wrap">
    ${buildSvg().split('\n').join('\n    ')}
  </div>

  <p class="section-label">// 逐項對照 · score / 10</p>
  <section class="skills">
${buildRows()}
  </section>

${buildCombined()}
${buildCaveat()}
</main>
</body>
</html>
`;

fs.writeFileSync(outPath, html);
console.log(`wrote ${outPath} (${repos.length} repo(s), ${n} axes)`);
