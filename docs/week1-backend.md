# Week 1 backend core

Requires Node >=24.9, npm, PostgreSQL, and a random JWT_ACCESS_SECRET of at least 32 bytes. Prisma CLI/client are pinned to major 6. Faruk Turnali remains the sole maintainer. No Week 2 message handlers are implemented.

## Setup (PowerShell, repository root)

```powershell
npm ci
$env:DATABASE_URL = 'postgresql://whatsup:change_me@localhost:5432/whatsup'
# Supply a secret from your local secret manager; never commit it.
$env:JWT_ACCESS_SECRET = '<at-least-32-random-bytes>'
$env:WEB_ORIGIN = 'http://localhost:3000'
npm run build --workspace=packages/shared
npm run db:generate --workspace=apps/api
npm run db:migrate --workspace=apps/api
npm run db:seed --workspace=apps/api
npm run start:dev --workspace=apps/api
```

Replace the example database credentials. Environment values must be exported to the API process; copying the root .env.example alone does not load it into Nest. Prisma also supports an apps/api/.env file. Production images must generate Prisma Client during their build; migrations require the Prisma development tooling in a separate deployment job. `migrate deploy` applies the checked-in initial migration without resetting existing data or requiring a shadow database. See [Prisma migrate deploy](https://docs.prisma.io/docs/cli/migrate/deploy).

Seed is opt-in, transactional, idempotent, and forbidden when NODE_ENV=production. It creates synthetic alice@example.test, bob@example.test, outsider@example.test with password `Synthetic-Week1-Password!`. IDs end in 001, 002, 003 under `00000000-0000-4000-8000-00000000000x`. Conversation `10000000-0000-4000-8000-000000000001` contains Alice and Bob only. IDs, timestamps, membership and credentials are stable; fresh password salts are deliberately random. Reruns do not overwrite existing users, credentials or conversation state. Use a dedicated development/test database.

## HTTP and session policy

All endpoints are POST and return 201 on success:

| Path | JSON body | Result |
| --- | --- | --- |
| /auth/register | email, password, displayName | accessToken, refreshToken, expiresIn |
| /auth/login | email, password | same token pair |
| /auth/refresh | refreshToken | rotated token pair |
| /auth/logout | refreshToken | `{ "ok": true }` |

Email is trimmed/lowercased. Password length is 12–128 characters; displayName is 1–80 characters with a non-whitespace character. Unknown fields and invalid DTOs return 400. Duplicate email returns 409; invalid credentials/token/session returns 401. Passwords use asynchronous scrypt (N=32768,r=8,p=3), a random 16-byte salt and timing-safe comparison. Registration commits user and initial session together.

Access JWT: HS256, issuer whatsup-api, audience whatsup, 15-minute expiry; sub=user ID, sid=session ID. Refresh: opaque 48 random bytes encoded as 96 hex characters, only SHA-256 digest persisted, fixed 30-day session lifetime. Refresh uses a conditional atomic update so exactly one concurrent consumer wins. Old refresh tokens become invalid immediately; replay returns 401 without revoking the winning session. Refresh does not extend the session deadline. Access tokens remain valid through refresh until their own expiry or session revocation.

Logout revokes the session identified by the **current** refresh token and is idempotent. An already rotated/unknown token has no effect. Separate login sessions remain independent. Access verification checks JWT and current database session on every call. There is no user-supplied identity parameter and no endpoint returning password hashes. Tokens are response body bearer credentials; use HTTPS and keep them out of URLs, logs and persistent browser storage. Browser cookie/CSRF integration is outside this week.

## Socket authorization

Connect to `/chat` with `auth: { token: accessToken }`. Missing, non-string, malformed, fake, expired or invalid-session tokens produce `connect_error` with message UNAUTHORIZED before connection/room entry. No query-string or client userId authentication. `socket.data.user` contains verified id and sessionId.

Existing `conversation:join` and `conversation:leave` take exactly `{ conversationId: UUID }` and use existing shared ACK shapes. Payload UUIDs use canonical lowercase notation. Success reports joined:true or left:true. Errors use INVALID_PAYLOAD, UNAUTHORIZED, FORBIDDEN, INTERNAL_ERROR. Unknown conversations and known nonmember conversations return the same denial. Room names are `conversation:<canonical UUID>`; knowing a room name or ID is never authorization. No arbitrary room/event emission API exists.

Every inbound packet rechecks access token expiry/session state. Each join/leave additionally queries current membership through ConversationAuthorizationService. Failure removes that socket from the requested room, including stale membership. The gateway never imports Prisma or writes domain records. There are no outgoing conversation data broadcasts or message writes in this scope.

Lifecycle: logout or expiration blocks reconnection immediately; an already idle socket disconnects on its next inbound packet. It is not proactively disconnected at logout. Membership removal is rechecked on the next valid join/leave for that conversation, removing its stale room then; invalid payloads, unknown events and actions on other conversations do not sweep stale rooms. Future outbound delivery MUST authorize recipients or evict invalid recipients before emitting: room membership alone is not a permanent grant. An already running authorized operation may finish if revocation commits after its authorization check. There is no membership mutation API in Week 1. These boundaries must be preserved when future handlers are added.

For smoke testing set ACCESS_TOKEN and run `node scripts/realtime-smoke.mjs`. It deliberately fails without a token.

## Integrity and verification

User email, refresh digest, membership composite ID, `(conversationId, sequence)` and `(senderId, clientMessageId)` are unique. Foreign keys prevent orphan records. Positive sequence constraints and BigInt nextSequence prepare monotonic allocation; actual sequence allocation/idempotent message writes remain Week 2 work. Initial migration creates new tables only, in one explicit transaction. No existing tables are dropped or rewritten.

Use a disposable PostgreSQL database and export DATABASE_URL and JWT_ACCESS_SECRET before running:

```powershell
npm run test:typecheck --workspace=apps/api
npm run lint:api
npm test --workspace=apps/api -- --runInBand
npm run test:e2e --workspace=apps/api -- --runInBand
```

E2E tests create random isolated accounts/conversations and remove their rows in teardown; do not run against production. The checked-in original root HTTP test remains intact. Jest uses VM modules for Nest 12 ESM, as described in [Jest ESM support](https://jestjs.io/docs/ecmascript-modules), plus explicit TypeScript checking for source/tests/seed. Observe is disabled unless both OBSERVE_APP_KEY and OBSERVE_APP_SECRET exist, avoiding placeholder telemetry workers. Do not configure credential/body capture on auth routes.

Operational limitations: no auth rate limiter, account recovery, scheduled expired-session deletion, refresh replay family tracking or proactive distributed socket eviction is introduced. Expired/revoked sessions stay persisted but cannot authenticate. The scoped deepmerge-ts 8 override fixes the Prisma CLI dependency advisory and should be removed after a compatible upstream upgrade. Prisma 6 package.json seed config emits a deprecation warning for Prisma 7; no major-version migration was attempted.


## Closure verification and production web build

The current closure findings supersede historical limitations in the initial report: see [Week 1 closure review](week1-closure-review.md). Production web compilation is explicitly configured as `next build --webpack` in apps/web/package.json. From the repository root:

```powershell
npm run lint:web
npm run build:web
npm run start --workspace=apps/web
```

`npm run build:web` is the intended production build, with TypeScript checking enabled. Webpack is a supported Next.js option; dev remains `next dev`. Both pipelines require Google Fonts network access on a fresh build because the existing layout uses next/font/google. No application font/UI/config was replaced to make verification pass. Diagnostic Turbopack check: `npm exec --workspace=apps/web -- next build --turbopack`. The original 16.3.6 panic happened while spawning the CSS/PostCSS worker; after the 16.3.8 security patch and dependency reinstallation the same source/config passed Turbopack. The old failure cannot be attributed conclusively to only sandbox restrictions or only Next's old version. No invalid project configuration was identified.

## Required Week 2 outbound authorization invariant (specification only)

Before any future `message:new` is enqueued to a socket, the message must already be committed, and that **specific recipient socket** must have a currently valid verified access token, a matching non-expired/non-revoked session, and current membership in the message's conversation. Client-provided identity and old room admission are never sufficient. Inbound packet middleware does not run for server-to-client broadcasts.

The future delivery path must enumerate candidate sockets and authorize each at dispatch, excluding/disconnecting invalid sessions and removing revoked memberships from conversation rooms; database/verification failures must fail closed. It must emit only to the verified recipient set, rather than an unchecked `namespace.to(conversationRoom(id)).emit(...)`. Eviction is cleanup, not a substitute for the final delivery gate. Every delivery worker/node must apply the same rule; Redis room replication alone cannot enforce it.

Revocation race semantics must be explicit: any revocation committed before delivery authorization/enqueue must exclude that recipient. A read followed by emit with no coordination has a time-of-check/time-of-use gap. To meet the stronger enqueue invariant, the future implementation must serialize session/membership revocation and each delivery gate through the same per-session/per-membership coordination mechanism (or an equivalent ordered authorization-version protocol), across all workers, recheck expiry immediately before enqueue, and hold the ordering boundary through enqueue. A packet already enqueued before revocation cannot be recalled. This specification does not claim such coordination exists in Week 1.

Week 2 must not enable message broadcasts until tests show no `message:new` reaches a previously joined idle recipient after access expiry, logout, direct session revocation or membership removal, including a deterministic revocation-versus-delivery race and fail-closed database failure. Sender authorization and successful persistence/commit remain separate prerequisites. No messaging implementation was added by closure review.
