# User Authentication System

A secure, production-ready RESTful API for user authentication built with **TypeScript**, **Express.js**, **PostgreSQL**, and **JWT**.

## Features

- **User Registration** — Email/password with bcrypt hashing and validation
- **JWT-based Login** — 24-hour token expiry with stateless authentication
- **Password Reset** — Time-limited (1-hour) email reset links
- **Session Management** — Token expiry, logout, and invalidation
- **Password Change** — Authenticated password update with token invalidation
- **Audit Logging** — Security event tracking without sensitive data exposure
- **Rate Limiting** — Brute-force protection on auth endpoints

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18 LTS |
| Language | TypeScript 5.x (strict mode) |
| Framework | Express.js 4.x |
| Database | PostgreSQL 15+ |
| Auth | JWT (HS256), bcrypt (cost 12) |
| Testing | Jest (unit, integration, E2E) |
| Deployment | Docker |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd authn-system

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials and secrets

# Run database migrations
npm run migrate

# (Optional) Seed development data
npm run seed
```

### Running the Application

```bash
# Development (hot reload)
npm run dev

# Production
npm run build && npm start
```

### Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Tests with coverage report
npm run test:coverage
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Lint
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Full pre-commit check
npm run pre-commit
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login with email/password |
| `GET` | `/api/auth/me` | JWT | Get current user info |
| `POST` | `/api/auth/logout` | JWT | Logout (invalidate token) |
| `POST` | `/api/auth/password-reset/request` | No | Request password reset email |
| `POST` | `/api/auth/password-reset/confirm` | No | Confirm reset with token |
| `POST` | `/api/auth/password-change` | JWT | Change password |

Full API specification: [specs/001-user-auth/contracts/api.openapi.yaml](specs/001-user-auth/contracts/api.openapi.yaml)

## Environment Variables

See [`.env.example`](.env.example) for all required environment variables.

Key variables:
- `JWT_SECRET` — **Required**: Min 32-character secret for JWT signing
- `DB_*` — PostgreSQL connection settings
- `SMTP_*` — Email service configuration

## Project Structure

```text
src/
├── config/           # Database and environment configuration
├── controllers/      # HTTP request handlers
├── middleware/       # Express middleware (auth, validation, errors)
│   └── validators/   # Input validation middleware  
├── models/           # TypeScript interfaces for data entities
├── repositories/     # Database access layer
├── routes/           # API route definitions
├── services/         # Business logic layer
├── types/            # Shared TypeScript types
├── utils/            # Helper utilities
├── jobs/             # Background jobs (cleanup tasks)
└── server.ts         # Application entry point

tests/
├── unit/             # Unit tests (60% of test suite)
├── integration/      # Integration tests (30% of test suite)
└── e2e/              # End-to-end tests (10% of test suite)

database/
├── migrations/       # PostgreSQL schema migration files
└── seeds/            # Development seed data
```

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire after 24 hours
- Email enumeration prevention (generic error messages)
- Password reset links expire after 1 hour (one-time use)
- Rate limiting on authentication endpoints
- All secrets via environment variables (never in code)
- Audit log for all authentication events

## License

MIT
