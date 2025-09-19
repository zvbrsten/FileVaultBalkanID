-- Create admin user for testing
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (id, email, username, password, role, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@filevault.com',
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
