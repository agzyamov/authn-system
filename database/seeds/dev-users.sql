-- Development seed data
-- Passwords are bcrypt hashed (cost factor 12)
-- All passwords in seed data use: "TestPassword123"
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtTEd0z6TtTEd0z6TtTEd0z6TtTE (example)

-- Note: Regenerate hashes before use in development
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TestPassword123', 12).then(console.log)"

INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'alice@example.com',
  '$2b$12$placeholder_hash_alice_replace_me_with_real_hash_value',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
),
(
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'bob@example.com',
  '$2b$12$placeholder_hash_bob_replace_me_with_real_hash_value',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
)
ON CONFLICT (email) DO NOTHING;
