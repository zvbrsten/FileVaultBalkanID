# FileVault Frontend

A modern React-based frontend for the FileVault file storage and sharing platform.

## Features

- **User Authentication**: Login and registration with JWT tokens
- **File Management**: Upload, download, and organize files
- **Advanced Search**: Search files with multiple criteria
- **File Sharing**: Create and manage file shares with public access
- **Admin Panel**: System administration and user management
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live file upload progress and status updates

## Technology Stack

- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API requests

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- FileVault backend running on port 8080

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp env.example .env
```

3. Update environment variables in `.env`:
```
REACT_APP_API_URL=http://localhost:8080
```

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`.

## Available Scripts

- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run tests
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx      # Navigation component
│   └── ProtectedRoute.tsx # Route protection
├── pages/              # Page components
│   ├── LoginPage.tsx   # User login
│   ├── SignupPage.tsx  # User registration
│   ├── DashboardPage.tsx # Main dashboard
│   ├── FilesPage.tsx   # File management
│   ├── UploadPage.tsx  # File upload
│   ├── SearchPage.tsx  # File search
│   └── AdminPage.tsx   # Admin panel
├── providers/          # Context providers
│   └── AuthProvider.tsx # Authentication context
├── App.tsx            # Main app component
├── index.tsx          # App entry point
└── index.css          # Global styles
```

## Features Overview

### Authentication
- Secure login and registration
- JWT token management
- Protected routes
- Role-based access control

### File Management
- Drag and drop file upload
- Progress tracking
- File type detection
- Duplicate detection
- File organization

### Search & Discovery
- Advanced search with multiple criteria
- File type filtering
- Date range filtering
- Size filtering
- Sort options

### File Sharing
- Create public file shares
- Share link generation
- Download tracking
- Expiration settings
- Access controls

### Admin Panel
- System statistics
- User management
- System health monitoring
- Storage analytics
- Admin actions

## API Integration

The frontend communicates with the FileVault backend through:

- **GraphQL API**: For complex queries and mutations
- **REST API**: For file uploads and downloads
- **WebSocket**: For real-time updates (future)

## Styling

The application uses Tailwind CSS for styling with:

- Custom color palette
- Responsive design
- Component-based styling
- Dark mode support (future)
- Accessibility features

## State Management

- **React Context**: For authentication state
- **TanStack Query**: For server state management
- **Local State**: For component-specific state

## Security

- JWT token authentication
- Protected routes
- Input validation
- XSS protection
- CSRF protection

## Performance

- Code splitting
- Lazy loading
- Image optimization
- Bundle optimization
- Caching strategies

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.


