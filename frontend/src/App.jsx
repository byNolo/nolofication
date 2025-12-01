import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Preferences from './pages/Preferences'
import SitePreferences from './pages/SitePreferences'
import Notifications from './pages/Notifications'
import DiscordCallback from './pages/DiscordCallback'
import Admin from './pages/Admin'
import AdminSites from './pages/AdminSites'
import AdminUsers from './pages/AdminUsers'
import AdminNotifications from './pages/AdminNotifications'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<Login />} />
          <Route path="/auth/discord/callback" element={<DiscordCallback />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
            <Route path="sites/:siteId/preferences" element={<ProtectedRoute><SitePreferences /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="admin/sites" element={<ProtectedRoute><AdminSites /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
