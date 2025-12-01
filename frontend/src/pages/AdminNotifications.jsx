import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/Card'
import Button from '../components/Button'

export default function AdminNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [selectedSite, setSelectedSite] = useState('')
  const limit = 50

  const isAdmin = user?.keyn_user_id === '1' && user?.username?.toLowerCase() === 'sam'

  const formatDateToLocal = (iso) => {
    if (!iso) return 'N/A'
    // Treat naive ISO strings (no timezone) as UTC by appending 'Z' when needed
    let s = iso
    if (!/[zZ]|[+\-]\d{2}:?\d{2}$/.test(iso)) {
      s = iso + 'Z'
    }
    const d = new Date(s)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString()
  }
  useEffect(() => {
    if (isAdmin) {
      fetchNotifications()
    }
  }, [isAdmin, offset, selectedSite])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      let url = `/api/admin/notifications?limit=${limit}&offset=${offset}`
      if (selectedSite) url += `&site_id=${selectedSite}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch notifications')

      const data = await response.json()
      setNotifications(data.notifications)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6">
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Notifications</h1>
        <p className="text-gray-600">{total} total notifications</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{notification.title}</h3>
                      <code className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded">{notification.site_name || notification.site_id}</code>
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Created: {formatDateToLocal(notification.created_at)}</p>
                      {notification.category && (
                        <p>Category: {notification.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-4">
                    {notification.channels?.email && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Email</span>
                    )}
                    {notification.channels?.web_push && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Push</span>
                    )}
                    {notification.channels?.discord && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Discord</span>
                    )}
                    {notification.channels?.webhook && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Webhook</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-600">
              Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
