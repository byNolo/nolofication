import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/Card'
import Button from '../components/Button'

export default function Admin() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is admin (KeyN ID 1, username Sam)
  const isAdmin = user?.keyn_user_id === '1' && user?.username?.toLowerCase() === 'sam'

  useEffect(() => {
    if (!isAdmin) return

    fetchDashboard()
  }, [isAdmin])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setDashboard(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">You do not have admin privileges.</p>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchDashboard} className="mt-4">Retry</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage sites, users, and monitor notifications</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Total Sites</p>
            <p className="text-3xl font-bold">{dashboard?.stats?.sites || 0}</p>
            <p className="text-sm text-green-600 mt-1">
              {dashboard?.stats?.active_sites || 0} active
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold">{dashboard?.stats?.users || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Notifications</p>
            <p className="text-3xl font-bold">{dashboard?.stats?.notifications || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Pending Sites</p>
            <p className="text-3xl font-bold text-orange-600">
              {dashboard?.stats?.pending_sites || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Channel Stats */}
      <Card className="mb-8">
        <h2 className="text-xl font-bold mb-4">Notifications by Channel</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-2xl font-bold">{dashboard?.channels?.email || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Web Push</p>
            <p className="text-2xl font-bold">{dashboard?.channels?.web_push || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Discord</p>
            <p className="text-2xl font-bold">{dashboard?.channels?.discord || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Webhook</p>
            <p className="text-2xl font-bold">{dashboard?.channels?.webhook || 0}</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/sites">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🌐</div>
              <h3 className="font-bold text-lg">Manage Sites</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create, edit, and approve sites
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/admin/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="text-center py-6">
              <div className="text-4xl mb-2">👥</div>
              <h3 className="font-bold text-lg">View Users</h3>
              <p className="text-sm text-gray-600 mt-1">
                Browse and search users
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/admin/notifications">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="text-center py-6">
              <div className="text-4xl mb-2">📬</div>
              <h3 className="font-bold text-lg">Notifications</h3>
              <p className="text-sm text-gray-600 mt-1">
                View all notification history
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Notifications */}
      {dashboard?.recent_notifications?.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold mb-4">Recent Notifications</h2>
          <div className="space-y-3">
            {dashboard.recent_notifications.map((notification) => (
              <div key={notification.id} className="border-b pb-3 last:border-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message.substring(0, 100)}
                      {notification.message.length > 100 ? '...' : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      To: {notification.username} • 
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-4">
                    {notification.sent_via_email && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Email
                      </span>
                    )}
                    {notification.sent_via_web_push && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Push
                      </span>
                    )}
                    {notification.sent_via_discord && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Discord
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
