// Jest test environment setup
// Sets required environment variables for all tests

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
process.env.JWT_EXPIRY = '24h';
process.env.PORT = '3001';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'authn_system_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_SSL = 'false';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.SMTP_FROM = 'test@example.com';
process.env.APP_URL = 'http://localhost:3001';
process.env.PASSWORD_RESET_EXPIRY_HOURS = '1';
