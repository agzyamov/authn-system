# Implementation Plan: User Authentication System

**Branch**: `001-user-auth` | **Date**: 2026-02-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-user-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

User authentication system supporting registration (email/password), JWT-based login with 24-hour token expiry, password reset via email, and secure session management. Built with Express.js/TypeScript backend, PostgreSQL persistence, bcrypt password hashing, and JWT for stateless authentication.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 18 LTS (aligns with constitution requirement)  
**Primary Dependencies**: Express.js 4.x (web framework), bcrypt (password hashing), jsonwebtoken (JWT generation/validation)  
**Storage**: PostgreSQL 15+ (user accounts, password reset tokens, audit logs)  
**Testing**: Jest (unit/integration tests per constitution testing pyramid)  
**Target Platform**: Linux server (Docker containerized deployment)
**Project Type**: Web backend (single backend service, RESTful API)  
**Performance Goals**: <2s login response time (per SC-002), 100 concurrent login requests without >3s delay (per SC-007)  
**Constraints**: <200ms p95 token validation, password hashing latency <1s per login (bcrypt cost factor)  
**Scale/Scope**: 10k initial users, 4 core user stories (registration, login, password reset, session management)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Required Gates (from Constitution v1.0.0)

✅ **TypeScript Strict Mode**: `tsconfig.json` with `strict: true` enforced  
✅ **Testing Pyramid**: 80% business logic coverage (auth flows, password validation, JWT operations)  
✅ **JSDoc Documentation**: All exported functions/classes/interfaces documented  
✅ **Security-First**: OWASP standards, no password logging, input validation, environment secrets  
✅ **Clean Code**: SOLID principles, max 20-line functions, no magic numbers  
✅ **ESLint + Prettier**: Zero warnings in CI/CD  

**Evaluation**: ✅ ALL GATES PASSED - No violations detected, design aligns with constitution.

**Dependencies Check**:
- Express.js: Standard Node.js framework, mature ecosystem
- bcrypt: Industry-standard password hashing (OWASP approved)
- jsonwebtoken: Standard JWT implementation
- PostgreSQL: ACID-compliant relational DB
- Jest: Constitution-mandated testing framework

**Security Alignment**:
- FR-005: bcrypt hashing (constitution compliant)
- FR-010: JWT token validation (security-first)
- FR-012/FR-013: Audit logging without sensitive data (security-first)
- Environment variables for secrets (constitution requirement)

## Project Structure

### Documentation (this feature)

```text
specs/001-user-auth/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.openapi.yaml # OpenAPI 3.0 REST API specification
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/              # Data models (User, PasswordReset entities)
├── services/            # Business logic (AuthService, EmailService, TokenService)
├── middleware/          # Express middleware (authentication, validation, error handling)
├── routes/              # API route handlers (auth routes)
├── config/              # Configuration (database, JWT secret, email)
├── utils/               # Utilities (password validation, email format)
└── server.ts            # Express app initialization

tests/
├── unit/                # 60% - Service layer, utilities, validators
├── integration/         # 30% - Auth flows, database operations, API endpoints
└── e2e/                 # 10% - Full registration/login/reset scenarios

database/
├── migrations/          # PostgreSQL schema migrations
└── seeds/               # Test data for development

.env.example             # Environment variable template
tsconfig.json            # TypeScript strict mode configuration
jest.config.js           # Jest testing configuration
```

**Structure Decision**: Single backend project structure selected. Web application structure (frontend/backend split) not needed as this is API-only service. Mobile structure not applicable. This follows "single project" pattern with clear separation of concerns: models (data), services (business logic), routes (API), and middleware (cross-cutting).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations detected. All constitution requirements are satisfied by the chosen technology stack and architecture.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Post-Phase 1 Constitution Re-evaluation

*Re-checked after completing research.md, data-model.md, contracts/, and quickstart.md*

### Design Validation

✅ **TypeScript Strict Mode**: Confirmed in Technical Context, tsconfig.json will enforce `strict: true`  
✅ **Testing Pyramid**: 80% coverage target documented in quickstart.md (60% unit, 30% integration, 10% e2e)  
✅ **JSDoc Documentation**: All TypeScript interfaces in data-model.md include JSDoc comments; will be enforced in code  
✅ **Security-First**: 
  - bcrypt cost factor 12 (research.md)
  - JWT HS256 with environment variable secret (research.md)
  - Email enumeration prevention (contracts/api.openapi.yaml)
  - Audit logging without sensitive data (data-model.md: AuthEvent entity)
✅ **Clean Code**: Data model entities follow single responsibility; services separated from routes in project structure  
✅ **ESLint + Prettier**: Listed in quickstart.md commands (`npm run lint`, `npm run format:check`)

### Architecture Validation

**API Design** (contracts/api.openapi.yaml):
- REST endpoints follow standard conventions (POST /register, POST /login, etc.)
- Error responses conform to security requirements (generic messages, no enumeration)
- OpenAPI 3.0 spec provides contract for testing and documentation

**Data Model** (data-model.md):
- Three normalized entities (User, PasswordReset, AuthEvent) follow database best practices
- UUID primary keys prevent enumeration
- Proper indexing for performance (email, reset_token, created_at)
- Foreign key constraints maintain referential integrity

**Deployment Readiness** (quickstart.md):
- Environment variable configuration (no hardcoded secrets)
- Database migration strategy documented
- Development and production modes separated
- Health check endpoint for monitoring

**Final Evaluation**: ✅ **ALL GATES PASSED** - Design adheres to constitution v1.0.0. No technical debt introduced. Ready for Phase 2 (task breakdown via `/speckit.tasks` command).

---

## Phase Status

- ✅ **Phase 0 (Research)**: Complete - [research.md](research.md)  
- ✅ **Phase 1 (Design)**: Complete - [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)  
- ⏸️ **Phase 2 (Task Breakdown)**: Pending - Run `/speckit.tasks` to generate [tasks.md](tasks.md)
