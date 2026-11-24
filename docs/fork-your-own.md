# Make it your own

Fork it, or clone it and push to your own remote. Your copy shares history with `mocks-org/mocks`, so `git merge upstream/main` brings accessibility and logic fixes into your deployment while `src/theme/` stays your own skin. [Keep it updated](#5-keep-it-updated) covers the merge workflow and the conflict rules.

This page covers the edit surface and the rebranding steps. For Cloudflare setup see [deploy](./deploy.md), for the pack format see [content packs](./content-packs.md).

## The edit surface

A fork owner should only need these files:

| Path                             | Purpose                                                                   |
| -------------------------------- | ------------------------------------------------------------------------- |
| `src/theme/tokens.css`           | palette values and font stacks                                            |
| `src/theme/Header.svelte`        | header arrangement and styling                                            |
| `src/theme/Footer.svelte`        | footer arrangement and styling                                            |
| `src/theme/Home.svelte`          | homepage arrangement and styling                                          |
| `src/theme/SessionHeader.svelte` | exam lobby, attempt, practice, summary, results and authoring bar         |
| `src/lib/settings/site.ts`       | name, logo, metadata, nav, footer, homepage copy, licences, featured exam |
| `src/routes/(site)/*.svx`        | about and accessibility prose                                             |
| `content/packs.json`             | which packs are installed, pinned by SHA                                  |
| `wrangler.jsonc`                 | worker name and D1 database name/id (not committed)                       |

Everything under `src/lib/` except `src/lib/settings/site.ts` is app code. If you need to edit it for a routine rebrand, that is a bug in the upstream app, not a missing instruction.

## Skin vs core

`src/theme/` is the skin and belongs to you. `src/lib/` is app code and belongs to upstream (that is where fixes land).

The split is enforced, not aspirational. `pnpm theme:check` (part of `pnpm check`) fails when a theme file contains `aria-*` (except `aria-labelledby`, which can only point at an id in the same file), `role=`, `tabindex=`, or a landmark element (`nav`, `main`, `header`, `footer`). Those live in `#lib` components (`NavLinks.svelte`, `SkipLink.svelte`, `FooterLicences.svelte`, and so on), which the theme composes and styles through a `class` prop.

That matters for updates. A fix in `src/lib` merges into your fork with no conflict, because you never edit those files. A fix in `src/theme` would land on lines you changed, so upstream ships it as a patch note in [`upgrading.md`](./upgrading.md) instead of a commit. As a result, your skin survives, and a forgotten `aria-label` still reaches you.

Practical consequences:

- Links, social profiles, nav items, homepage copy (a `site.ts` edit). No markup change, no merge conflict, no matter how many entries.
- Restyling, reordering or dropping a block, a `src/theme/` edit.
- The exam-session bar is one component (`src/theme/SessionHeader.svelte`) shared by the lobby, the timed attempt, practice, the summary, results and the authoring tool, so a change there applies to all six at once.
- Custom markup that carries meaning (a new landmark, a dialog, a form control) belongs in `src/lib/`, or open a PR upstream, so it can be fixed for everyone.

## 1. Create your copy

1. Fork the repository on GitHub, or clone it and point `origin` at your own remote. A fork gets `upstream` for free, otherwise add it: `git remote add upstream https://github.com/mocks-org/mocks.git`.
2. Clone your repository and run `pnpm install`.
3. Create the local Wrangler config: `pnpm wrangler:init`.
4. For deployment, create a D1 database and paste its id into `wrangler.jsonc` (see [deploy](./deploy.md)). The placeholder id is enough for local work.
5. Apply migrations: `pnpm db:migrate:local`.
6. Seed the bundled demo: `pnpm db:seed:demo:local`, then `pnpm dev` and open `/portal/cpacc-demo` to confirm the app runs before you add content.

The demo pack stays in the repository. It powers the a11y CI job and gives `/` something to render before you seed a real exam. `content/packs.json` starts empty. The repository ships no exam content beyond the demo.

## 2. Rebrand

Open `src/lib/settings/site.ts` and edit the fields in place. The header, footer, document head, homepage, and authoring defaults all read from this object, so one change updates every occurrence.

For anything visual (spacing, type scale, arrangement, palette) edit `src/theme/` instead. `site.ts` is content, `src/theme/` is appearance.

| Field                 | What it controls                                                   |
| --------------------- | ------------------------------------------------------------------ |
| `name`                | Brand name in the header, footer, titles, and authoring tool       |
| `tagline`             | Fallback page-title phrase                                         |
| `description`         | `<meta name="description">` and Open Graph description             |
| `url`                 | Canonical, Open Graph, sitemap, and robots URLs                    |
| `locale`              | `<html lang>`                                                      |
| `featuredExam`        | Exam shown on the homepage, falls back to the first published exam |
| `logo`                | Header mark, swap the icon import at the top of the file           |
| `startYear`           | First year in the footer copyright range                           |
| `headerLinks`         | In-site header navigation                                          |
| `footerLinks`         | In-site footer navigation                                          |
| `social`              | Public profiles beside the licence links                           |
| `disclaimer`          | Independent/non-commercial statement                               |
| `unofficialStatement` | "Not affiliated…" notice shown where a score could look official   |
| `licenseLinks`        | Code and content licences in the footer and authoring tool         |
| `credit`              | Toggle for the author credit                                       |
| `home`                | Hero, sample, and practice copy and button labels                  |

- `site.url` must not have a trailing slash, and it should match the origin users actually visit, otherwise canonical links point at the wrong host.
- `/sitemap.xml` is generated per request from `site.url`, the header and footer links in `site.ts`, and every published exam in D1. Install a pack, seed the database, and its `/portal/<exam>` and `/portal/<exam>/start` pages appear in the sitemap with no file to edit.
- `/robots.txt` is generated too and points crawlers at the sitemap, so both follow `site.url` in a fork.

Then replace the prose in the two `.svx` pages:

- `src/routes/(site)/about/+page.svx`
- `src/routes/(site)/accessibility/+page.svx`

These are the _"replace me"_ set. They are ordinary Markdown with the shared mdsvex layout, there is no component work involved.

## 3. Choose your content packs

A pack is installed by pinning it in `content/packs.json` and copying its files into `content/<exam>/`. The CLI does both, and validates the pack first:

```sh
pnpm content:add github:<owner>/<pack> --ref <sha>
pnpm content:list
pnpm bank:validate
pnpm bank:seed:local
```

Pass `--ref <sha>` when you want an exact release. Without it the command takes the newest tag and pins the commit it points at. `content:add` does not seed a database, so run `pnpm bank:seed:local` (or `:remote` when deployed) afterwards.

To move an installed pack to a newer release, run `pnpm content:update <exam>`. With no argument it updates every pinned pack. Both commands accept `--dry-run`.

### Edit the manifest in the browser

If you cannot run the CLI, GitHub's file editor is enough. The manifest is plain JSON and the only file that records upstream content.

1. Open your repository on GitHub and go to `content/packs.json`.
2. Choose the pencil icon (**Edit this file**).
3. Add or change one entry. `source` is the repository URL and `ref` is a **full 40-character commit SHA**:

   ```json
   {
   	"cpacc": {
   		"source": "https://github.com/mocks-org/mocks-cpacc",
   		"ref": "8128994c4bedef3208327e09cb929366379e171d"
   	}
   }
   ```

4. Commit to a branch and open a pull request, as you would for any change.

A SHA is not the same as a tag. On the pack repository, open the **Commits** page (or the release), copy the full SHA, and paste it into `ref`. A tag or branch name is rejected by `pnpm content:check` and would make the build unreproducible.

Editing the manifest by hand only changes the pin. You still need the pack's files under `content/<exam>/`. The normal path is to let the sync CLI or the **Sync content** action copy them. Use the browser only for a pin you are sure matches the committed directory.

To seed a browser-edited pin into your deployed database, pull the change locally, run `pnpm bank:seed:remote --exam <exam>`, then deploy. The GitHub workflow updates the repository, not D1.

## 4. Know what not to edit

| Path                        | Why                                                             |
| --------------------------- | --------------------------------------------------------------- |
| `content/<exam>/` (pinned)  | Managed by sync, edit the pack repository instead               |
| `build/bank/`               | Generated by `pnpm bank:build`                                  |
| `drizzle/`                  | Migrations are generated by `pnpm db:generate`                  |
| `worker-configuration.d.ts` | Generated by `wrangler types`                                   |
| `.github/workflows/`        | The sync workflow and PR gate are part of the upstream contract |

`src/theme/**` is the opposite of this table: it is yours, and editing it is the
intended way to change the look. Run `pnpm theme:check` after a change, it refuses
accessibility semantics in that directory.

The bundled `content/demo/` pack is the exception: edit it directly if you need to change the demo. Then rebuild its SQL and refresh the committed seed file:

```sh
pnpm bank:build content/demo
# writes build/bank/cpacc-demo.sql (exam bank)
#    and build/bank/cpacc-demo-practice.sql (practice bank)
```

Keep the four-line "not for production" header at the top of `scripts/seed-demo.sql` and replace everything after it with the two generated files, exam bank first. Do not add the demo to the manifest.

## 5. Keep it updated

Two update channels. Do not mix them.

| Channel  | How                                                                          |
| -------- | ---------------------------------------------------------------------------- |
| Content  | move a pack pin, or let **Sync content** open a pull request                 |
| App code | `git fetch upstream && git merge upstream/main` — copies with shared history |

### Content

Content moves by pin, never by merging the app. `pnpm content:update <exam>` (or the **Sync content** workflow) rewrites the pin and the files under `content/<exam>/`. A sync may only write under `content/`. If a diff appears in `src/` or a config file, close the pull request. That is a failed sync, not something to keep.

### App code

A fork shares history with upstream, so `git merge upstream/main` is a normal merge. Merges are per hunk, not per file: edits in different regions of the same file combine on their own.

If your repository was created from an old template copy, it has no shared history and the first merge is one large conflict. Do that once on a branch:

```sh
git remote add upstream https://github.com/mocks-org/mocks.git
git fetch upstream
git merge --allow-unrelated-histories upstream/main
```

Resolve it, and from then on the normal merge works.

Resolution rules:

| Path                                                                                        | Who wins                                                                  |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/theme/**`, `src/lib/settings/site.ts`, `src/routes/(site)/*.svx`, `content/packs.json` | yours, take your side every time                                          |
| the rest of `src/lib/**`, `src/routes/**`, and `scripts/**`                                 | upstream, take theirs, then re-apply a local change if you made one there |
| `content/<exam>/**`                                                                         | yours, it is synced per pack, never merged                                |
| `pnpm-lock.yaml`                                                                            | `git checkout --theirs pnpm-lock.yaml && pnpm install`                    |
| `drizzle/**`                                                                                | upstream never edits an applied migration, a conflict means stop and ask  |

The first row is the same edit surface as [the edit surface](#the-edit-surface). A conflict there is expected: keep your side, then read upstream's change and carry over anything new it added (a field, a prop, a licence entry).

To see what is coming before you merge:

```sh
git fetch upstream
git log --oneline HEAD..upstream/main -- src/lib        # fixes you want
git log --oneline HEAD..upstream/main -- src/theme      # changes that need your judgement
```

Then run `pnpm check && pnpm lint && pnpm test:unit -- --run`, and `pnpm test:a11y` if the change touches layout or navigation.

Upstream commits are deliberate about what lands in `src/theme/`: after the first release it changes only to add a seam, and such a change is published in [`upgrading.md`](./upgrading.md) as a patch you apply yourself.

That is the trade! The skin is yours, so a skin fix cannot be merged for you.

## Checklist

- [ ] `pnpm install` and `pnpm wrangler:init`
- [ ] D1 database created, id pasted into `wrangler.jsonc`
- [ ] `pnpm db:migrate:local`, demo seeded with `pnpm db:seed:demo:local`
- [ ] Packs chosen, installed with `pnpm content:add … --ref <sha>`, seeded, and validated with `pnpm content:check`
- [ ] `site.ts` edited, `site.url` matches the deployed origin
- [ ] `src/theme/` restyled, `pnpm theme:check` passes
- [ ] `.svx` pages replaced
- [ ] Footer licence links match the packs you actually ship
- [ ] Actions enabled, **Sync content** run once to confirm the PR flow (a run that reports nothing to sync is fine)
- [ ] `pnpm check && pnpm lint && pnpm test:unit -- --run` pass
