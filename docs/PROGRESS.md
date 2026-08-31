# ApnaTutor — Progress Journal

> Update this **in the same session as the code change**, never later. If a session ends without a changelog entry, the next session starts blind.

**Current milestone:** M1 — Accounts, profiles & trust
**Overall:** █░░░░░░ M0 complete

---

## Next 3 actions

Read this first when resuming. Keep it to exactly three, always current.

1. Write `V2__identity.sql` — `users`, `otp_codes`, `refresh_tokens` — with the `set_updated_at` trigger attached to each, then the matching JPA entities. `ddl-auto: validate` will catch any drift.
2. Build the OTP flow: `SmsSender` interface + console stub, request/verify endpoints, rate limits from SoT §3.4 (10 min TTL, 5 attempts, 5 sends/hour).
3. Add the shared web plumbing the first real endpoints need — `ApiError` response shape, `@RestControllerAdvice` handler, pagination wrapper, springdoc at `/swagger-ui`. These were deliberately deferred out of M0.

---

## Milestone status

| Milestone | Status |
|---|---|
| M0 — Foundation | ✅ Done (2026-08-31) |
| M1 — Accounts, profiles & trust | 🟡 Next |
| M2 — Catalog & discovery | ⬜ Not started |
| M3 — Requirements & lead loop | ⬜ Not started |
| M4 — Credits & payments | ⬜ Not started |
| M5 — Reviews, admin & trust | ⬜ Not started |
| M6 — Polish & launch | ⬜ Not started |

---

## Changelog

### 2026-08-31 — Project born

**Decided**
- Name **ApnaTutor**, India-first, lead-credit business model (not booking-commission).
- Spring Boot REST backend + Next.js frontend + native PostgreSQL, no Docker.
- Full rationale for all ten founding decisions is in the SoT decision log.

**Environment audit (this machine)**
- Found: JDK 26, Maven/Gradle caches, IntelliJ.
- Missing: Node, Git, PostgreSQL, Maven CLI, any LTS JDK.
- Resolution: installed Node 24.19.0 LTS + Git 2.55.0 via winget; PostgreSQL 18 installing. Maven CLI not needed — the Maven wrapper (`mvnw.cmd`) is bundled. Stayed on JDK 26 rather than installing an LTS, because Spring Initializr lists Java 26 as supported for Boot 4.1.1 (ADR #4, with Temurin 21 as the documented fallback).

**Built**
- Repo at `C:\Users\HP\IdeaProjects\apnatutor`.
- Backend scaffolded from Spring Initializr: Boot 4.1.1, Java 26, Maven, with Web MVC, Security, Data JPA, Validation, Actuator, Flyway, PostgreSQL driver, Lombok, config processor.
- `docs/SOURCE_OF_TRUTH.md`, `docs/PLAN.md`, `docs/PROGRESS.md`.

**M0 completed — verified, not assumed**
- PostgreSQL 18.6 installed as service `postgresql-x64-18`; `psql` added to the user PATH; `apnatutor` role and both databases created with `pg_trgm`.
- Next.js 16.3.3 / React 19.2.8 / Tailwind 4 scaffolded.
- Single repo-root `.env` now feeds both apps — backend via `spring.config.import` (no dotenv dependency; Spring parses it natively with the `[.properties]` hint), frontend via `loadEnvConfig("..")` in `next.config.ts`. JWT secret generated with `crypto.randomBytes(48)`.
- `SecurityConfig` added: default-deny with an explicit public allowlist, CORS bound to the configured frontend origin, BCrypt encoder.
- **Verification actually run:** `mvnw verify` → BUILD SUCCESS, 1 test, 0 failures. `npm run build` → clean, TypeScript passed. `/actuator/health` → `status: UP`, `db: UP`. Page fetched from `localhost:3000` contained three server-rendered `UP` pills — so Next→Boot→Postgres is proven end to end, and proven *in the HTML source*, which is what the SEO strategy depends on.

**Notes for next time**
- Spring Boot 4.x renamed things: the starter is `spring-boot-starter-webmvc`, not `-web`, and test support is split into per-starter `*-test` artifacts. Boot 3 tutorials will not match this `pom.xml`.
- Local Postgres superuser password is `postgres`; app role is `apnatutor`/`apnatutor`. Local only.
- Deliberately deferred from M0 to M1: global error handler, `ApiError` shape, pagination wrapper, springdoc. There were no endpoints to apply them to yet, and building them against imagined endpoints tends to produce the wrong abstraction.

---

## Known issues

- **`CorsConfigurationSource` cannot be injected by type** in Spring Boot 4 — `mvcHandlerMappingIntrospector` also implements it, so `@Bean SecurityFilterChain(HttpSecurity, CorsConfigurationSource)` fails startup with `NoUniqueBeanDefinitionException`. Fixed by calling the `corsConfigurationSource()` bean method directly. Watch for the same trap with any other type Spring MVC implements incidentally.
- Mockito warns it is self-attaching as a JVM agent, which future JDKs will disallow. Harmless today; when it becomes an error, add Mockito as an explicit `-javaagent` in the Surefire config. Plausibly arrives sooner on Java 26 than on an LTS (ADR #4).

---

## Blockers

*None.*
