# Week 1 final report — 19 October 2026

1. **Implementation.** Completed persistent backend core, register/login/refresh/logout, secure session verification, /chat handshake authentication and current membership authorization. Added clean Auth/Users/Conversations/Database module boundaries. Realtime calls domain services only; identity comes from the verified JWT/session. Week 2 handlers and message persistence were not started.

2. **Exact file inventory.** No files deleted. Existing working tree was clean before implementation. Generated tracked tsbuildinfo was restored to its original bytes.

| Status | File | Reason |
| --- | --- | --- |
| Modified | `.env.example` | JWT secret policy, WEB_ORIGIN, optional telemetry; opaque refresh removes refresh signing secret. |
| Modified | `apps/api/jest.config.ts` | TypeScript 6 rootDir/isolated transform compatibility; separate typecheck retains checking. |
| Modified | `apps/api/package.json` | Auth/Prisma dependencies, database scripts, ESM Jest runner and test typecheck; Node minimum. |
| Modified | `apps/api/src/app.module.ts` | Enable Observe only with explicitly configured credentials. |
| Modified | `apps/api/src/main.ts` | Match optional Observe instrumentation to module configuration. |
| Modified | `apps/api/src/modules/realtime/realtime.gateway.ts` | Handshake authentication, packet session verification, membership-checked room ACKs. |
| Modified | `apps/api/src/modules/realtime/realtime.module.ts` | Bind RealtimeAuthPort to AuthService and import authorization modules. |
| Modified | `apps/api/src/modules/realtime/realtime.types.ts` | Verified session identity and shared event maps on socket types. |
| Modified | `apps/api/test/jest-e2e.json` | TypeScript 6-compatible E2E transform configuration. |
| Modified | `package-lock.json` | Reproducible dependency resolution including scoped security correction. |
| Modified | `package.json` | Scope deepmerge-ts 8 security override to @prisma/config. |
| Modified | `packages/shared/src/index.ts` | Correct relative ESM paths to .js so shared exports resolve under NodeNext; no payload/event change. |
| Modified | `packages/shared/src/realtime/conversation.ts` | Correct relative ESM paths to .js so shared exports resolve under NodeNext; no payload/event change. |
| Modified | `packages/shared/src/realtime/error.ts` | Correct relative ESM paths to .js so shared exports resolve under NodeNext; no payload/event change. |
| Modified | `packages/shared/src/realtime/index.ts` | Correct relative ESM paths to .js so shared exports resolve under NodeNext; no payload/event change. |
| Modified | `packages/shared/src/realtime/maps.ts` | Correct relative ESM paths to .js so shared exports resolve under NodeNext; no payload/event change. |
| Modified | `packages/shared/src/realtime/message.ts` | Correct relative ESM paths to .js so shared exports resolve under NodeNext; no payload/event change. |
| Modified | `packages/shared/src/realtime/presence.ts` | Correct relative ESM paths to .js so shared exports resolve under NodeNext; no payload/event change. |
| Modified | `packages/shared/src/realtime/receipt.ts` | Correct relative ESM paths to .js so shared exports resolve under NodeNext; no payload/event change. |
| Modified | `packages/shared/src/realtime/typing.ts` | Correct relative ESM paths to .js so shared exports resolve under NodeNext; no payload/event change. |
| Modified | `scripts/realtime-smoke.mjs` | Require supplied access token and bounded, non-reconnecting connection attempt. |
| Created | `apps/api/prisma/migrations/202610190001_week1_core/migration.sql` | Transactional initial PostgreSQL DDL and positive sequence constraints. |
| Created | `apps/api/prisma/migrations/migration_lock.toml` | Lock migrations to PostgreSQL. |
| Created | `apps/api/prisma/schema.prisma` | Persistent core models, relations and unique integrity boundaries. |
| Created | `apps/api/prisma/seed.ts` | Idempotent synthetic accounts/conversation/membership fixture. |
| Created | `apps/api/src/modules/auth/auth.dto.ts` | Strict validated/normalized auth requests. |
| Created | `apps/api/src/modules/auth/auth.module.ts` | Public auth endpoints, DTO pipe and fail-closed JWT secret configuration. |
| Created | `apps/api/src/modules/auth/auth.service.ts` | Transactional registration, credentials, access/session verification, rotation/logout. |
| Created | `apps/api/src/modules/auth/password.ts` | Asynchronous salted scrypt hashing and timing-safe comparison. |
| Created | `apps/api/src/modules/conversations/conversations.module.ts` | Reusable current membership authorization without existence disclosure. |
| Created | `apps/api/src/modules/database/database.module.ts` | Shared Prisma ownership and shutdown disconnect boundary. |
| Created | `apps/api/src/modules/realtime/realtime.gateway.spec.ts` | Negative missing-identity, forbidden and internal-error room cleanup tests. |
| Created | `apps/api/src/modules/users/users.module.ts` | User lookup/create domain boundary with transaction participation. |
| Created | `apps/api/test/run-jest.cjs` | Portable Node VM-module Jest runner for Nest 12 ESM. |
| Created | `apps/api/test/week1.e2e-spec.ts` | Real PostgreSQL, HTTP and Socket.IO acceptance/negative coverage. |
| Created | `apps/api/tsconfig.test.json` | Explicit no-emit typechecking of application, tests and seed. |
| Created | `docs/week1-backend.md` | Setup, contracts, seed, session/socket policy and operational limitations. |
| Created | `docs/week1-report.md` | Complete required Week 1 implementation/verification report. |

3. **Database.** Initial `202610190001_week1_core` migration creates User, Session, Conversation, ConversationMember and preparatory Message tables, with foreign keys, unique email/refresh digests, composite membership PK, sender/clientMessageId idempotency key, conversation/sequence uniqueness and positive sequence/counter constraints. Explicit BEGIN/COMMIT; no drops or rewrites of preexisting application tables. Clean PostgreSQL 18 application and repeat deploy both passed. Seed ran repeatedly without duplicate records; final teardown left exactly 3 synthetic users, 1 conversation and 2 memberships. Message allocation/write logic remains intentionally absent.

4. **Public surfaces.** Added POST /auth/register, /auth/login, /auth/refresh, /auth/logout; success 201, DTO errors 400, credential/session errors 401, duplicate email 409. Register/login/refresh return accessToken, refreshToken, expiresIn=900. /chat requires handshake.auth.token. Existing conversation:join/leave event names, payloads, ACKs and error unions remain unchanged. Payload extra fields are rejected. Shared import/export paths now carry .js extensions for NodeNext compatibility. JWT_ACCESS_SECRET now requires >=32 random bytes; JWT_REFRESH_SECRET is removed because refresh tokens are opaque. WEB_ORIGIN defaults to localhost:3000; Observe requires both OBSERVE_APP_KEY and OBSERVE_APP_SECRET. Node >=24.9 required for Nest 12 ESM/Jest runtime. See [operating guide](week1-backend.md).

5. **Commands and exact outcomes.** Commands below were run from the repository root with DATABASE_URL and JWT_ACCESS_SECRET exported as appropriate. Network/local-process operations required sandbox escalation and were successfully authorized.

| Command | Final outcome |
| --- | --- |
| npm install --workspace=apps/api @prisma/client@6 prisma@6 @nestjs/jwt class-validator class-transformer | PASS after restricted-network attempt was interrupted and authorized retry succeeded |
| npm install --package-lock-only --ignore-scripts --offline --no-audit | PASS |
| npm install --ignore-scripts; npm update deepmerge-ts --ignore-scripts | PASS; installed scoped fixed deepmerge-ts 8.0.2 |
| npm ls deepmerge-ts | PASS: Prisma config resolves 8.0.2 |
| npm run db:generate --workspace=apps/api | PASS; first sandbox attempt failed DNS, authorized retries succeeded |
| npx prisma migrate diff --from-empty --to-schema-datamodel apps/api/prisma/schema.prisma --script --output apps/api/prisma/migrations/202610190001_week1_core/migration.sql | PASS; positive constraints and transaction wrapper added afterward |
| npm run db:migrate --workspace=apps/api | PASS on clean DB; repeat reports no pending migrations. Initial sandbox DB access failed; authorized retry passed |
| npm run db:seed --workspace=apps/api | PASS on initial and repeated execution; initial restricted DB-access attempt failed before authorized retry |
| npm run build --workspace=packages/shared | PASS |
| npm run build:api | PASS; initial shared export/ACK typing failures corrected |
| npm run test:typecheck --workspace=apps/api | PASS, includes source/tests/seed |
| npm run lint:api | PASS |
| npm test --workspace=apps/api -- --runInBand | PASS: 2 suites, 4 tests |
| npm run test:e2e --workspace=apps/api -- --runInBand | PASS: 2 suites, 7 tests, clean exit |
| npm run lint:web | PASS |
| npm run build:web | FAIL: restricted Google Fonts request; authorized retry failed in existing Turbopack CSS child-process startup |
| npm run build --workspace=apps/web -- --webpack | PASS: production compilation, typecheck and static rendering |
| npm audit --json | FAIL (nonzero security result): 29 findings, 20 moderate, 8 high, 1 critical |
| git diff --check | PASS |
| PostgreSQL initdb / pg_ctl / createdb / psql / pg_ctl stop | PASS for isolated loopback test cluster, row-count cleanup check and shutdown; Docker daemon was unavailable |

Early Jest runs failed TypeScript 6 rootDir and Nest 12 ESM configuration; both were corrected. First successful E2E run exposed an existing placeholder Observe worker preventing process exit; optional credential-gated telemetry corrected this. Final tests exited normally. Prisma 6 emits seed-config deprecation and Node emits VM-module experimental warnings; neither is hidden or suppressed.

6. **Acceptance checklist.**

| Requirement | Result | Evidence |
| --- | --- | --- |
| Implementation 1: clean modules/authorization boundaries | PASS | Acyclic Database -> Users -> Auth and Database -> Conversations; Realtime depends on domain modules |
| Implementation 2: core Prisma schema/migration/synthetic seed | PASS | Five models, clean migration, repeatable seed |
| Implementation 3: register/login/DTO/hash/duplicate/token | PASS | HTTP positive and negative tests |
| Implementation 4: refresh/logout/session invalidation/policy | PASS | Atomic refresh race, replay rejection, expired/revoked session tests and guide |
| Implementation 5: access-token adapter behind realtime port | PASS | useExisting AuthService binding |
| Implementation 6: handshake denial before room admission | PASS | Missing, malformed, fake, expired, wrong-audience and revoked session tests |
| Implementation 7: server-derived socket identity | PASS | Real server socket data inspected; forged handshake identity ignored |
| Implementation 8: reusable membership service | PASS | ConversationAuthorizationService |
| Implementation 9: join/leave shared contracts/private rooms | PASS | Positive ACKs and actual room state assertions |
| Implementation 10: current authorization on protected actions | PASS | Per-packet session checks; membership deletion denies subsequent join/leave and removes stale room |
| Implementation 11: integration seed accounts/conversation | PASS | Alice/Bob membership, outsider denied |
| Mandatory acceptance 1: clean migration + seed | PASS | Real PostgreSQL 18 |
| Mandatory acceptance 2: register/login/duplicate/wrong password | PASS | HTTP integration tests |
| Mandatory acceptance 3: good token/no token/fake/expired | PASS | Real Socket.IO connections/connect_error |
| Mandatory acceptance 4: server socket identity | PASS | Namespace socket data assertion |
| Mandatory acceptance 5: member join/leave | PASS | ACKs plus room membership assertions |
| Mandatory acceptance 6: outsider denied/no leakage | PASS | Known/unknown ID forbidden, no unauthorized room membership; no domain broadcast handlers implemented |
| Mandatory acceptance 7: invalidation and socket lifecycle docs | PASS | Service/API/socket tests and lifecycle guide |
| Definition: relevant API/shared build, lint, tests | PASS | Commands above |
| Definition: authorization negative paths | PASS | Unauthorized/forbidden/invalid/internal error plus expiry/revocation coverage |
| Definition: secrets/data not debug-logged | PASS | No new credential/hash/content logging; placeholder telemetry disabled |
| Definition: migration/env/contracts/docs current | PASS | Migration and two docs; .env.example updated |
| Definition: completed baseline regressions | PASS with tooling limitation | Original root HTTP/unit tests retained and passed; web lint/webpack build passed; default Turbopack remains failing |
| Week 2 message persistence/binary transport implementation | NOT APPLICABLE | Explicitly excluded |

7. **Security and integrity review.** Passwords use random-salt asynchronous scrypt; refresh tokens use high entropy and digest-only persistence. Access JWT signature/algorithm/issuer/audience/expiry plus active session are checked. Client userId never grants access. Unknown/nonmember conversation responses match. Membership is checked through domain service on every protected room operation; no gateway Prisma access. Registration is transactional; refresh uses atomic compare-and-swap (concurrent result 201/401). DB keys prepare idempotency and sequence uniqueness; no claim is made that Week 2 sequence allocation exists. No raw tokens/password hashes/message contents were added to logs. Test users/conversation/session cascades were cleaned up and test PostgreSQL stopped. Ignored tmp holds local test artifacts only.

8. **Limitations/debt.** Idle sockets are disconnected on their next inbound action after logout/expiry, not proactively; revocation may occur after an in-flight authorization check. Membership changes remove stale room membership on the next protected action. No outbound domain data exists yet; future emitters must reauthorize/evict recipients before using rooms. No rate limiter, password recovery, scheduled session-row cleanup, or refresh-token-family replay revocation was introduced. Browser cookie/CSRF integration is outside scope. Prisma 6 seed config is deprecated for a future major upgrade. The scoped deepmerge-ts override is temporary compatibility/security debt; generation/migration/seed were revalidated with it. Remaining 8 high/1 critical audit package versions match the original lockfile (Next/tooling/Handlebars/etc.); broad dependency upgrades were not made. Default Turbopack production build still fails on this machine; webpack succeeds. These existing tooling/security limits remain visible and are not reported as passes.

9. **Git summary.** 38 changed/created files (21 modified, 17 new), no deletions. Tracked-file diff before adding new files to an index: +879/-74 lines; all new paths are listed above. No commit/push/merge/rebase performed. Suggested commit:

```text
feat(api): add persistent auth sessions and realtime membership authorization
```

10. **Stop.** Week 1 work is complete within the documented scope. Week 2 was not started.
