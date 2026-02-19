# Research: User Authentication System

**Feature**: 001-user-auth  
**Date**: 2026-02-20  
**Status**: Phase 0 Complete

## Overview

This document consolidates research findings for technical decisions required to implement the user authentication system. All NEEDS CLARIFICATION items from the feature spec are resolved here.

---

## Decision 1: Password Reset Token Expiry Duration

**Context**: Feature spec (User Story 3) requires password reset links with time-limited validity but duration was marked "NEEDS CLARIFICATION".

**Decision**: **1 hour (3600 seconds)**

**Rationale**:
- Industry standard for password reset flows (used by GitHub, Google, AWS)
- Balances security (short window for token theft) with UX (reasonable time to check email and complete reset)
- OWASP Authentication Cheat Sheet recommends "short-lived" tokens, typically 1-2 hours maximum
- Longer durations (24h) increase attack surface; shorter (<15min) create UX friction

**Alternatives Considered**:
- **15 minutes**: Too short for users who check email infrequently or on mobile devices
- **24 hours**: Excessive time window increases risk if link is intercepted or forwarded
- **Custom per-user**: Adds unnecessary complexity for minimal benefit

**Implementation**: Store `expires_at = created_at + 1 hour` in `password_resets` table.

---

## Decision 2: bcrypt Cost Factor for Password Hashing

**Context**: Constitution requires bcrypt for password hashing. Cost factor determines hash computation time and security strength.

**Decision**: **Cost factor 12**

**Rationale**:
- Cost factor 12 produces ~250-300ms hash time on modern hardware (2020+ CPUs)
- Meets spec requirement of <1s password hashing latency (FR-005, Assumptions section)
- OWASP recommendation: cost factor 10-12 for web applications (2024 guidance)
- Protects against brute-force attacks: 2^12 = 4096 iterations significantly slows cracking attempts
- Scalable: Can increase to 13-14 as hardware improves without code changes

**Alternatives Considered**:
- **Cost factor 10**: Faster (~100ms) but lower security margin; OWASP recommends 12+ for new apps
- **Cost factor 14**: ~1 second hash time exceeds performance constraint (SC-002: 2s total login time)
- **PBKDF2**: Constitution allows it, but bcrypt specifically requested by user and more resistant to GPU acceleration

**Implementation**: `bcrypt.hash(password, 12)` in registration and password change flows.

---

## Decision 3: JWT Signing Algorithm and Secret Management

**Context**: JWT tokens require signing algorithm and secret key configuration for secure token generation/validation.

**Decision**: **HS256 (HMAC-SHA256) with 256-bit secret from environment variable**

**Rationale**:
- HS256 is symmetric algorithm: simple, fast, suitable for single-service authentication
- 256-bit secret provides sufficient entropy (recommended minimum for HS256)
- Secret stored in `JWT_SECRET` environment variable (constitution requirement: no hardcoded secrets)
- jsonwebtoken library default algorithm, widely vetted
- Performance: ~1ms token generation/validation vs ~10ms for RSA algorithms

**Alternatives Considered**:
- **RS256 (RSA asymmetric)**: Overkill for single backend service; needed only for multi-service token sharing with public key verification
- **HS512**: Marginally stronger but unnecessary; no performance benefit for authentication use case
- **ES256 (ECDSA)**: Asymmetric algorithm, adds complexity without benefit for this architecture

**Implementation**:
```typescript
jwt.sign({ userId }, process.env.JWT_SECRET, { 
  algorithm: 'HS256', 
  expiresIn: '24h' 
});
```

**Security Note**: Secret must be generated via `openssl rand -base64 32` (documented in README) and never committed to Git.

---

## Decision 4: Email Service Integration Approach

**Context**: Password reset and registration confirmation require email delivery. Spec assumption: "email delivery is reliable".

**Decision**: **Abstract email service interface with nodemailer implementation**

**Rationale**:
- Nodemailer: industry standard for Node.js email (10M+ weekly downloads)
- Supports SMTP (Gmail, SendGrid, SES) and transactional email services
- Interface abstraction allows swapping providers (SendGrid → SES) without business logic changes
- Graceful failure handling: log errors, return HTTP 500 with generic message (avoid email enumeration per FR-004)

**Alternatives Considered**:
- **Direct SendGrid SDK**: Vendor lock-in; harder to migrate or test with local SMTP
- **AWS SES SDK**: Same lock-in issue; requires AWS account for development
- **In-memory queue (Bull/Redis)**: Premature optimization; adds complexity for minimal benefit at 10k user scale

**Implementation**:
```typescript
interface IEmailService {
  sendPasswordReset(email: string, resetLink: string): Promise<void>;
  sendWelcome(email: string): Promise<void>;
}

class NodemailerEmailService implements IEmailService { ... }
```

**Development**: Use nodemailer's `ethereal.email` test accounts (no real email sent) or local SMTP server (mailhog).

---

## Decision 5: Database Schema Design for Authentication

**Context**: PostgreSQL schema for users, password resets, and audit logging requires careful design for performance and security.

**Decision**: **Three-table schema with indexed queries**

**Schema**:

**`users` table**:
- `id` (UUID, primary key)
- `email` (VARCHAR(255), UNIQUE, indexed for fast lookups)
- `password_hash` (VARCHAR(255), bcrypt output)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**`password_resets` table**:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users.id, indexed)
- `reset_token` (VARCHAR(255), UNIQUE, indexed)
- `created_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP, indexed for expiry cleanup)
- `used_at` (TIMESTAMP, nullable)

**`auth_events` table** (audit log per FR-012):
- `id` (SERIAL, primary key)
- `user_id` (UUID, foreign key → users.id, nullable for failed attempts)
- `event_type` (VARCHAR(50): 'registration', 'login', 'logout', 'password_reset_request', 'password_reset_complete')
- `ip_address` (INET type)
- `user_agent` (TEXT)
- `created_at` (TIMESTAMP, indexed for log queries)

**Rationale**:
- UUID for `id` prevents enumeration attacks and supports distributed systems
- Email index on `users` enables O(1) lookup for login (meets SC-002: <2s response)
- `password_resets` separate table allows one-time use tracking and easy expiry cleanup
- `auth_events` provides audit trail (FR-012) without bloating `users` table
- No session storage table: JWT is stateless (per Assumptions in spec)

**Alternatives Considered**:
- **Single users table with reset fields**: Doesn't support multiple pending resets; harder to enforce one-time use
- **Auto-incrementing integer IDs**: Exposes user count and enables enumeration
- **Separate sessions table**: Unnecessary for stateless JWT; violates YAGNI until token revocation needed

**Migrations**: Use `node-pg-migrate` or `db-migrate` for version-controlled schema evolution.

---

## Decision 6: Session Management Pattern

**Context**: Spec requires 24-hour JWT expiry and logout capability (FR-011). Pure stateless JWT cannot be invalidated before expiry.

**Decision**: **Stateless JWT with optional token blacklist for logout**

**Rationale**:
- Stateless JWT aligns with spec assumption: "no server-side session storage required initially"
- Token blacklist added only if logout is critical (FR-011 requirement)
- Blacklist implementation: Redis with TTL matching token expiry (24h) for automatic cleanup
- Compromise: stateless for performance, stateful revocation only when needed

**Implementation**:
- **Phase 1 (MVP)**: Pure stateless JWT, logout is client-side only (delete token from storage)
- **Phase 1.5 (if FR-011 enforced)**: Add Redis blacklist check in authentication middleware

**Blacklist Pseudocode** (if needed):
```typescript
// On logout: POST /auth/logout
await redis.setex(`blacklist:${tokenId}`, 86400, '1'); // 24h TTL

// In auth middleware:
const isBlacklisted = await redis.get(`blacklist:${tokenId}`);
if (isBlacklisted) throw new UnauthorizedError();
```

**Alternatives Considered**:
- **Server-side sessions with Redis**: Violates "stateless" assumption; adds database call to every request
- **Short-lived tokens (15min) + refresh tokens**: Adds complexity; not required by spec (24h expiry is explicit)

**Trade-off**: Stateless JWT means tokens valid until expiry even if password changed. Mitigated by invalidating tokens on password change (FR-009) via token version claim or blacklist.

---

## Decision 7: Input Validation Strategy

**Context**: FR-014 requires input validation for email, password, and tokens before processing.

**Decision**: **express-validator middleware with custom validators**

**Rationale**:
- express-validator: standard Express.js validation library, integrates with routes
- Declarative validation rules readable and testable
- Custom validators for business rules (password strength, email domain blacklist)
- Fails fast: validation errors return 400 Bad Request before hitting business logic

**Validation Rules**:
- **Email**: RFC 5322 format via `isEmail()`, normalized to lowercase, max 255 chars
- **Password**: Min 8 chars (FR-003), no max (bcrypt handles up to 72 bytes), no complexity requirements (NIST 800-63B recommends length over complexity)
- **Reset Token**: UUID v4 format, prevents injection attacks

**Alternatives Considered**:
- **Joi validation library**: More features but heavier; express-validator sufficient for auth use case
- **Manual validation**: Error-prone, violates DRY principle
- **zod (TypeScript schema validation)**: Modern choice but less Express-integrated; consider for future refactor

**Implementation Example**:
```typescript
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  validationErrorHandler
], registerController);
```

---

## Decision 8: Error Response Strategy (Security)

**Context**: FR-004 requires preventing email enumeration during login and password reset.

**Decision**: **Generic error messages with timing attack mitigation**

**Error Responses**:
- Login failure (wrong password or non-existent email): `"Invalid credentials"` (no specifics)
- Password reset for non-existent email: Still send 200 OK, log attempt but don't send email
- Registration with existing email: `"Email already registered"` (acceptable here per usability)

**Timing Attack Mitigation**:
- Always hash password comparison even if email doesn't exist (constant-time operation)
- bcrypt naturally provides timing consistency via fixed cost factor

**Rationale**:
- OWASP recommendation: avoid revealing whether account exists
- Registration email enumeration acceptable: users need feedback to avoid duplicate accounts
- Password reset "silent success" protects privacy without confusing users

**Implementation**:
```typescript
// Login: always hash even if user not found
const user = await findUserByEmail(email);
const passwordHash = user?.password_hash || '$2b$12$placeholder'; // dummy hash
const isValid = await bcrypt.compare(password, passwordHash);
if (!user || !isValid) throw new InvalidCredentialsError();
```

---

## Summary of Resolved Clarifications

| Item | Original Status | Resolution |
|------|----------------|------------|
| Password reset token expiry | NEEDS CLARIFICATION | 1 hour (3600s) |
| bcrypt cost factor | Implicit in spec | Cost factor 12 (~300ms) |
| JWT algorithm | Not specified | HS256 with 256-bit secret |
| Email service | "Reliable" assumption | nodemailer with interface abstraction |
| Session storage | "No server-side storage initially" | Stateless JWT + optional Redis blacklist |
| Database schema | Not specified | 3-table design (users, password_resets, auth_events) |
| Input validation | FR-014 mandate | express-validator middleware |
| Error responses | FR-004 anti-enumeration | Generic messages + timing mitigation |

---

## Technology Stack Summary

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| Runtime | Node.js | 18 LTS | Constitution requirement, long-term support |
| Language | TypeScript | 5.x | Constitution mandate (strict mode) |
| Web Framework | Express.js | 4.x | Industry standard, middleware ecosystem |
| Database | PostgreSQL | 15+ | ACID compliance, JSONB for future extension |
| Password Hashing | bcrypt | Latest | OWASP approved, GPU-resistant |
| JWT Library | jsonwebtoken | 9.x | Standard implementation, 50M+ weekly downloads |
| Email | nodemailer | 6.x | SMTP abstraction, provider-agnostic |
| Validation | express-validator | 7.x | Declarative, Express-integrated |
| Testing | Jest | 29.x | Constitution mandate, TypeScript support |
| API Documentation | OpenAPI 3.0 | N/A | REST contract definition (Phase 1 output) |

---

## Next Steps (Phase 1)

1. **data-model.md**: Define TypeScript interfaces for User, PasswordReset, AuthEvent entities
2. **contracts/api.openapi.yaml**: Generate OpenAPI spec for registration, login, logout, password reset endpoints
3. **quickstart.md**: Document environment setup, database initialization, running tests
4. **Update agent context**: Add Express.js, PostgreSQL, bcrypt, JWT to `.specify/memory/copilot-instructions.md`

---

**Research Complete**: All technical unknowns resolved. Ready for Phase 1 design.
