# Changelog

All notable changes to the User Authentication System.

## [1.0.0] - 2026-02-20

### Added

#### Core Features
- **User Registration** (US1): Email/password registration with bcrypt hashing (cost 12), email uniqueness validation, welcome email, and JWT token issuance
- **User Login** (US2): Email/password authentication, JWT token (24-hour expiry), email enumeration prevention, audit logging
- **Password Reset** (US3): Time-limited (1-hour) email reset links, single-use tokens, one-click password reset
- **Session Management** (US4): JWT-based stateless sessions, 24-hour expiry, immediate logout capability, token blacklisting
- **Password Change** (US5): Authenticated password update with current password verification

#### API Endpoints
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login with JWT
- `GET /api/auth/me` — Get current user (protected)
- `POST /api/auth/logout` — Logout (protected)
- `POST /api/auth/password-reset/request` — Request password reset
- `POST /api/auth/password-reset/confirm` — Confirm password reset
- `POST /api/auth/password-change` — Change password (protected)
- `GET /api/health` — Health check

#### Infrastructure
- PostgreSQL 15+ with 3 database tables: `users`, `password_resets`, `auth_events`
- JWT HS256 tokens with configurable expiry
- bcrypt password hashing (NIST 800-63B compliant, cost factor 12)
- Express.js with TypeScript strict mode
- Pino structured logging with sensitive field redaction
- Rate limiting on authentication endpoints
- CORS configuration
- Request ID tracking for distributed tracing
- Background cleanup jobs for expired reset tokens and old audit events

#### Security
- Password hashes never exposed in API responses
- Email enumeration prevention on login and password reset
- Generic error messages for authentication failures
- Rate limiting on auth endpoints (10 req/15min)
- Audit log for all authentication events (no sensitive data)
- JWT token blacklist for immediate invalidation
- Input validation with express-validator
- UUID v4 tokens (cryptographically random)

#### Developer Experience
- OpenAPI 3.0 specification at `specs/001-user-auth/contracts/api.openapi.yaml`
- Comprehensive test suite (unit, integration, E2E)
- Docker and docker-compose configuration
- Database migration runner (up/down)
- Pre-commit validation script
- ESLint + Prettier code quality tooling
