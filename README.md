# Choli Daman — Next.js

Focused workshop-management application for designs, karigars and cloth pricing. This is a clean Next.js App Router rewrite of the earlier Vite/Express application.

## Included

- Supabase email/password authentication
- Home dashboard and CSV exports
- Design CRUD, image compression/upload, categories, multi-cloth pricing, assignment, search, filters and sorting
- Karigar CRUD, profiles, call/SMS links and automatic Open Design creation
- Cloth Type CRUD with usage-aware deletion protection
- WhatsApp preview and image download
- Same-origin image proxy for legacy HTTP Supabase Storage URLs

Inventory flows are intentionally excluded. Existing inventory tables in Supabase are not modified.

## Architecture

- Next.js 16 App Router and React 19
- Server Components for reads
- Server Actions for authenticated mutations
- Route Handlers for image proxying, health and CSV downloads
- Self-hosted Supabase REST/Auth/Storage APIs
- Supabase service-role access is server-only and is always preceded by an authenticated session check

The browser never receives a Supabase URL, anon key or service-role key. This is important because the current self-hosted endpoint is HTTP; Vercel Functions perform those requests server-side.

## Local development

1. Copy `.env.example` to `.env.local` and fill in the four variables.
2. Install dependencies: `npm install`
3. Start development: `npm run dev`
4. Open the displayed localhost URL and sign in with an existing Supabase Auth user.

Validation commands:

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment variables

| Variable | Exposure | Purpose |
|---|---|---|
| `SUPABASE_URL` | Server-only | Self-hosted Supabase API URL |
| `SUPABASE_ANON_KEY` | Server-only | Auth session client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, sensitive | Authenticated data and Storage operations |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Server-only, sensitive | Stable Server Action encryption across deployments |

Do not create `NEXT_PUBLIC_` variants. Legacy local files containing `VITE_SUPABASE_ANON_KEY` are supported only to ease migration.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel setup and credential cutover.
