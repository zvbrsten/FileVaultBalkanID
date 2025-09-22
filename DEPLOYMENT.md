# FileVault Deployment Guide

## Environment Variables

### Frontend (.env)
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8080

# For production deployment, set this to your actual domain:
# REACT_APP_API_URL=https://your-domain.com
```

### Backend
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=filevault
DB_PASSWORD=password123
DB_NAME=filevault

# AWS S3
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=filevaultbalkan

# Server
PORT=8080
GIN_MODE=release
```

## Public File Sharing

The public file sharing feature is now deployment-ready:

1. **Frontend**: Uses `process.env.REACT_APP_API_URL` or falls back to `window.location.origin`
2. **Backend**: Includes proper CORS headers for public access
3. **Filename Handling**: Downloads files with original filenames via Content-Disposition headers

### URL Format
- Development: `http://localhost:8080/public/{file-id}`
- Production: `https://your-domain.com/public/{file-id}`

## Deployment Steps

1. Set environment variables
2. Build frontend: `npm run build`
3. Deploy backend with proper AWS credentials
4. Ensure CORS is configured for your domain
5. Test public sharing functionality

## Security Notes

- Public endpoints are accessible without authentication
- Files are served with proper MIME types and caching headers
- CORS is configured for public access
- Consider rate limiting for production use
