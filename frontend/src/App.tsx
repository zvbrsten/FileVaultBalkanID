import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { client } from './api/client';
import { AuthProvider } from './hooks/useAuth';
import { NotificationProvider } from './hooks/useNotification';
import QueryProvider from './providers/QueryProvider';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import FilesPage from './pages/FilesPage';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import PublicFileViewer from './components/FileShare/PublicFileViewer';
import GlobalBackground from './components/Background/GlobalBackground';
import NotificationWrapper from './components/Notification/NotificationWrapper';

function App() {
  return (
    <ApolloProvider client={client}>
      <QueryProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <GlobalBackground>
              <Routes>
                {/* Public routes (no navbar) */}
                <Route path="/share/:token" element={<PublicFileViewer shareToken={window.location.pathname.split('/')[2]} />} />
                
                {/* All other routes (with navbar) */}
                <Route path="/*" element={
                  <>
                    <Navbar />
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/upload" 
                        element={
                          <ProtectedRoute>
                            <UploadPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/files" 
                        element={
                          <ProtectedRoute>
                            <FilesPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/search" 
                        element={
                          <ProtectedRoute>
                            <SearchPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute>
                            <AdminPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/" element={<Navigate to="/files" replace />} />
                    </Routes>
                  </>
                } />
              </Routes>
              <NotificationWrapper />
            </GlobalBackground>
          </Router>
          </NotificationProvider>
        </AuthProvider>
      </QueryProvider>
    </ApolloProvider>
  );
}

export default App;







