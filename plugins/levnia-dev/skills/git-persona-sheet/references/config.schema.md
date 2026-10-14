# config.json shape for render-sheet.js

A single JSON object. HTML is allowed in text fields (`title`, `subtitle`, `meta`, `note`,
`combined[]`, `caveat`) — they are injected verbatim, so you can color words with
`<span style="color:#…">` or mark `<code>commit subjects</code>`. See
`config.example.json` for a complete two-repo instance.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `title` | string (HTML) | yes | The `<h1>` — usually the one-line verdict. Markup applies to the on-page `<h1>` only; the browser-tab `<title>` shows it escaped (harmless — a `grep <title>` will look "escaped", that's expected). |
| `subtitle` | string (HTML) | no | Thesis paragraph under the title. |
| `prompt` | string | no | Terminal-style line shown above the title (decorative). |
| `axes` | string[] | no | Archetype names + order. Default: Builder, Maintainer, Sweeper, Prototyper, Grower. |
| `repos` | object[] | yes | One per repo; each overlays a polygon on the radar. |
| `repos[].name` | string | yes | Repo label (legend, tooltips, bars). |
| `repos[].color` | hex `#RRGGBB` | no | Series color. Auto-assigned from a palette if omitted. |
| `repos[].meta` | string (HTML) | no | Small stats line in the repo card (`159 commits…`). |
| `repos[].scores` | object | yes | `{ "<axis>": 0–10 }` for every axis. |
| `rows` | object[] | no | One card per axis with evidence. Omit → bare score cards. |
| `rows[].axis` | string | yes | Must match an `axes` entry. |
| `rows[].zh` | string | no | Chinese subtitle for the archetype. |
| `rows[].tag` | string | no | Pill (e.g. `+3 在 devops-cfg`) to flag a notable gap. |
| `rows[].note` | string (HTML) | no | Evidence sentence; cite a real commit subject. |
| `combined` | string[] (HTML) | no | Bullets for the "合看 / overall" box. |
| `caveat` | string (HTML) | no | The stage-shapes-score disclaimer. Keep it. |

Scores feed the radar geometry (0 = center, 10 = outer ring) and the comparison-row bar
widths. Every repo should score every axis; a missing axis is treated as 0.
