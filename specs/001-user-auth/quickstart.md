# Quickstart Guide: User Authentication System

**Feature**: 001-user-auth  
**Branch**: `001-user-auth`  
**Last Updated**: 2026-02-20

## Overview

This guide walks you through setting up the development environment, initializing the database, running the authentication API server, and executing tests for the user authentication system.

**Prerequisites**:
- Node.js 18 LTS or later
- PostgreSQL 15+ installed and running
- npm (comes with Node.js)
- Git (for version control)

---

## 1. Environment Setup

### Clone Repository (if not already done)

```bash
git clone https://github.com/agzyamov/authn-system.git
cd authn-system
```

### Checkout Feature Branch

```bash
git checkout 001-user-auth
```

### Install Dependencies

```bash
npm install
```

**Key Dependencies** (automatically installed):
- `express`: Web framework
- `typescript`: TypeScript compiler (strict mode)
- `bcrypt`: Password hashing
- `jsonwebtoken`: JWT generation/validation
- `pg`: PostgreSQL client
- `express-validator`: Input validation
- `dotenv`: Environment variable management
- `jest`: Testing framework
- `ts-node`: TypeScript execution for development

---

## 2. Environment Configuration

### Create `.env` File

Copy the example environment file and customize:

```bash
cp .env.example .env
```

### Edit `.env` with Required Values

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration (PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=authn_system_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=<GENERATE_USING_COMMAND_BELOW>
JWT_EXPIRY=24h

# Email Configuration (Development: use Ethereal for testing)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<ethereal_user>
EMAIL_PASSWORD=<ethereal_password>
EMAIL_FROM=noreply@example.com

# Rate Limiting (optional, for production)
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

### Generate JWT Secret (REQUIRED)

Run this command to generate a secure 256-bit secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it into `.env` as `JWT_SECRET` value.

**Example**:
```env
JWT_SECRET=xQ7e8FmNp2LkR5wT9vY3aB6nC1dZ4sG8hJ0iK5lM7oP
```

⚠️ **Security**: NEVER commit `.env` file to Git. The `.gitignore` file already excludes it.

### Setup Ethereal Email (Development Only)

For development, use [Ethereal](https://ethereal.email/) to test emails without sending real ones:

1. Visit https://ethereal.email/create
2. Click "Create Ethereal Account" (generates temporary SMTP credentials)
3. Copy the SMTP credentials to `.env`:
   - `EMAIL_USER`: Username from Ethereal
   - `EMAIL_PASSWORD`: Password from Ethereal

**Note**: Ethereal emails are viewable at https://ethereal.email/messages (not sent to real inboxes).

---

## 3. Database Setup

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Inside psql shell:
CREATE DATABASE authn_system_dev;
\q
```

**Alternative** (one-line command):

```bash
createdb -U postgres authn_system_dev
```

### Run Database Migrations

Migrations create the required tables (`users`, `password_resets`, `auth_events`):

```bash
npm run migrate:up
```

**Expected Output**:
```
Migration 001_create_users_table: SUCCESS
Migration 002_create_password_resets_table: SUCCESS
Migration 003_create_auth_events_table: SUCCESS
```

### Verify Database Schema

```bash
psql -U postgres -d authn_system_dev -c "\dt"
```

**Expected Tables**:
- `users`
- `password_resets`
- `auth_events`
- `migrations` (tracks migration history)

---

## 4. Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

This uses `nodemon` to watch for file changes and auto-restart the server.

**Expected Output**:
```
[INFO] Server running on http://localhost:3000
[INFO] Environment: development
[INFO] Database connected: authn_system_dev
```

### Production Mode (compiled TypeScript)

```bash
npm run build
npm start
```

**What happens**:
1. `npm run build`: Compiles TypeScript to JavaScript in `dist/` folder
2. `npm start`: Runs compiled code from `dist/server.js`

### Verify Server is Running

Open browser or use curl:

```bash
curl http://localhost:3000/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-20T10:30:00.000Z"
}
```

---

## 5. Running Tests

### Run All Tests

```bash
npm test
```

**Test Coverage** (per constitution: 80% business logic):
- Unit tests (60%): Services, utilities, validators
- Integration tests (30%): Database operations, API endpoints
- E2E tests (10%): Full authentication flows

**Expected Output**:
```
PASS tests/unit/services/auth.service.test.ts
PASS tests/integration/auth.api.test.ts
PASS tests/e2e/registration-flow.test.ts

Test Suites: 15 passed, 15 total
Tests:       87 passed, 87 total
Coverage:    83.5% (exceeds 80% requirement)
```

### Run Specific Test Suite

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

### Run Tests with Coverage Report

```bash
npm run test:coverage
```

**Coverage report** is generated in `coverage/lcov-report/index.html` (open in browser).

### Watch Mode (auto-rerun tests on file changes)

```bash
npm run test:watch
```

---

## 6. Manual Testing (API Endpoints)

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123"
  }'
```

**Expected Response** (201 Created):
```json
{
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "test@example.com",
    "created_at": "2026-02-20T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123"
  }'
```

**Expected Response** (200 OK):
```json
{
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "test@example.com",
    "created_at": "2026-02-20T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User (Protected Endpoint)

```bash
# Replace <TOKEN> with actual JWT from login/register response
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

**Expected Response** (200 OK):
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "test@example.com",
  "created_at": "2026-02-20T10:30:00.000Z"
}
```

### Request Password Reset

```bash
curl -X POST http://localhost:3000/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response** (200 OK):
```json
{
  "message": "If email is registered, password reset link has been sent"
}
```

**Check Ethereal inbox**: Visit https://ethereal.email/messages to see reset email with token.

### Complete Password Reset

```bash
# Replace <RESET_TOKEN> with token from email
curl -X POST http://localhost:3000/api/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<RESET_TOKEN>",
    "new_password": "NewSecurePassword456"
  }'
```

**Expected Response** (200 OK):
```json
{
  "message": "Password reset successful"
}
```

### Logout

```bash
# Replace <TOKEN> with current JWT
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <TOKEN>"
```

**Expected Response** (200 OK):
```json
{
  "message": "Logout successful"
}
```

---

## 7. Database Management

### Seed Test Data (Development)

```bash
npm run db:seed
```

Creates sample users for testing:
- `alice@example.com` / `password123`
- `bob@example.com` / `password456`

### Reset Database (Drop All Data)

```bash
npm run migrate:down  # Rollback migrations
npm run migrate:up    # Re-run migrations (fresh tables)
```

⚠️ **Warning**: This deletes ALL data. Use only in development.

### View Database Data (psql)

```bash
psql -U postgres -d authn_system_dev

# Inside psql:
SELECT * FROM users;
SELECT * FROM auth_events ORDER BY created_at DESC LIMIT 10;
\q
```

---

## 8. Code Quality Checks

### TypeScript Type Checking

```bash
npm run typecheck
```

Verifies strict TypeScript compliance (no `any` types, null safety, etc.).

### Linting (ESLint)

```bash
npm run lint
```

Checks code style and catches common errors.

**Auto-fix issues**:
```bash
npm run lint:fix
```

### Formatting (Prettier)

```bash
npm run format:check  # Check formatting issues
npm run format:write  # Auto-format all files
```

### Run All Quality Checks (pre-commit)

```bash
npm run pre-commit
```

Runs: `typecheck` → `lint` → `format:check` → `test`

---

## 9. Common Issues & Solutions

### Issue: "Database connection failed"

**Cause**: PostgreSQL not running or wrong credentials in `.env`.

**Solution**:
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials: `psql -U postgres -d authn_system_dev`
3. Update `.env` with correct `DATABASE_*` values

### Issue: "JWT secret not configured"

**Cause**: Missing or empty `JWT_SECRET` in `.env`.

**Solution**:
1. Generate secret: `openssl rand -base64 32`
2. Add to `.env`: `JWT_SECRET=<generated_value>`
3. Restart server

### Issue: "Port 3000 already in use"

**Cause**: Another process using port 3000.

**Solution**:
- Change port in `.env`: `PORT=3001`
- Or kill existing process: `lsof -ti:3000 | xargs kill`

### Issue: "bcrypt build error on M1/M2 Mac"

**Cause**: bcrypt native dependencies not compiled for ARM architecture.

**Solution**:
```bash
npm rebuild bcrypt
```

### Issue: "Tests failing with database errors"

**Cause**: Test database not initialized or polluted.

**Solution**:
```bash
# Create separate test database
createdb -U postgres authn_system_test

# Update .env.test:
DATABASE_NAME=authn_system_test

# Run migrations for test DB
NODE_ENV=test npm run migrate:up
```

---

## 10. Next Steps

### Development Workflow

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Write tests first** (TDD): Add test in `tests/unit/` or `tests/integration/`
3. **Implement feature**: Add code in `src/`
4. **Run tests**: `npm test`
5. **Check quality**: `npm run pre-commit`
6. **Commit changes**: `git commit -m "Add feature X"`
7. **Push and open PR**: `git push origin feature/my-feature`

### Deployment Preparation

Before deploying to production:

1. **Set environment**: `NODE_ENV=production` in `.env`
2. **Use real email service**: Replace Ethereal with SendGrid/SES credentials
3. **Generate production JWT secret**: New secret via `openssl rand -base64 32`
4. **Enable HTTPS**: Configure reverse proxy (Nginx) or load balancer
5. **Set up database backups**: Automated PostgreSQL backups
6. **Configure rate limiting**: Uncomment rate limiter middleware in `src/server.ts`
7. **Review logs**: Set `LOG_LEVEL=info` (not `debug` in production)

### Documentation

- **API Documentation**: View OpenAPI spec in [contracts/api.openapi.yaml](contracts/api.openapi.yaml)
- **Data Model**: See [data-model.md](data-model.md) for entity schemas
- **Research Decisions**: Review [research.md](research.md) for architecture rationale

---

## 11. Useful Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with auto-reload |
| `npm test` | Run all tests with coverage |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server (after build) |
| `npm run typecheck` | Verify TypeScript strict mode |
| `npm run lint` | Check code style (ESLint) |
| `npm run format:write` | Auto-format code (Prettier) |
| `npm run migrate:up` | Run database migrations |
| `npm run migrate:down` | Rollback last migration |
| `npm run db:seed` | Insert test data |
| `npm run pre-commit` | Run all quality checks |

---

## 12. Support & Troubleshooting

**Project Documentation**:
- Feature spec: [spec.md](spec.md)
- Implementation plan: [plan.md](plan.md)
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)

**External Resources**:
- Express.js docs: https://expressjs.com/
- PostgreSQL docs: https://www.postgresql.org/docs/
- JWT docs: https://jwt.io/introduction
- bcrypt best practices: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

**Getting Help**:
- Check GitHub Issues for known problems
- Review test files for usage examples
- Consult constitution for coding standards

---

**Quickstart Complete**: You now have a fully functional development environment for the authentication system. Run `npm run dev` to start building!
