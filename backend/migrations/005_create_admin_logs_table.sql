-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target);

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_admin_name VARCHAR(255),
    p_action VARCHAR(100),
    p_target VARCHAR(255),
    p_details TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_logs (id, admin_id, admin_name, action, target, details, ip_address, user_agent)
    VALUES (gen_random_uuid(), p_admin_id, p_admin_name, p_action, p_target, p_details, p_ip_address, p_user_agent)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for admin dashboard data
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') as active_users,
    (SELECT COUNT(*) FROM files) as total_files,
    (SELECT COUNT(*) FROM files WHERE is_duplicate = false) as unique_files,
    (SELECT COALESCE(SUM(size), 0) FROM files) as total_storage,
    (SELECT COUNT(*) FROM file_shares) as total_shares,
    (SELECT COUNT(*) FROM file_shares WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())) as active_shares,
    (SELECT COUNT(*) FROM download_logs) as total_downloads;

-- Create view for user management data
CREATE OR REPLACE VIEW user_management_view AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.role,
    u.created_at,
    u.last_login,
    COUNT(f.id) as file_count,
    COALESCE(SUM(f.size), 0) as storage_used,
    COUNT(CASE WHEN f.is_duplicate = false THEN 1 END) as unique_files
FROM users u
LEFT JOIN files f ON u.id = f.uploader_id
GROUP BY u.id, u.email, u.username, u.role, u.created_at, u.last_login;

-- Create view for storage breakdown
CREATE OR REPLACE VIEW storage_breakdown_view AS
SELECT 
    u.username,
    u.email,
    COUNT(f.id) as file_count,
    COALESCE(SUM(f.size), 0) as storage_used,
    COUNT(CASE WHEN f.is_duplicate = false THEN 1 END) as unique_files
FROM users u
LEFT JOIN files f ON u.id = f.uploader_id
GROUP BY u.id, u.username, u.email
ORDER BY storage_used DESC;

-- Create view for top files
CREATE OR REPLACE VIEW top_files_view AS
SELECT 
    f.id,
    f.original_name,
    f.mime_type,
    f.size,
    f.created_at,
    u.username,
    u.email
FROM files f
JOIN users u ON f.uploader_id = u.id
ORDER BY f.size DESC;

-- Create view for recent activity
CREATE OR REPLACE VIEW recent_activity_view AS
SELECT 
    'user_registration' as type,
    u.id,
    u.username,
    'User registered: ' || u.email as details,
    u.created_at
FROM users u
WHERE u.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'file_upload' as type,
    f.id,
    u.username,
    'File uploaded: ' || f.original_name as details,
    f.created_at
FROM files f
JOIN users u ON f.uploader_id = u.id
WHERE f.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'file_share' as type,
    fs.id,
    u.username,
    'File shared: ' || f.original_name as details,
    fs.created_at
FROM file_shares fs
JOIN files f ON fs.file_id = f.id
JOIN users u ON f.uploader_id = u.id
WHERE fs.created_at > NOW() - INTERVAL '7 days'

ORDER BY created_at DESC;


