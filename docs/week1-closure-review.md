# Week 1 closure review — 19 October 2026

## 1. Findings and severity

**Recommendation: approve Week 1 with the documented development-tooling exception.** All available justified patch corrections have been applied, production dependency audit is clean, intended production build passes, and authorization lifecycle behavior is tested. No Week 2 implementation, commit, push, merge or rebase was performed. Existing working features and public realtime contracts were preserved.

| Finding | Severity / disposition |
| --- | --- |
| Next 16.3.6 image optimizer SSRF and related framework advisories | High package rating; fixed with same-line 16.3.8 patch |
| sharp 0.35.4 librsvg memory vulnerability | High; fixed to 0.35.5 within Next's existing range |
| source-map-js 1.2.1 indexed-map denial of service | High; fixed to 1.2.2 within existing ranges |
| Handlebars 4.7.9 compiler injection issues | Critical package rating, development-only; fixed to 4.7.10 within ts-jest's existing range |
| braces recursive-pattern denial of service and four inherited package findings | High advisory, development-only lint chain; no patched braces version exists; explicit residual exception below |
| Historical Turbopack PostCSS worker panic | Build reliability issue; not reproducible after patch/reinstall; supported webpack production command made explicit |
| Idle revoked sockets retain conversation rooms | High potential impact if future broadcasts blindly trust rooms; no outgoing conversation data exists in Week 1; mandatory Week 2 delivery gate specified, not implemented here |

Full audit: **29 -> 25 findings**, with **8 -> 5 high**, **1 -> 0 critical**, **20 moderate unchanged**. Production/omit-dev audit: **3 high -> 0 total**. The five remaining high package entries are one underlying braces advisory propagated through its dependency chain, not five independent vulnerabilities. Full audit still exits 1; it is not reported as clean.

## 2. Exact closure changes

These are changes relative to the already completed Week 1 working tree, not the earlier implementation's entire uncommitted diff.

| File | Justification |
| --- | --- |
| apps/web/package.json | Pin next and eslint-config-next 16.3.8; configure `build` as `next build --webpack` |
| package-lock.json | Record fixed Next/ESLint, sharp 0.35.5, source-map-js 1.2.2 and Handlebars 4.7.10; npm rehoisted packages/re-resolved compatible tooling transitive dependencies and optional platform binaries |
| apps/api/test/week1.e2e-spec.ts | Add three real socket lifecycle cases: JWT expiry, session expiry, direct revocation; assert idle stale membership and logout behavior without changing authorization implementation |
| docs/week1-backend.md | Document production command, exact room lifecycle, and required outbound recipient authorization/race invariant |
| docs/week1-report.md | Mark initial report as historical and link this superseding review |
| docs/week1-closure-review.md | Record audit triage, evidence, verification and closure recommendation |

No gateway/auth/conversation implementation, Prisma schema, migration or seed was changed in closure review. Generated tsbuildinfo was restored to its pre-review contents. No tests were weakened and no security bypass was introduced. No direct dependency major version changed, no audit-force command ran, and no blanket upgrade was applied. npm's compatible transitive re-resolution is visible in the lockfile and was covered by regressions.

## 3. Security audit triage

Evidence: `npm audit --json`, `npm audit --omit=dev --json`, `npm explain`, `npm ls`, registry patch-version checks and linked advisories. Classification is based on the dependency graph and actual source/config, not solely advisory severity.

| Affected package / vulnerability | Dependency and exposure | Actual WhatsUp applicability | Available non-breaking fix | Mandatory before Week 2? / result |
| --- | --- | --- | --- | --- |
| **next 16.3.6**: [image SSRF](https://github.com/advisories/GHSA-cjq9-62q9-8jv4); five other advisories listed below | Direct web production dependency | SSRF requires remotePatterns; none configured, so that specific attack is not applicable now. Static root exists, so SSG cache advisories are not dismissed wholesale. No draft-mode/use-cache or custom metadata image route exists. Dev-MCP issue is dev-server-only. Framework is an eventual public server boundary. | 16.3.8 same-line patch; keep eslint-config-next aligned. npm's suggested 16.4.2 is not required. | **Yes: fix available at runtime boundary; completed.** |
| **sharp 0.35.4**: [librsvg memory corruption](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | Transitive via Next; production installed | Advisory RCE conditions concern glibc Linux, not this Windows test host. Current images are bundled SVG logos; no user-image pipeline, remote allow-list or dangerous SVG option. Future Docker deployment/media could introduce exposure; do not carry vulnerable binary forward. | 0.35.5, satisfies Next's ^0.35.4 | **Yes: safe patch available; completed.** |
| **source-map-js 1.2.1**: [indexed source-map offset DoS](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | Transitive via Next -> PostCSS (production graph) and Tailwind/PostCSS (dev graph) | Primarily compilation/source-map handling, despite appearing in omit-dev audit. No endpoint ingests arbitrary user source maps. Malicious imported build inputs could exercise it. | 1.2.2 within existing ^1.2.1 ranges | **Yes: safe patch available; completed.** |
| **handlebars 4.7.9**: [AST injection](https://github.com/advisories/GHSA-8r5x-fm3f-whwj), [own-property bypass](https://github.com/advisories/GHSA-p8wg-vrv2-v86f), [unsafe inline template embedding](https://github.com/advisories/GHSA-xw65-4hp5-5hc7) | Transitive API dev dependency through ts-jest; absent from omit-dev graph | No application template/render endpoint and no runtime Handlebars import. Test tooling consumes trusted repository content, so no demonstrated network RCE path. Still relevant to toolchain integrity. | 4.7.10 within ts-jest's ^4.7.9; resolves all three advisories | **Yes: trivial critical dependency patch; completed.** |
| **braces 3.0.3**: [recursive brace-pattern stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Transitive web dev dependency through micromatch -> fast-glob -> Next ESLint plugin | No application API consumes glob patterns. Current lint rules/config are developer controlled. A crafted pattern could crash a lint/CI process if untrusted configuration is admitted. | **None**; registry latest 3.0.3 and advisory reports no patched version | **No for Week 2 development under this exception.** Reassess when upstream patch exists or before accepting untrusted lint patterns. |
| **micromatch 4.0.8**: inherits braces DoS | Transitive, dev-only, via fast-glob | Same developer-controlled lint-pattern path; no separate advisory here | No fix for underlying braces; npm's suggested ESLint 14 downgrade is a breaking/inappropriate Next 16 change | **No**, same exception |
| **fast-glob 3.3.1**: inherits micromatch/braces DoS | Transitive, dev-only, via @next/eslint-plugin-next | Same lint tooling path; no request-time code path | No safe underlying fix available | **No**, same exception |
| **@next/eslint-plugin-next 16.3.8** (16.3.6 before): inherits fast-glob chain | Transitive web dev dependency through eslint-config-next | Lint only; patching the framework/plugin did not resolve the unpatched braces advisory | No compatible fix identified; no downgrade or rule removal applied | **No**, same exception |
| **eslint-config-next 16.3.8** (16.3.6 before): inherits plugin chain | **Direct** web dev dependency | Lint config; not installed in omit-dev production graph | No compatible fix for underlying advisory; npm proposes 14.2.35 major downgrade, rejected | **No**, same exception |

Next's other advisories, all removed by 16.3.8:

| Advisory | WhatsUp applicability before patch |
| --- | --- |
| [GHSA-3w37-wq28-93x7](https://github.com/advisories/GHSA-3w37-wq28-93x7), draft/cache data mixing | No draft mode/use-cache path found |
| [GHSA-4jqv-mc3x-m676](https://github.com/advisories/GHSA-4jqv-mc3x-m676), SSG/ISR cache poisoning | Static page exists; future self-hosted service is within framework surface; patch applied |
| [GHSA-39w2-rjm5-chcv](https://github.com/advisories/GHSA-39w2-rjm5-chcv), development MCP information exposure | Dev-server surface only; no production runtime exposure from this advisory |
| [GHSA-f87g-xv8r-7p7x](https://github.com/advisories/GHSA-f87g-xv8r-7p7x), metadata image route access | No custom dynamic metadata image route found |
| [GHSA-mcj8-r9mp-w47p](https://github.com/advisories/GHSA-mcj8-r9mp-w47p), SSG/ISR response/cache substitution | Static page present; no private per-user web page yet; patch applied |

**Residual decision:** accept the single unpatched braces issue in trusted development lint tooling for Week 1 closure, owned by Faruk Turnali. Do not downgrade Next/ESLint, suppress the advisory, remove lint, or pass user-supplied glob/config input to this chain. Recheck during Week 2 dependency maintenance and before deployment/CI changes that expand its trust boundary. The 20 remaining moderate records are also dev-only according to omit-dev audit and remain a dependency-maintenance item; their exploitability was not exhaustively reviewed in this high/critical-focused task. Production images should omit development dependencies; building can use them in a separate stage. The existing scoped Prisma deepmerge-ts 8.0.2 security override was preserved.

## 4. Turbopack/webpack investigation and resolution

The historical 16.3.6 panic log located the failure in `globals.css -> PostCssTransformedAsset -> node worker creation`, with the child exiting 0 before the Turbopack parent connected. That is a worker startup/IPC failure, not a reported TypeScript, CSS syntax or unsupported-plugin error. The other original error was Google Fonts retrieval blocked by restricted network access.

The project uses standard Tailwind PostCSS config and an otherwise empty next.config.ts. The installed Next documentation explicitly supports PostCSS workers, Tailwind and `--webpack`; no unsupported feature or conflicting bundler configuration was identified. See [official bundler documentation](https://nextjs.org/docs/app/api-reference/turbopack).

After the same-line security patch and normal npm dependency reinstallation, **explicit Turbopack succeeded** with the same application source/PostCSS/Next config. Thus no project-config workaround or feature rewrite is justified. Evidence points to a historical toolchain/worker execution state problem, but the exact trigger is **not conclusively isolated** between old Next/native runtime, dependency layout/cache and execution environment: patching and reinstallation were not independent experiments. It would be inaccurate to claim that Windows, sandboxing alone, or a proven fixed upstream bug was definitively responsible.

Resolution: configure the supported, already reliable production path explicitly as `next build --webpack`. Canonical root command is **`npm run build:web`**; web lint and that exact command pass, including Next's TypeScript check/static generation. Dev remains `next dev`. Turbopack is not required for production closure and its diagnostic path also passes now. Fresh Google Font downloads still need build-time network access; no fonts or checks were stubbed out.

## 5. Realtime authorization lifecycle assessment

Inspected RealtimeGateway, AuthService, ConversationAuthorizationService and both socket test files. No implementation rewrite was needed.

| Transition | New connections | New inbound packets | Idle socket / room state |
| --- | --- | --- | --- |
| Access JWT expires | connect_error | Middleware verifies JWT again and disconnects before event handler; applies even to an unrecognized event | No expiry timer/poll; socket remains connected/roomed until traffic or transport teardown |
| Logout with current refresh token | connect_error for that session | DB revokedAt is checked; disconnects before handler | No proactive push/disconnect; other login sessions are independent |
| Direct session revocation | connect_error | Same DB check and disconnect | No proactive eviction |
| Session expires | connect_error | Same DB deadline check and disconnect | No proactive eviction |
| Conversation membership removed | Handshake still valid (conversation membership is not global auth) | Valid join/leave for that conversation re-queries membership, returns FORBIDDEN and leaves its room | Removed member remains in stale room while idle; unknown/invalid/other-conversation events do not sweep that room |

A successful join is not a permanent grant. Packet authentication checks token/session, not every historical room membership; membership is checked by the protected domain action. Inbound authentication/authorization uses the state observed at the check; an already authorized in-flight operation can finish if revocation commits afterward.

**Future outbound broadcast risk:** Socket.IO inbound middleware is not invoked for server emissions. A raw room broadcast would include idle stale/revoked recipients. Week 1 has no `message:new` emitter or conversation data broadcasting, so no such disclosure path currently exists. Room naming privacy is not a security mechanism; deterministic room IDs are protected by server authorization.

**Required Week 2 invariant, before any `message:new`:** the message must be committed, and every specific recipient must have an unexpired access credential, active matching session and current conversation membership at dispatch/enqueue. Enumerate candidate sockets, apply a per-recipient gate, skip/evict unauthorized recipients, disconnect expired/revoked sessions, and fail closed on authorization/database errors. Do not emit to an unchecked conversation room. Apply this gate on every node/worker; Redis room replication alone provides no authorization.

**Race requirement:** revocation committed before delivery authorization/enqueue must exclude that recipient. A membership read then asynchronous emit alone leaves a TOCTOU gap. The future implementation must coordinate final checks/enqueue with all session/membership revocation writers through shared per-session/per-membership serialization, or an equivalent ordered authorization-version protocol across workers. Check token time immediately before enqueue and keep the authorization ordering boundary through enqueue. Packets already enqueued before revocation cannot be recalled. This guarantee is a Week 2 release gate, **not an implemented Week 1 feature**. Add idle recipient, outage and concurrent revocation-vs-delivery negative tests before enabling broadcasts. [Full invariant](week1-backend.md#required-week-2-outbound-authorization-invariant-specification-only).

## 6. Exact verification and results

Commands ran from repository root unless their workspace flag says otherwise. For E2E, DATABASE_URL pointed to the pre-existing isolated loopback PostgreSQL test cluster on port 55439, and JWT_ACCESS_SECRET was exported as a synthetic test value. Raw tokens were not printed.

| Command | Result |
| --- | --- |
| npm audit --json (before and after) | Before exit 1: 29 total (20 moderate, 8 high, 1 critical). After exit 1: 25 total (20 moderate, 5 high, 0 critical). JSON reports preserved under ignored tmp/week1-closure-audit-before.json / -after.json |
| npm audit --omit=dev --json (before and after) | Before exit 1: 3 high. After exit 0: **0 findings** |
| npm outdated --json | Exit 1: available versions listed; no blanket update performed |
| npm view next@16.3.8 version; npm view eslint-config-next@16.3.8 version | Both available: 16.3.8 |
| npm view handlebars version; npm view braces version; npm view sharp version; npm view source-map-js version | 4.7.10; 3.0.3; 0.35.5; 1.2.2 |
| npm explain handlebars; npm explain source-map-js; npm explain braces | PASS: dependency/exposure paths confirmed |
| npm install --ignore-scripts | PASS after web manifest patch; no install-time script bypass approval or force used |
| npm update handlebars sharp source-map-js --ignore-scripts | PASS: compatible patch resolution; no new direct dependencies |
| npm ls next eslint-config-next handlebars sharp source-map-js deepmerge-ts | PASS: 16.3.8, 16.3.8, 4.7.10, 0.35.5, 1.2.2, existing 8.0.2 override |
| npm exec --workspace=apps/api -- prettier --write test/week1.e2e-spec.ts | PASS |
| npm run build --workspace=packages/shared | PASS |
| npm run build:api | PASS |
| npm run test:typecheck --workspace=apps/api | PASS, source/tests/seed included |
| npm run lint:api | PASS |
| npm test --workspace=apps/api -- --runInBand | PASS: 2 suites, **4 tests** |
| npm run test:e2e --workspace=apps/api -- --runInBand | Final PASS: 2 suites, **10 tests**, clean exit |
| npm run lint:web | PASS |
| npm exec --workspace=apps/web -- next build --turbopack | PASS on 16.3.8: compile, TypeScript check, static rendering |
| npm run build:web | PASS with configured webpack: compile, TypeScript check, static rendering |
| git diff --check | PASS |
| PostgreSQL pg_ctl start / psql fixture row counts / pg_ctl stop | PASS; cleanup left only seed's **3 users / 1 conversation / 2 memberships**; test server stopped |
| Migration and seed rerun | **NOT APPLICABLE to closure change**: no schema/migration/seed file changed; prior clean migration/seed evidence preserved |

One initial new expiry test failed (9 passed, 1 failed) because a global Date.now mock affected the Socket.IO client's timeout logic, causing client disconnect before server eviction. The test was corrected to wait for a real five-second signed JWT expiry, retaining assertions on server disconnection and room cleanup. Final 10-test run passed; no authentication behavior or assertion was bypassed. Existing VM-module experimental warning remains informational.

## 7. Remaining risks and assignment

| Risk | Assigned milestone / condition |
| --- | --- |
| Unpatched braces advisory propagated through five dev-tool packages | Accepted Week 1 exception; Faruk to re-audit during Week 2 maintenance and whenever upstream patch/trust boundary changes; not a runtime blocker |
| 20 moderate dev-only audit records | Week 2 dependency triage, before production CI/deployment approval; no claim of individual high-depth review here |
| Idle revoked sockets remain roomed and raw room broadcasts would leak | **Mandatory Week 2 message-delivery gate before first broadcast**, including per-recipient checks and concurrent revocation ordering tests |
| Historical Turbopack trigger not uniquely isolated | Tooling follow-up when reproducible; no blocker with explicit verified webpack build and currently passing Turbopack |
| Google Fonts needed on fresh builds | Build environment prerequisite now documented; revisit self-hosting/caching with deployment setup |
| Existing auth rate limiting, session cleanup and refresh-family replay tracking are absent | Carry forward prior operational hardening debt; schedule before public deployment, not silently bundled into message implementation |

## 8. Closure recommendation

**Approve Week 1** with the explicitly bounded braces development-tooling exception and the documented historical Turbopack uncertainty. All safe available high/critical patch fixes are applied, runtime audit is zero, documented production build/lint/typecheck pass, and **14 total unit/integration tests** pass. There is no remaining demonstrated Week 1 runtime authorization failure. This is a weekly-scope closure recommendation, not unrestricted production deployment approval. Week 2 must satisfy the outbound invariant before emitting any message data. No Week 2 work has started. No commit, push, merge or rebase performed. Stop after this report.
