# changeset-release

A Claude Code plugin for the **GitHub-native npm release path**:
[Changesets](https://github.com/changesets/changesets) version management plus
npm publish, both running on GitHub Actions.

It covers release branches (`release/stable`, `release/alpha|beta|rc`),
prerelease channels and dist-tags, manual publish gates — and a hard-won
troubleshooting table for the failures that bite in practice: publish jobs that
exit green without publishing (the `changeset status` guard flaw), packages on
the changeset ignore list getting published anyway, the first-publish 404
window, and how the release path must interact with a GitHub→GitLab deploy
bridge.

## Use

Install via the [venvia/skills](../../) marketplace, then ask Claude Code
things like *"set up versioning and publishing for this monorepo"* or *"publish
succeeded but nothing is on npm"*. Reference workflows live in
`skills/changeset-release/examples/`.

## License

MIT © Roy Chuang
