import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Settings, Home, Zap, LogOut, User, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isAdmin = user?.keyn_user_id === '1' && user?.username?.toLowerCase() === 'sam'

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const navLinkClass = (path) => `
    flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
    ${isActive(path)
      ? 'bg-[#00c853] text-white shadow-lg shadow-[#00c853]/30'
      : 'text-[#f3f7f7]/70 hover:text-[#f3f7f7] hover:bg-[#2a2f31]'
    }
  `

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0f10] via-[#0f1416] to-[#080b0c]">
      {/* Header */}
      <header className="border-b border-[#2a2f31] bg-[#13181a]/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-[#00c853] blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <Zap className="h-8 w-8 text-[#2ee9ff] relative" fill="currentColor" />
              </div>
              <h1 className="text-2xl font-bold">
                <span className="text-[#00c853]">Nolo</span>
                <span className="text-[#f3f7f7]">fication</span>
              </h1>
            </Link>

            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-2">
                <Link to="/" className={navLinkClass('/')}>
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <Link to="/preferences" className={navLinkClass('/preferences')}>
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Preferences</span>
                </Link>
                <Link to="/notifications" className={navLinkClass('/notifications')}>
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className={navLinkClass('/admin')}>
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
              </nav>

              {user && (
                <div className="flex items-center gap-3 pl-4 border-l border-[#2a2f31]">
                  <div className="hidden md:flex items-center gap-2 text-[#f3f7f7]/70">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user.username || user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#f3f7f7]/70 hover:text-[#f3f7f7] hover:bg-[#2a2f31] transition-all duration-200"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2f31] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-[#f3f7f7]/50 text-sm">
            <p>Nolofication - Unified notifications for apps byNolo</p>
            <p className="mt-1">Powered by KeyN OAuth</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
