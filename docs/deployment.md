# Deployment Guide

## Prerequisites

- Docker 24+
- Docker Compose v2+
- PostgreSQL 15+ (if running without Docker)

## Docker Deployment (Recommended)

### 1. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your production values
```

Required variables for production:
```
JWT_SECRET=<min-32-character-secret>
DB_PASSWORD=<secure-database-password>
```

### 2. Build and Start

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f app

# Run database migrations
docker compose exec app node dist/server.js
# OR run migrations manually:
docker compose exec app npx ts-node database/migrate.ts up
```

### 3. Health Check

```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

## Manual Deployment (Without Docker)

### Prerequisites

1. Node.js 18 LTS
2. PostgreSQL 15+
3. SMTP server access

### Steps

```bash
# Install dependencies
npm ci --only=production

# Configure environment
cp .env.example .env
# Edit .env with production values

# Build TypeScript
npm run build

# Run database migrations
npm run migrate

# Start server
npm start
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | HTTP port |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (32+ chars) |
| `JWT_EXPIRY` | No | `24h` | JWT token expiry |
| `DB_HOST` | No | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_NAME` | No | `authn_system` | Database name |
| `DB_USER` | No | `postgres` | Database user |
| `DB_PASSWORD` | No | — | Database password |
| `DB_SSL` | No | `false` | Enable SSL for DB |
| `SMTP_HOST` | No | `localhost` | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `SMTP_FROM` | No | `noreply@example.com` | From email address |
| `APP_URL` | No | `http://localhost:3000` | Application URL (used in emails) |
| `PASSWORD_RESET_EXPIRY_HOURS` | No | `1` | Reset link expiry in hours |

## Security Checklist Before Production

- [ ] `JWT_SECRET` is at least 32 random characters
- [ ] `DB_PASSWORD` is strong and not the default
- [ ] HTTPS is enforced (via reverse proxy/load balancer)
- [ ] Database is not publicly accessible
- [ ] SMTP credentials are set for email delivery
- [ ] Rate limiting is appropriate for expected traffic
- [ ] Log monitoring is configured
- [ ] Database backups are scheduled

## Scaling Considerations

The application is stateless (JWT-based, no server-side sessions), so it scales horizontally with a load balancer.

For production token blacklisting (logout invalidation):
1. Configure Redis: `REDIS_URL=redis://your-redis:6379`
2. The `TokenBlacklistService` will automatically use Redis if configured

## Database Migrations

```bash
# Apply all pending migrations
npm run migrate

# Rollback all migrations
npm run migrate:down
```
