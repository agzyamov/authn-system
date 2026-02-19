<!--
SYNC IMPACT REPORT
==================
Version Change: 0.0.0 → 1.0.0 (MINOR: Initial constitution adoption)
Modified Principles: None (new project)
Added Sections: Technical Requirements, Code Quality & Documentation
Removed Sections: None
Templates Requiring Updates:
  ✅ plan-template.md (constitution check gates documented)
  ✅ spec-template.md (references requirements framework)
  ✅ tasks-template.md (testing phases align with pyramid)
Follow-up TODOs: None
-->

# Authn-System Constitution

## Core Principles

### I. Clean Code & SOLID Design

All code MUST adhere to clean code principles: meaningful names, single responsibility,
DRY (Don't Repeat Yourself), and SOLID design patterns. Functions MUST be small (max 20 lines
ideally) and readable at a glance. Deeply nested conditionals and magic numbers are prohibited.
Refactoring for clarity is as valued as implementing new features. Violations require explicit
justification in code review.

### II. TypeScript with Strict Mode (NON-NEGOTIABLE)

All backend code MUST be written in TypeScript with `strict: true` in tsconfig.json. 
Strict mode enforces: explicit type annotations, no implicit `any`, null/undefined safety, and
function parameter validation. `@ts-ignore` comments are prohibited except with PR justification.
This ensures type safety throughout the authentication system and prevents runtime errors in
security-critical paths.

### III. Testing Pyramid with 80% Business Logic Coverage

Testing MUST follow the pyramid: 60% unit tests (single function/module), 30% integration tests
(service boundaries, auth flows), 10% end-to-end tests (full authentication scenarios).
Business logic MUST achieve 80% minimum code coverage; infrastructure code (logging, formatting)
may have lower coverage. Test-first development is required—tests MUST fail before implementation
begins (Red-Green-Refactor cycle). Coverage reports are gated in CI/CD.

### IV. JSDoc Documentation (MANDATORY)

Every exported function, class, interface, and type MUST have JSDoc comments documenting:
purpose/behavior, parameters (with types), return value, and any thrown errors/exceptions.
Non-exported internal functions MUST be documented if their intent is non-obvious. Examples
in JSDoc comments are encouraged for complex logic. Missing JSDoc blocks block code review approval.

### V. Security-First Authentication

All authentication operations MUST follow OWASP standards and principle of least privilege.
Passwords MUST NOT be logged; sensitive tokens MUST NOT be exposed in error messages or logs.
All endpoints MUST validate and sanitize inputs. Secrets MUST use environment variables, never
hardcoded. Session management MUST enforce timeouts and invalidation. Security-critical changes
require security review before merge.

## Technical Requirements

**Language & Runtime**: TypeScript 5.x or later, Node.js 18 LTS or later  
**Package Manager**: npm with package-lock.json (no yarn, pnpm locks in monorepo mode)  
**Linting**: ESLint with strict rule set enforced in CI/CD; Prettier for code formatting  
**Testing Framework**: Jest for unit/integration tests; fixtures and mocks MUST be isolated  
**Type Checking**: TypeScript strict mode as primary enforcement; no `any` type allowed  

## Code Quality & Documentation Standards

All pull requests MUST pass:
- TypeScript compilation with zero errors
- ESLint checks with zero warnings
- All tests passing with 80% coverage on business logic
- Code review verifying JSDoc completeness
- No hardcoded secrets or credentials

Commits MUST include descriptive messages referencing feature/fix type.
Feature branches MUST follow naming convention: `feature/<short-description>` or `fix/<short-description>`.

## Governance

This constitution supersedes all other coding standards and practices in the authn-system project.
Amendments require:
1. Documentation of rationale and impact
2. Approval from at least one maintainer
3. Migration plan for existing code (if breaking)
4. Update to this document with new version number

**Principle Violations**: PRs violating core principles MUST be rejected unless justified.
Security violations (Principle V) are auto-rejected with no exception path.

**Version Enforcement**: All developers MUST acknowledge this constitution before committing code.
CI/CD gates enforce TypeScript strict mode, test coverage, and linting—non-negotiable.

**Version**: 1.0.0 | **Ratified**: 2026-02-20 | **Last Amended**: 2026-02-20
