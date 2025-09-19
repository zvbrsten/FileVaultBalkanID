-- Fix the generate_share_token function to use proper base64 encoding
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS TEXT AS $$
BEGIN
    RETURN replace(replace(encode(gen_random_uuid()::text::bytea || gen_random_uuid()::text::bytea, 'base64'), '+', '-'), '/', '_');
END;
$$ LANGUAGE plpgsql;
