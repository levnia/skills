# venvia-dev

Language-agnostic dev tools: self-contained HTML visual aids for proposals and option comparisons, and developer archetype profiles from git history.

## Skills

- `venvia-dev:git-persona-sheet` — Profile a developer from git commit history against the five Cherny archetypes (Prototyper / Builder / Sweeper / Grower / Maintainer), score 0-10, and render an interactive inline-SVG radar build sheet across one or more repos.
- `venvia-dev:proposal-visual-aid` — 在提案、方案比較、路線圖或 UI/流程說明時,產出風格統一的自包含 HTML 視覺輔助文件。

## Use

Install via the [venvia/skills](../../) marketplace; Claude applies each skill
automatically when its trigger matches, or invoke one explicitly as `/venvia-dev:<skill>`.

```
/plugin marketplace add venvia/skills
/plugin install venvia-dev@venvia-skills
```

## License

MIT © Roy Chuang
