# git-persona-sheet

A Claude Code plugin that profiles a developer from their **git commit history**
against five archetypes, scores each 0–10, and renders a self-contained,
interactive HTML **"persona / build sheet"** — a radar chart that can overlay
several repos for contrast.

The five archetypes (Boris Cherny's AI-era talent model):

| Archetype | Role |
|-----------|------|
| **Prototyper** | Generates ideas, explores the unknown; most experiments don't ship. |
| **Builder** | Turns prototypes into stable production products / infrastructure. |
| **Sweeper** | Tidies interfaces, simplifies architecture, removes redundancy. |
| **Grower** | Iterates on a shipped product to improve product-market fit. |
| **Maintainer** | Owns mature systems for reliability, security, scale. |

The score reflects *the author in this repo's stage*, not an absolute ceiling —
an infra repo and a product repo by the same person produce different shapes, and
comparing them is the most interesting use.

## Highlights

- Radar rendered as **pure inline SVG** (no `<canvas>`, no JavaScript) — shows up in
  a plain HTML preview, not just a full browser.
- JS-free interactivity: hover a vertex for its score, hover a polygon to spotlight a repo.
- Per-archetype rows cite the actual commit subjects behind each score.

## Use

Install via the [royfw/skills](../../) marketplace, then in Claude Code run
**`/git-persona-sheet`**, or ask *"analyze my commits as the five archetypes"*.

You can also render directly, without Claude:

```bash
node skills/git-persona-sheet/scripts/render-sheet.js \
  skills/git-persona-sheet/references/config.example.json /tmp/sheet.html
```

## License

MIT © Roy Chuang
