# Upgrading a fork

This file is for repositories that forked `mocks` as **upstream**. A fork shares `mocks-org/mocks`'s history, so `git merge upstream/main` is a normal merge. A repository created from an old template copy has nothing to merge. See [make it your own](./fork-your-own.md#5-keep-it-updated).

## What merges cleanly

| Path                                                                                        | Owner     | What to expect                                                        |
| ------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| `src/theme/**`, `src/lib/settings/site.ts`, `src/routes/(site)/*.svx`, `content/packs.json` | your fork | expected conflicts; keep your side and carry over new upstream fields |
| the rest of `src/lib/**`, `src/routes/**`, and `scripts/**`                                 | upstream  | merges cleanly, a conflict means you edited core                      |
| `pnpm-lock.yaml`                                                                            | generated | take theirs, then `pnpm install`                                      |
| `drizzle/**`                                                                                | upstream  | append-only, upstream never edits an applied migration                |

A merge that conflicts under core `src/lib/` is a signal, not a failure. It means the fork owns a line upstream needs to change. Re-apply the local change after taking upstream's side, or open a PR so the seam can move instead.

## Theme patches

Upstream does not commit to `src/theme/**` after the first release. When a theme file genuinely must change (a new seam, a required new prop, a rename) it is published here as a patch you apply by hand. Your own styling, ordering and breakpoints are never overwritten.

Patch entries look like this:

```md
### 2026-01-01 -- Footer now expects `FooterLicences` (unreleased)

`FooterLicences` used to be inlined in `Footer.svelte`. Replace the inline `<small>` block with `<FooterLicences class="text-[12px]" />` and add the import.

Skip this if you already import it.
```

## Releases

No releases yet. The first entry appears with the first tag.
