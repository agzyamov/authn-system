-- Down migrations (rollback)

DROP TRIGGER IF EXISTS users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS auth_events;
DROP TYPE IF EXISTS auth_event_type;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS users;
