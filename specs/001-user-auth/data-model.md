# Data Model: User Authentication System

**Feature**: 001-user-auth  
**Date**: 2026-02-20  
**Status**: Phase 1 Design

## Overview

This document defines the data entities, their relationships, validation rules, and state transitions for the authentication system. All entities map to PostgreSQL tables and TypeScript interfaces.

---

## Entity 1: User

**Purpose**: Represents a registered user account in the system.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| `id` | UUID | Primary key, NOT NULL | Unique identifier (prevents enumeration) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, indexed | User's email address (login identifier) |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash (cost factor 12, never plaintext) |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, default NOW() | Last modification timestamp (triggers on update) |

### Validation Rules

- **Email**:
  - MUST match RFC 5322 format (validated via `express-validator.isEmail()`)
  - MUST be unique across all users (enforced by database UNIQUE constraint)
  - Normalized to lowercase before storage (prevents `User@example.com` vs `user@example.com` duplicates)
  - Max length 255 characters (database constraint)
  - MUST NOT contain SQL injection patterns (validated before database query)

- **Password**:
  - Raw password MUST be minimum 8 characters (FR-003)
  - MUST be hashed via bcrypt with cost factor 12 before storage (FR-005)
  - Plaintext password NEVER stored or logged (FR-013)
  - No maximum length enforced (bcrypt handles up to 72 bytes internally)
  - No complexity requirements (NIST 800-63B guidance: length > complexity)

- **ID**:
  - Generated via UUID v4 on creation
  - Immutable after creation

### Relationships

- **→ PasswordReset** (one-to-many): A user can have multiple password reset requests (historical and active)
- **→ AuthEvent** (one-to-many): A user generates multiple authentication events (audit trail)

### State Transitions

```
[No Account] --register()--> [Active User]
[Active User] --changePassword()--> [Active User with new password_hash, updated_at changed]
[Active User] --delete()--> [Deleted] (soft delete pattern if needed; not in MVP)
```

**Note**: No "email verified" vs "unverified" state in MVP (simplification). Email verification can be added later as `email_verified_at` timestamp field.

### TypeScript Interface

```typescript
/**
 * Represents a registered user account.
 * @interface User
 */
export interface User {
  /** Unique user identifier (UUID v4) */
  id: string;
  
  /** User's email address (unique, lowercase) */
  email: string;
  
  /** bcrypt password hash (never exposed in responses) */
  password_hash: string;
  
  /** Account creation timestamp */
  created_at: Date;
  
  /** Last update timestamp */
  updated_at: Date;
}

/**
 * User data transfer object (safe for API responses).
 * Excludes password_hash for security.
 */
export interface UserDTO {
  id: string;
  email: string;
  created_at: Date;
}
```

### Database Schema (PostgreSQL)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast email lookup during login
CREATE INDEX idx_users_email ON users(email);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## Entity 2: PasswordReset

**Purpose**: Represents a password reset request with time-limited token for one-time use.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| `id` | UUID | Primary key, NOT NULL | Unique identifier for reset request |
| `user_id` | UUID | Foreign key → users.id, NOT NULL, indexed | User requesting password reset |
| `reset_token` | VARCHAR(255) | UNIQUE, NOT NULL, indexed | Unique token sent via email (UUID v4) |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | Reset request creation time |
| `expires_at` | TIMESTAMP | NOT NULL, indexed | Expiration time (created_at + 1 hour) |
| `used_at` | TIMESTAMP | NULL | Timestamp when token was used (NULL = unused) |

### Validation Rules

- **reset_token**:
  - Generated via UUID v4 (cryptographically random)
  - MUST be unique across all reset requests
  - MUST be validated as UUID format before lookup (prevents injection)
  - Single-use: query checks `used_at IS NULL` AND `expires_at > NOW()`

- **expires_at**:
  - Set to `created_at + 1 hour` (3600 seconds) per research decision
  - Checked on every reset attempt: reject if `NOW() > expires_at`

- **user_id**:
  - MUST reference existing user in `users` table (foreign key constraint)
  - Indexed for fast lookup of user's reset requests

### Relationships

- **User ← PasswordReset** (many-to-one): Multiple reset requests belong to one user

### State Transitions

```
[No Reset] --requestReset()--> [Active Reset: used_at=NULL, expires_at=future]
[Active Reset] --useReset()--> [Used Reset: used_at=NOW()]
[Active Reset] --expire()--> [Expired Reset: expires_at < NOW()] (implicit, no state change)
[Used Reset] --requestReset()--> [New Active Reset] (previous reset remains historical)
```

### Behaviors

- **One-time use**: After successful password reset, `used_at` is set to current timestamp
- **Expiration cleanup**: Background job (cron or periodic task) deletes expired/used resets older than 7 days
- **Multiple pending resets**: User can request multiple resets; only latest valid token works (older ones remain valid until expiry)

### TypeScript Interface

```typescript
/**
 * Represents a password reset request.
 * @interface PasswordReset
 */
export interface PasswordReset {
  /** Unique reset request identifier (UUID v4) */
  id: string;
  
  /** User ID requesting reset */
  user_id: string;
  
  /** Unique reset token (UUID v4, sent via email) */
  reset_token: string;
  
  /** Reset request creation time */
  created_at: Date;
  
  /** Reset token expiration time (created_at + 1 hour) */
  expires_at: Date;
  
  /** Timestamp when reset was used (null if unused) */
  used_at: Date | null;
}

/**
 * Parameters for creating a password reset.
 */
export interface CreatePasswordResetParams {
  user_id: string;
  reset_token: string;
  expires_at: Date;
}
```

### Database Schema (PostgreSQL)

```sql
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reset_token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL
);

-- Index for fast token lookup during reset
CREATE INDEX idx_password_resets_token ON password_resets(reset_token);

-- Index for fast user lookup (view user's reset history)
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);

-- Index for expiration cleanup queries
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
```

---

## Entity 3: AuthEvent

**Purpose**: Audit log for authentication-related events (FR-012: log all auth events).

### Attributes

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| `id` | SERIAL | Primary key, NOT NULL | Auto-incrementing log entry ID |
| `user_id` | UUID | Foreign key → users.id, NULL, indexed | User involved (NULL for failed login attempts) |
| `event_type` | VARCHAR(50) | NOT NULL | Event type enum (see below) |
| `ip_address` | INET | NOT NULL | Client IP address (IPv4/IPv6) |
| `user_agent` | TEXT | NOT NULL | Client User-Agent header |
| `success` | BOOLEAN | NOT NULL | Whether event succeeded (true) or failed (false) |
| `metadata` | JSONB | NULL | Optional event-specific data (e.g., error reason) |
| `created_at` | TIMESTAMP | NOT NULL, default NOW(), indexed | Event timestamp |

### Event Types (Enum)

| Event Type | Description | user_id | success |
|------------|-------------|---------|---------|
| `registration` | User account created | NOT NULL | true |
| `login_success` | User logged in successfully | NOT NULL | true |
| `login_failure` | Login attempt failed (wrong password/email) | NULL or user_id | false |
| `logout` | User logged out | NOT NULL | true |
| `password_reset_request` | Password reset email sent | NOT NULL | true |
| `password_reset_complete` | Password successfully reset via token | NOT NULL | true |
| `password_reset_failure` | Reset attempt failed (expired/invalid token) | NOT NULL or NULL | false |
| `password_change` | User changed password while logged in | NOT NULL | true |

### Validation Rules

- **event_type**: MUST be one of the predefined enum values (enforced by application logic or CHECK constraint)
- **ip_address**: MUST be valid IPv4 or IPv6 address (PostgreSQL INET type validates)
- **user_agent**: Max 1000 characters (prevent abuse), stored as-is from HTTP header
- **metadata**: JSON object, max 1KB (prevent log bloat), MUST NOT contain passwords or tokens (FR-013)

### Relationships

- **User ← AuthEvent** (many-to-one): Multiple events belong to one user (or NULL for anonymous failures)

### Behaviors

- **Immutable**: Once created, auth_events CANNOT be updated or deleted (audit integrity)
- **Retention**: Keep events for 90 days (configurable), then archive or delete per compliance policy
- **Query patterns**: 
  - "Get user's login history": `WHERE user_id = ? AND event_type LIKE 'login%' ORDER BY created_at DESC`
  - "Detect brute-force": `WHERE ip_address = ? AND event_type = 'login_failure' AND created_at > NOW() - INTERVAL '15 minutes'`

### TypeScript Interface

```typescript
/**
 * Authentication event types.
 */
export enum AuthEventType {
  REGISTRATION = 'registration',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  PASSWORD_RESET_FAILURE = 'password_reset_failure',
  PASSWORD_CHANGE = 'password_change',
}

/**
 * Represents an authentication audit event.
 * @interface AuthEvent
 */
export interface AuthEvent {
  /** Unique event ID (auto-increment) */
  id: number;
  
  /** User ID (null for anonymous events like failed logins) */
  user_id: string | null;
  
  /** Type of authentication event */
  event_type: AuthEventType;
  
  /** Client IP address */
  ip_address: string;
  
  /** Client User-Agent header */
  user_agent: string;
  
  /** Whether event succeeded */
  success: boolean;
  
  /** Optional event metadata (JSON) */
  metadata?: Record<string, any>;
  
  /** Event timestamp */
  created_at: Date;
}

/**
 * Parameters for creating an auth event.
 */
export interface CreateAuthEventParams {
  user_id?: string;
  event_type: AuthEventType;
  ip_address: string;
  user_agent: string;
  success: boolean;
  metadata?: Record<string, any>;
}
```

### Database Schema (PostgreSQL)

```sql
CREATE TABLE auth_events (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for user event history queries
CREATE INDEX idx_auth_events_user_id ON auth_events(user_id);

-- Index for timestamp-based queries (log search, retention cleanup)
CREATE INDEX idx_auth_events_created_at ON auth_events(created_at);

-- Index for brute-force detection queries
CREATE INDEX idx_auth_events_ip_address ON auth_events(ip_address, event_type, created_at);

-- CHECK constraint for event_type enum (optional, can be enforced in app layer)
ALTER TABLE auth_events ADD CONSTRAINT check_event_type CHECK (
  event_type IN (
    'registration', 'login_success', 'login_failure', 'logout',
    'password_reset_request', 'password_reset_complete', 'password_reset_failure',
    'password_change'
  )
);
```

---

## Entity Relationships Diagram

```
┌─────────────────┐
│     User        │
│─────────────────│
│ id (PK)         │◄──────┐
│ email (UNIQUE)  │       │
│ password_hash   │       │ Many-to-One
│ created_at      │       │
│ updated_at      │       │
└─────────────────┘       │
        ▲                 │
        │                 │
        │ One-to-Many     │
        │                 │
┌───────┴──────────┐  ┌───┴─────────────────┐
│  PasswordReset   │  │     AuthEvent       │
│──────────────────│  │─────────────────────│
│ id (PK)          │  │ id (PK)             │
│ user_id (FK)     │  │ user_id (FK, NULL)  │
│ reset_token      │  │ event_type          │
│ created_at       │  │ ip_address          │
│ expires_at       │  │ user_agent          │
│ used_at          │  │ success             │
└──────────────────┘  │ metadata            │
                      │ created_at          │
                      └─────────────────────┘
```

---

## Data Access Patterns

### User

1. **Registration**: `INSERT INTO users (email, password_hash) VALUES (?, ?)`
2. **Login**: `SELECT * FROM users WHERE email = ?` (indexed lookup, O(1))
3. **Change Password**: `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`
4. **Get User by ID**: `SELECT * FROM users WHERE id = ?` (primary key lookup)

### PasswordReset

1. **Request Reset**: `INSERT INTO password_resets (user_id, reset_token, expires_at) VALUES (?, ?, NOW() + INTERVAL '1 hour')`
2. **Validate Token**: `SELECT * FROM password_resets WHERE reset_token = ? AND used_at IS NULL AND expires_at > NOW()`
3. **Mark Used**: `UPDATE password_resets SET used_at = NOW() WHERE id = ?`
4. **Cleanup Expired**: `DELETE FROM password_resets WHERE (used_at IS NOT NULL OR expires_at < NOW()) AND created_at < NOW() - INTERVAL '7 days'`

### AuthEvent

1. **Log Event**: `INSERT INTO auth_events (user_id, event_type, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?)`
2. **User History**: `SELECT * FROM auth_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`
3. **Brute-Force Detection**: `SELECT COUNT(*) FROM auth_events WHERE ip_address = ? AND event_type = 'login_failure' AND created_at > NOW() - INTERVAL '15 minutes'`
4. **Retention Cleanup**: `DELETE FROM auth_events WHERE created_at < NOW() - INTERVAL '90 days'`

---

## Data Validation Summary

| Entity | Field | Validation Method | Enforced By |
|--------|-------|------------------|-------------|
| User | email | RFC 5322 format, unique, lowercase | express-validator + DB UNIQUE constraint |
| User | password | Min 8 chars, bcrypt hash | express-validator + bcrypt library |
| User | id | UUID v4 format | Database + uuid library |
| PasswordReset | reset_token | UUID v4 format, unique | Database + uuid library |
| PasswordReset | expires_at | created_at + 1 hour | Application logic |
| PasswordReset | used_at | NULL or valid timestamp | Application logic (set once) |
| AuthEvent | event_type | Enum values | Application logic + CHECK constraint |
| AuthEvent | ip_address | IPv4/IPv6 format | PostgreSQL INET type validation |

---

## Security Considerations

1. **Password Hashing**: bcrypt cost factor 12, never store plaintext (FR-005)
2. **Token Uniqueness**: UUIDs for reset tokens prevent guessing attacks
3. **Email Enumeration Prevention**: Generic error messages (FR-004), log attempts in auth_events
4. **Audit Logging**: All auth actions logged with IP/user-agent (FR-012)
5. **No Sensitive Data in Logs**: password_hash and JWT tokens never logged (FR-013)
6. **Foreign Key Constraints**: Prevent orphaned records, maintain referential integrity
7. **Indexes on Sensitive Queries**: Email and token lookups indexed for performance (prevent DoS via slow queries)

---

**Data Model Complete**: All entities defined with validation rules, relationships, and database schemas. Ready for API contract generation (contracts/).
