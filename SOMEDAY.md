# Someday

Deferred ideas — not planned, but worth revisiting if the pain gets worse.

## Tooling

### `prettier-plugin-compact-markdown-table`

Replace per-table `<!-- prettier-ignore -->` comments with a Prettier config option for compact markdown tables.

- Package: [prettier-plugin-compact-markdown-table](https://github.com/myl7/prettier-plugin-compact-markdown-table) (`tableLayout: "compact"`)
- Motivation: Prettier core has no global switch to disable table column padding ([prettier#12074](https://github.com/prettier/prettier/issues/12074)); `proseWrap: "never"` only compacts tables wider than `printWidth`
- Revisit if: markdown tables multiply and `prettier-ignore` comments become annoying to maintain
- Caveats before adopting:
  - v0.1.0, single maintainer — pin exact version and re-test on Prettier upgrades
  - Output is tighter than our markdown-tables rule (`|Name|` / `|-|-|` vs `| Name |` / `|---|---|`)
  - Until then, keep `<!-- prettier-ignore -->` on tables (see `.cursor/rules/markdown-tables.mdc`)
