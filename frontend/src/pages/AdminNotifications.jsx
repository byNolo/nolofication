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
        <Card>
          <div className="text-center py-12">
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
              <Card key={notification.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{notification.title}</h3>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {notification.site_id}
                      </code>
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>To: {notification.username} (KeyN ID: {notification.keyn_user_id})</p>
                      <p>Created: {new Date(notification.created_at).toLocaleString()}</p>
                      {notification.category_key && (
                        <p>Category: {notification.category_key}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-4">
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
                    {notification.sent_via_webhook && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        Webhook
                      </span>
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
