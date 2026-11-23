# Contributing

## Local setup

`wrangler.jsonc` is not committed because it carries the D1 database id for your own Cloudflare account. Create it once from the committed template:

```sh
pnpm wrangler:init
```

The placeholder id in `wrangler.example.jsonc` is enough for local development and the PR gate. Before deploying remotely, run `pnpm exec wrangler d1 create <database-name>` and replace the placeholder `database_id` (and optionally `database_name`) with the values it prints.

Then migrate and seed the local database:

```sh
pnpm db:migrate:local
pnpm db:seed:demo:local     # small demo bank used by the accessibility gate
```
