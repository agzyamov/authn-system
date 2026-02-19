# Tasks: User Authentication System

**Feature**: 001-user-auth  
**Branch**: `001-user-auth`  
**Input**: Design documents from `/specs/001-user-auth/`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Testing**: Jest testing is required per user specification. Tests follow TDD approach (Red-Green-Refactor).

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure (src/, tests/, database/, config/) per plan.md
- [x] T002 Initialize Node.js project with package.json (TypeScript 5.x, Node 18 LTS)
- [x] T003 [P] Install dependencies: express, bcrypt, jsonwebtoken, pg, express-validator, dotenv
- [x] T004 [P] Install dev dependencies: typescript, jest, ts-jest, @types/*, eslint, prettier, nodemon
- [x] T005 [P] Configure TypeScript with strict mode in tsconfig.json
- [x] T006 [P] Configure ESLint with strict rules in .eslintrc.json
- [x] T007 [P] Configure Prettier in .prettierrc
- [x] T008 [P] Configure Jest for TypeScript in jest.config.js
- [x] T009 [P] Create .env.example with all required environment variables
- [x] T010 [P] Setup npm scripts in package.json (dev, build, start, test, lint, migrate, etc.)
- [x] T011 [P] Create .gitignore (node_modules, dist, .env, coverage)
- [x] T012 [P] Create README.md with project overview and setup instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [x] T013 Setup database connection pool in src/config/database.ts
- [x] T014 Create database migration framework setup in database/migrations/
- [x] T015 Create migration 001_create_users_table.sql with indexes
- [x] T016 [P] Create migration 002_create_password_resets_table.sql with indexes
- [x] T017 [P] Create migration 003_create_auth_events_table.sql with indexes
- [x] T018 Create database migration runner script (up/down) in database/migrate.ts
- [x] T019 Create database seed file for development in database/seeds/dev-users.sql

### Core Types & Interfaces

- [x] T020 [P] Define User interface in src/models/User.ts
- [x] T021 [P] Define PasswordReset interface in src/models/PasswordReset.ts
- [x] T022 [P] Define AuthEvent interface and AuthEventType enum in src/models/AuthEvent.ts
- [x] T023 [P] Define API response types (UserDTO, AuthResponse, ErrorResponse) in src/types/api.ts
- [x] T024 [P] Define environment configuration type in src/types/config.ts

### Configuration & Utilities

- [x] T025 Create environment config loader in src/config/env.ts
- [x] T026 [P] Create logger utility in src/utils/logger.ts (Winston or Pino)
- [x] T027 [P] Create password validation utility in src/utils/passwordValidator.ts
- [x] T028 [P] Create email format validation utility in src/utils/emailValidator.ts

### Middleware Foundation

- [x] T029 Create error handling middleware in src/middleware/errorHandler.ts
- [x] T030 [P] Create request logging middleware in src/middleware/requestLogger.ts
- [x] T031 [P] Create validation error formatter middleware in src/middleware/validationErrorHandler.ts
- [x] T032 Create JWT authentication middleware in src/middleware/authenticate.ts (verifies and decodes tokens)

### Express Server Foundation

- [x] T033 Create Express app initialization in src/app.ts (middleware setup, CORS, JSON parsing)
- [x] T034 Create server entry point in src/server.ts (starts Express on configured port)
- [x] T035 Create health check route GET /api/health in src/routes/health.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration via Email/Password (Priority: P1) 🎯 MVP

**Goal**: A new user creates an account by providing an email address and password. The system validates the email format, password strength, and uniqueness of the email. Upon successful registration, the user receives a confirmation email and can immediately log in.

**Independent Test**: "Execute full user registration flow—provide valid email/password, verify account creation, confirm email validation, and verify user can log in immediately after registration."

### Tests for User Story 1 (TDD: Write FIRST, ensure FAIL before implementation)

- [x] T036 [P] [US1] Create unit test for User model validation in tests/unit/models/User.test.ts
- [x] T037 [P] [US1] Create unit test for password validation utility in tests/unit/utils/passwordValidator.test.ts
- [x] T038 [P] [US1] Create unit test for email validation utility in tests/unit/utils/emailValidator.test.ts
- [x] T039 [P] [US1] Create unit test for AuthService.registerUser method in tests/unit/services/AuthService.test.ts
- [x] T040 [US1] Create integration test for POST /api/auth/register endpoint in tests/integration/auth/register.test.ts
- [x] T041 [US1] Create E2E test for complete registration flow in tests/e2e/registration-flow.test.ts

### Implementation for User Story 1

- [x] T042 [P] [US1] Create User repository with create/findByEmail methods in src/repositories/UserRepository.ts
- [x] T043 [P] [US1] Create EmailService interface in src/services/EmailService.ts
- [x] T044 [US1] Implement NodemailerEmailService with sendWelcome method in src/services/NodemailerEmailService.ts
- [x] T045 [US1] Create AuthService with registerUser method in src/services/AuthService.ts (depends on T042)
- [x] T046 [US1] Create TokenService with generateJWT method in src/services/TokenService.ts
- [x] T047 [US1] Create registration request validation middleware in src/middleware/validators/registerValidator.ts
- [x] T048 [US1] Create registration controller in src/controllers/authController.ts (register function)
- [x] T049 [US1] Create POST /api/auth/register route in src/routes/auth.ts
- [x] T050 [US1] Create AuthEvent repository with logEvent method in src/repositories/AuthEventRepository.ts
- [x] T051 [US1] Integrate auth event logging into AuthService.registerUser for 'registration' events

**Checkpoint**: At this point, User Story 1 should be fully functional - users can register with email/password, receive welcome email, and get JWT token. Run tests to verify independently.

---

## Phase 4: User Story 2 - User Login with JWT Tokens (Priority: P1) 🎯 MVP

**Goal**: A registered user logs in using their email and password. The system validates credentials against stored user records and issues a JWT token upon successful authentication. The token is returned to the client and used for subsequent authenticated requests.

**Independent Test**: "Execute complete login flow—provide valid credentials, receive JWT token, verify token structure, and confirm token can be used to access protected endpoints."

### Tests for User Story 2 (TDD: Write FIRST, ensure FAIL before implementation)

- [x] T052 [P] [US2] Create unit test for AuthService.loginUser method in tests/unit/services/AuthService.test.ts (add to existing file)
- [x] T053 [P] [US2] Create unit test for TokenService.verifyJWT method in tests/unit/services/TokenService.test.ts
- [x] T054 [P] [US2] Create unit test for JWT authentication middleware in tests/unit/middleware/authenticate.test.ts
- [x] T055 [US2] Create integration test for POST /api/auth/login endpoint in tests/integration/auth/login.test.ts
- [x] T056 [US2] Create integration test for GET /api/auth/me endpoint in tests/integration/auth/me.test.ts
- [x] T057 [US2] Create E2E test for complete login flow in tests/e2e/login-flow.test.ts

### Implementation for User Story 2

- [x] T058 [US2] Add loginUser method to AuthService in src/services/AuthService.ts (credential validation with bcrypt)
- [x] T059 [P] [US2] Add verifyJWT method to TokenService in src/services/TokenService.ts
- [x] T060 [P] [US2] Add decodeJWT method to TokenService in src/services/TokenService.ts
- [x] T061 [US2] Create login request validation middleware in src/middleware/validators/loginValidator.ts
- [x] T062 [US2] Create login controller in src/controllers/authController.ts (login function)
- [x] T063 [US2] Create POST /api/auth/login route in src/routes/auth.ts (add to existing file)
- [x] T064 [US2] Create getCurrentUser controller in src/controllers/authController.ts (me function)
- [x] T065 [US2] Create GET /api/auth/me route in src/routes/auth.ts (protected with authenticate middleware)
- [x] T066 [US2] Integrate auth event logging for 'login_success' and 'login_failure' events in AuthService.loginUser

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can register and login with JWT tokens, access protected endpoints. Run all tests to verify MVP functionality.

---

## Phase 5: User Story 3 - Password Reset via Email (Priority: P2)

**Goal**: A user who forgets their password initiates a reset request via email. The system sends a time-limited reset link (valid for 1 hour) to the registered email. Clicking the link allows the user to set a new password without logging in.

**Independent Test**: "Execute password reset flow—request reset via email, receive reset link, click link, set new password, and verify login works with new password."

### Tests for User Story 3 (TDD: Write FIRST, ensure FAIL before implementation)

- [x] T067 [P] [US3] Create unit test for PasswordReset model validation in tests/unit/models/PasswordReset.test.ts
- [x] T068 [P] [US3] Create unit test for AuthService.requestPasswordReset method in tests/unit/services/AuthService.test.ts (add to existing)
- [x] T069 [P] [US3] Create unit test for AuthService.confirmPasswordReset method in tests/unit/services/AuthService.test.ts (add to existing)
- [x] T070 [US3] Create integration test for POST /api/auth/password-reset/request endpoint in tests/integration/auth/password-reset-request.test.ts
- [x] T071 [US3] Create integration test for POST /api/auth/password-reset/confirm endpoint in tests/integration/auth/password-reset-confirm.test.ts
- [x] T072 [US3] Create E2E test for complete password reset flow in tests/e2e/password-reset-flow.test.ts

### Implementation for User Story 3

- [x] T073 [P] [US3] Create PasswordReset repository with create/findByToken/markUsed methods in src/repositories/PasswordResetRepository.ts
- [x] T074 [US3] Add sendPasswordReset method to EmailService interface and NodemailerEmailService in src/services/NodemailerEmailService.ts
- [x] T075 [US3] Add requestPasswordReset method to AuthService in src/services/AuthService.ts (generates token, creates reset record, sends email)
- [x] T076 [US3] Add confirmPasswordReset method to AuthService in src/services/AuthService.ts (validates token, updates password, marks used)
- [x] T077 [US3] Create password reset request validation middleware in src/middleware/validators/passwordResetRequestValidator.ts
- [x] T078 [US3] Create password reset confirm validation middleware in src/middleware/validators/passwordResetConfirmValidator.ts
- [x] T079 [US3] Create requestPasswordReset controller in src/controllers/authController.ts (add to existing)
- [x] T080 [US3] Create confirmPasswordReset controller in src/controllers/authController.ts (add to existing)
- [x] T081 [US3] Create POST /api/auth/password-reset/request route in src/routes/auth.ts (add to existing)
- [x] T082 [US3] Create POST /api/auth/password-reset/confirm route in src/routes/auth.ts (add to existing)
- [x] T083 [US3] Integrate auth event logging for 'password_reset_request', 'password_reset_complete', 'password_reset_failure' events

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - users can register, login, and reset forgotten passwords. Run all tests.

---

## Phase 6: User Story 4 - Session Management with 24-Hour Expiry (Priority: P2)

**Goal**: Sessions are managed via JWT tokens with a 24-hour expiry window. Expired tokens force re-authentication. The system tracks session validity and provides logout capability to immediately invalidate tokens.

**Independent Test**: "Verify JWT tokens expire after 24 hours, verify expired tokens are rejected, confirm logout invalidates token immediately, and verify session timeout provides clear error message."

### Tests for User Story 4 (TDD: Write FIRST, ensure FAIL before implementation)

- [x] T084 [P] [US4] Create unit test for token expiry validation in tests/unit/services/TokenService.test.ts (add to existing)
- [x] T085 [P] [US4] Create unit test for AuthService.logoutUser method in tests/unit/services/AuthService.test.ts (add to existing)
- [x] T086 [US4] Create integration test for POST /api/auth/logout endpoint in tests/integration/auth/logout.test.ts
- [x] T087 [US4] Create integration test for expired token rejection in tests/integration/auth/expired-token.test.ts
- [x] T088 [US4] Create E2E test for complete session lifecycle in tests/e2e/session-lifecycle.test.ts

### Implementation for User Story 4

- [x] T089 [US4] Add token expiry check to authenticate middleware in src/middleware/authenticate.ts (JWT exp claim validation)
- [x] T090 [US4] Create TokenBlacklist service with Redis (optional, for immediate logout) in src/services/TokenBlacklistService.ts
- [x] T091 [US4] Add logoutUser method to AuthService in src/services/AuthService.ts (blacklist token if Redis configured)
- [x] T092 [US4] Update authenticate middleware to check token blacklist in src/middleware/authenticate.ts (add blacklist check)
- [x] T093 [US4] Create logout controller in src/controllers/authController.ts (add to existing)
- [x] T094 [US4] Create POST /api/auth/logout route in src/routes/auth.ts (add to existing, protected route)
- [x] T095 [US4] Integrate auth event logging for 'logout' events in AuthService.logoutUser
- [x] T096 [US4] Update error handler to return clear "Unauthorized" message for expired tokens in src/middleware/errorHandler.ts

**Checkpoint**: All user stories (1-4) should now be independently functional - complete authentication system with registration, login, password reset, and session management. Run full test suite.

---

## Phase 7: User Story 5 - Password Change for Authenticated Users (Supporting Feature)

**Goal**: Logged-in users can change their password by providing current password for verification. All existing JWT tokens are invalidated after password change.

**Independent Test**: "User logs in, changes password with valid current password, verifies old token no longer works, and verifies login with new password succeeds."

### Tests for User Story 5 (TDD: Write FIRST, ensure FAIL before implementation)

- [x] T097 [P] [US5] Create unit test for AuthService.changePassword method in tests/unit/services/AuthService.test.ts (add to existing)
- [x] T098 [US5] Create integration test for POST /api/auth/password-change endpoint in tests/integration/auth/password-change.test.ts
- [x] T099 [US5] Create E2E test for password change flow in tests/e2e/password-change-flow.test.ts

### Implementation for User Story 5

- [x] T100 [US5] Add changePassword method to AuthService in src/services/AuthService.ts (verify current password, update new password)
- [x] T101 [US5] Create password change validation middleware in src/middleware/validators/passwordChangeValidator.ts
- [x] T102 [US5] Create changePassword controller in src/controllers/authController.ts (add to existing)
- [x] T103 [US5] Create POST /api/auth/password-change route in src/routes/auth.ts (add to existing, protected route)
- [x] T104 [US5] Integrate auth event logging for 'password_change' events in AuthService.changePassword
- [x] T105 [US5] Add token invalidation logic to changePassword method (increment token version or blacklist all user tokens)

**Checkpoint**: Complete authentication system with all 5 user stories functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T106 [P] Add JSDoc documentation to all exported functions per constitution requirement
- [x] T107 [P] Create API documentation page serving OpenAPI spec at GET /api/docs
- [x] T108 [P] Add rate limiting middleware to prevent brute-force attacks in src/middleware/rateLimiter.ts
- [x] T109 [P] Add request ID tracking for distributed tracing in src/middleware/requestId.ts
- [x] T110 Create database cleanup job for expired password resets in src/jobs/cleanupExpiredResets.ts
- [x] T111 Create database cleanup job for old auth events (90-day retention) in src/jobs/cleanupOldAuthEvents.ts
- [x] T112 Code cleanup and refactoring: ensure max 20 lines per function (constitution)
- [x] T113 [P] Add performance monitoring and metrics collection
- [x] T114 [P] Security audit: verify no password/token logging, email enumeration prevention
- [x] T115 Run full test suite and verify 80% code coverage requirement (constitution)
- [x] T116 Validate quickstart.md instructions work on fresh environment
- [x] T117 [P] Create deployment documentation in docs/deployment.md
- [x] T118 [P] Create Docker configuration (Dockerfile, docker-compose.yml) for containerized deployment
- [x] T119 Final code quality check: typecheck, lint, format, test
- [x] T120 Create CHANGELOG.md with feature release notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3 (US1 - Registration)**: Depends on Phase 2 completion
- **Phase 4 (US2 - Login)**: Depends on Phase 2 completion (can run in parallel with US1)
- **Phase 5 (US3 - Password Reset)**: Depends on Phase 2 completion (can run in parallel with US1, US2)
- **Phase 6 (US4 - Session Management)**: Depends on Phase 2 completion, integrates with US2 (logout needs login)
- **Phase 7 (US5 - Password Change)**: Depends on Phase 2 completion, needs US2 (authenticated endpoint)
- **Phase 8 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

All user stories depend on Phase 2 (Foundational) completion. After that:

- ✅ **User Story 1 (Registration - P1)**: Independent - no dependencies on other stories
- ✅ **User Story 2 (Login - P1)**: Independent - can be developed in parallel with US1
- ✅ **User Story 3 (Password Reset - P2)**: Independent - can be developed in parallel with US1/US2
- ⚠️ **User Story 4 (Session Management - P2)**: Soft dependency on US2 (logout needs login endpoint) but independently testable
- ⚠️ **User Story 5 (Password Change - Supporting)**: Soft dependency on US2 (needs authentication middleware) but independently testable

### Within Each User Story

1. **Tests FIRST** (TDD): Write all tests for the story, ensure they FAIL
2. **Repositories/Data Access**: Create database interaction layer
3. **Services**: Implement business logic
4. **Validators**: Create input validation middleware
5. **Controllers**: Implement request handlers
6. **Routes**: Wire up endpoints
7. **Integration**: Add cross-cutting concerns (logging, events)
8. **Run Tests**: Verify all tests now PASS

### Parallel Opportunities

**Phase 1 (Setup)**: Tasks T003-T012 can all run in parallel (different files)

**Phase 2 (Foundational)**:
- Database migrations T016, T017 parallel (different tables)
- Core types T020, T021, T022, T023, T024 parallel (different files)
- Utilities T026, T027, T028 parallel (different files)
- Middleware T030, T031 parallel (different files)

**Phase 3 (US1)**:
- Tests T036, T037, T038, T039 parallel (different files)
- Initial implementation T042, T043 parallel (different concerns)

**Across User Stories** (after Phase 2):
- With 3 developers: US1 (Dev A), US2 (Dev B), US3 (Dev C) can proceed in parallel
- Without team parallelization: Implement in priority order (P1 → P2)

---

## Parallel Example: User Story 1 (Registration)

```bash
# Step 1: Launch all tests together (TDD - write first):
Parallel: T036 (User model test)
Parallel: T037 (Password validator test)
Parallel: T038 (Email validator test)
Parallel: T039 (AuthService.registerUser test)
Then: T040 (Integration test)
Then: T041 (E2E test)

# Step 2: Launch parallel implementation tasks:
Parallel: T042 (User repository)
Parallel: T043 (EmailService interface)
Then: T044 (NodemailerEmailService implementation)
Then: T045 (AuthService with registration)
Then: T046-T051 (Sequential - building on each other)
```

---

## Parallel Example: Multiple User Stories

```bash
# After Phase 2 completion, with 3 developers:

Developer A:
  Phase 3 (US1 - Registration): T036-T051

Developer B:
  Phase 4 (US2 - Login): T052-T066

Developer C:
  Phase 5 (US3 - Password Reset): T067-T083

# Each developer can work independently, then integrate at the end
```

---

## Implementation Strategy

### MVP First (Recommended - User Stories 1 & 2 Only)

1. ✅ Complete **Phase 1**: Setup (T001-T012)
2. ✅ Complete **Phase 2**: Foundational (T013-T035) - CRITICAL BLOCKING PHASE
3. ✅ Complete **Phase 3**: User Story 1 - Registration (T036-T051)
4. ✅ Complete **Phase 4**: User Story 2 - Login (T052-T066)
5. **STOP and VALIDATE**: Run full test suite, verify 80% coverage
6. **MVP READY**: Users can register and login - deploy and validate in staging
7. Optional: Add US3 (Password Reset) and US4 (Session Management) as post-MVP enhancements

### Incremental Delivery (Full Feature Set)

1. Complete Setup + Foundational → Database and infrastructure ready
2. Add User Story 1 (Registration) → Test independently → First deployable increment
3. Add User Story 2 (Login) → Test independently → MVP complete (register + login)
4. Add User Story 3 (Password Reset) → Test independently → Enhanced UX
5. Add User Story 4 (Session Management) → Test independently → Complete security model
6. Add User Story 5 (Password Change) → Test independently → Full feature parity
7. Polish Phase → Production-ready deployment

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers after Phase 2 completion:

1. **Setup Team** (1 person): Complete Phase 1 + Phase 2 together (~2-3 days)
2. **Parallel Development** (3 people):
   - Developer A: Phase 3 (US1 - Registration)
   - Developer B: Phase 4 (US2 - Login)
   - Developer C: Phase 5 (US3 - Password Reset)
3. **Integration** (all): Phase 6 (US4) and Phase 7 (US5) require coordination
4. **Polish** (all): Phase 8 final quality pass

---

## Task Summary

| Phase | User Story | Task Count | Dependencies | Parallel? |
|-------|------------|------------|--------------|-----------|
| Phase 1 | Setup | 12 tasks | None | Yes (T003-T012) |
| Phase 2 | Foundational | 23 tasks | Phase 1 | Partial (many parallel) |
| Phase 3 | US1 - Registration (P1) | 16 tasks | Phase 2 | Tests parallel, then sequential |
| Phase 4 | US2 - Login (P1) | 15 tasks | Phase 2 | Tests parallel, then sequential |
| Phase 5 | US3 - Password Reset (P2) | 17 tasks | Phase 2 | Tests parallel, then sequential |
| Phase 6 | US4 - Session Management (P2) | 13 tasks | Phase 2, US2 (soft) | Tests parallel, then sequential |
| Phase 7 | US5 - Password Change | 9 tasks | Phase 2, US2 (soft) | Tests parallel, then sequential |
| Phase 8 | Polish | 15 tasks | All user stories | Many parallel |
| **TOTAL** | **All** | **120 tasks** | - | - |

### MVP Scope (Recommended First Milestone)

**Phases 1-4 only** = 66 tasks  
**Delivers**: User registration + Login with JWT tokens  
**Testing**: 80% coverage on core authentication flows  
**Timeline**: ~2 weeks (1 developer) or ~1 week (2 developers in parallel)

### Full Feature Set

**All Phases** = 120 tasks  
**Delivers**: Complete authentication system per spec.md  
**Testing**: Full test coverage (unit, integration, E2E)  
**Timeline**: ~4 weeks (1 developer) or ~2 weeks (3 developers in parallel)

---

## Notes

- ✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story] Description with file path`
- ✅ Tasks organized by user story for independent implementation and testing
- ✅ Tests included (TDD approach) per user specification: "Use Jest for testing"
- ✅ [P] marker indicates tasks that can run in parallel (different files, no dependencies)
- ✅ [Story] label (US1, US2, etc.) maps each task to its user story
- ✅ File paths are explicit for every task
- ✅ Each user story has an "Independent Test" definition for verification
- ✅ Checkpoints after each phase for validation
- ✅ Clear dependency graph showing execution order
- ✅ MVP path identified (Phases 1-4) for quickest time-to-value
- ✅ Constitution compliance: TypeScript strict mode, JSDoc documentation, 80% test coverage, clean code principles

**Next Steps**: 
1. Create feature branch: `git checkout -b 001-user-auth`
2. Start with Phase 1 (Setup)
3. Follow TDD approach: write tests first, ensure they fail, then implement
4. Commit after completing each logical group of tasks
5. Run `npm run pre-commit` before each commit to ensure quality gates pass
