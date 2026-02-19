# Architecture & Component Diagrams: User Authentication System

**Feature**: 001-user-auth | **Date**: 2026-02-20

---

## 1. System Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        APP["Client Application\n(Web / Mobile)"]
    end

    subgraph API["API Layer — Express.js / TypeScript"]
        direction TB
        MW_RATE["Rate Limiter Middleware"]
        MW_AUTH["JWT Auth Middleware"]
        MW_VAL["Validation Middleware\n(express-validator)"]

        subgraph Routes["Route Handlers"]
            R_AUTH["/auth/register\n/auth/login\n/auth/logout\n/auth/me"]
            R_PWD["/auth/forgot-password\n/auth/reset-password\n/auth/change-password"]
            R_HEALTH["/health"]
        end
    end

    subgraph Services["Service Layer"]
        SVC_AUTH["AuthService\n(register, login, logout)"]
        SVC_TOKEN["TokenService\n(generate, validate, blacklist JWT)"]
        SVC_PWD["PasswordService\n(hash, compare — bcrypt)"]
        SVC_EMAIL["EmailService\n(send reset email)"]
        SVC_AUDIT["AuditService\n(log auth events)"]
    end

    subgraph Data["Data Layer — PostgreSQL 15+"]
        DB_USERS[(users)]
        DB_RESETS[(password_resets)]
        DB_EVENTS[(auth_events)]
    end

    subgraph External["External Services"]
        SMTP["SMTP / Email Provider"]
    end

    APP -->|HTTPS / REST JSON| MW_RATE
    MW_RATE --> MW_AUTH
    MW_AUTH --> MW_VAL
    MW_VAL --> Routes

    R_AUTH --> SVC_AUTH
    R_PWD --> SVC_AUTH
    R_HEALTH -.->|status ok| APP

    SVC_AUTH --> SVC_TOKEN
    SVC_AUTH --> SVC_PWD
    SVC_AUTH --> SVC_EMAIL
    SVC_AUTH --> SVC_AUDIT

    SVC_AUTH --> DB_USERS
    SVC_TOKEN --> DB_RESETS
    SVC_AUDIT --> DB_EVENTS
    DB_RESETS --> DB_USERS

    SVC_EMAIL --> SMTP
```

---

## 2. Data Model (ERD)

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR_255 email UK "NOT NULL, indexed, lowercase"
        VARCHAR_255 password_hash "NOT NULL, bcrypt cost=12"
        TIMESTAMP created_at "NOT NULL, default NOW()"
        TIMESTAMP updated_at "NOT NULL, auto-updated"
    }

    password_resets {
        UUID id PK
        UUID user_id FK "NOT NULL"
        VARCHAR_255 reset_token UK "NOT NULL, UUID v4, indexed"
        TIMESTAMP created_at "NOT NULL, default NOW()"
        TIMESTAMP expires_at "NOT NULL, +1 hour, indexed"
        TIMESTAMP used_at "NULL = unused"
    }

    auth_events {
        SERIAL id PK
        UUID user_id FK "NULL for anon failures"
        VARCHAR_50 event_type "registration|login_success|..."
        INET ip_address "NOT NULL"
        TEXT user_agent "NOT NULL"
        BOOLEAN success "NOT NULL"
        JSONB metadata "NULL, max 1KB"
        TIMESTAMP created_at "NOT NULL, indexed"
    }

    users ||--o{ password_resets : "has"
    users ||--o{ auth_events : "generates"
```

---

## 3. Auth Flows — Registration, Login, Password Reset

```mermaid
sequenceDiagram
    actor User
    participant API as Express API
    participant Val as Validation MW
    participant Auth as AuthService
    participant Pwd as PasswordService
    participant DB as PostgreSQL
    participant Email as EmailService
    participant Audit as AuditService

    rect rgb(220, 240, 220)
        Note over User, Audit: Registration
        User->>API: POST /auth/register { email, password }
        API->>Val: validate email format, password ≥ 8 chars
        Val-->>API: valid
        API->>Auth: register(email, password)
        Auth->>DB: SELECT WHERE email = ? (unique check)
        DB-->>Auth: no rows
        Auth->>Pwd: hash(password, cost=12)
        Pwd-->>Auth: password_hash
        Auth->>DB: INSERT INTO users
        DB-->>Auth: user record
        Auth->>Audit: log(REGISTRATION, success=true)
        Auth-->>API: { user, JWT (24h) }
        API-->>User: 201 { user, token }
    end

    rect rgb(220, 230, 245)
        Note over User, Audit: Login
        User->>API: POST /auth/login { email, password }
        API->>Val: validate fields present
        Val-->>API: valid
        API->>Auth: login(email, password)
        Auth->>DB: SELECT WHERE email = ?
        DB-->>Auth: user row
        Auth->>Pwd: compare(password, hash)
        Pwd-->>Auth: match = true
        Auth->>Auth: sign JWT (exp: 24h)
        Auth->>Audit: log(LOGIN_SUCCESS)
        Auth-->>API: { user, token }
        API-->>User: 200 { user, token }
    end

    rect rgb(245, 235, 220)
        Note over User, Audit: Password Reset
        User->>API: POST /auth/forgot-password { email }
        API->>Auth: requestReset(email)
        Auth->>DB: SELECT user WHERE email = ?
        DB-->>Auth: user (or not found)
        Note right of Auth: Always return 200\n(prevent enumeration)
        Auth->>DB: INSERT INTO password_resets\n(token, expires_at = +1h)
        Auth->>Email: sendResetEmail(email, token)
        Auth->>Audit: log(PASSWORD_RESET_REQUEST)
        API-->>User: 200 OK (generic response)

        User->>API: POST /auth/reset-password { token, newPassword }
        API->>Auth: resetPassword(token, newPassword)
        Auth->>DB: SELECT WHERE token = ?\nAND used_at IS NULL\nAND expires_at > NOW()
        DB-->>Auth: valid reset row
        Auth->>Pwd: hash(newPassword)
        Auth->>DB: UPDATE users SET password_hash
        Auth->>DB: UPDATE password_resets SET used_at = NOW()
        Auth->>Audit: log(PASSWORD_RESET_COMPLETE)
        API-->>User: 200 OK
    end
```
