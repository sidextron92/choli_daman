# Vercel deployment and credential cutover

## 1. Initial Vercel deployment

Create a new Vercel project with this folder as its root. Git integration is the recommended deployment path: feature branches create Preview deployments and the production branch deploys to Production.

Configure these as **Sensitive** environment variables in Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`

Generate the Server Action encryption key independently from the Supabase secret:

```bash
openssl rand -base64 32
```

Use one stable value across Preview and Production builds that need to share an active client deployment. Never commit it.

The self-hosted Supabase gateway must remain publicly reachable from Vercel Functions. Vercel outbound IPs are not fixed unless a product with static egress is configured, so a source-IP allowlist cannot assume ordinary Vercel traffic comes from one address.

## 2. Deployment gate

Before promoting a Preview deployment:

1. Confirm `/api/health` returns `status: ok`.
2. Sign in with an existing Supabase Auth user.
3. Verify Home counts match Supabase.
4. Verify Designs load through `/api/design-images/[id]` without mixed-content errors.
5. Verify Designs search/filter, Karigar profiles and Cloth Types.
6. Create and remove one disposable test design only after agreeing on a test record.
7. Promote the verified Preview deployment rather than rebuilding a different artifact.

## 3. Separate credential-rotation cutover

The current credentials are intentionally retained for the initial build and must be rotated as a coordinated operation. The existing self-hosted JWTs expire on **10 January 2027**. Rotation will invalidate active sessions and must update all Supabase services and Vercel together.

Recommended sequence:

1. Back up the self-hosted Supabase configuration and database.
2. Put an HTTPS reverse proxy/domain in front of the Supabase gateway.
3. Generate a new strong Supabase JWT secret and new anon/service-role JWTs with an appropriate expiry.
4. Update the self-hosted Supabase Docker environment for Auth, PostgREST, Storage and Kong, then restart and verify each service.
5. Add the new URL and keys to a Vercel Preview environment.
6. Run the deployment gate above.
7. Update Production environment variables and promote the verified deployment.
8. Revoke/remove the old keys and force users to sign in again.
9. Rotate the PostgreSQL, Studio and VPS credentials documented by the legacy project.
10. Remove committed secrets from the legacy Git history or archive the repository with tightly restricted access.

Do not rotate only the Vercel values: the generated JWTs must match the active self-hosted Supabase JWT secret.

## 4. Legacy HTTP images

Existing database rows contain HTTP Storage URLs. The application intentionally serves them through a same-origin Next.js route, so browsers receive HTTPS images from Vercel. After the Supabase HTTPS domain is available, new uploads will store HTTPS public URLs automatically. Existing rows can then be migrated in a separate database change.
