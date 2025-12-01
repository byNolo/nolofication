import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'
import { getSitesAdmin } from '../utils/api'

function BroadcastForm() {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [htmlMessage, setHtmlMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [sites, setSites] = useState([])
  const [target, setTarget] = useState('all')
  const [selectedSite, setSelectedSite] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isAdmin = user?.keyn_user_id === '1' && user?.username?.toLowerCase() === 'sam'

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getSitesAdmin()
        if (mounted) setSites(data.sites || [])
      } catch (e) {
        // ignore - sites list optional
      }
    })()
    return () => { mounted = false }
  }, [])

  const send = async () => {
    if (!isAdmin) return
    if (!title || !message) {
      setResult({ error: 'Title and message are required' })
      return
    }

    try {
      setSending(true)
      setResult(null)
      const token = localStorage.getItem('auth_token')
      const payload = { title, message, type }
      if (htmlMessage) payload.html_message = htmlMessage
      if (target === 'site_users' && selectedSite) {
        payload.target = 'site_users'
        payload.site_id = selectedSite
      }

      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        setResult({ error: data.error || 'Failed to send broadcast' })
      } else {
        setResult({ ok: true, details: data.results })
        setTitle('')
        setMessage('')
        setHtmlMessage('')
      }
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setSending(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        className="w-full bg-dark-bg px-3 py-2 rounded border border-border-gray"
        placeholder="Announcement title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        className="w-full bg-dark-bg px-3 py-2 rounded border border-border-gray"
        placeholder="Message (plain text)"
        rows={3}
        value={message}
        onChange={e => setMessage(e.target.value)}
      />

      <div>
        <label className="text-sm text-gray-300">HTML Message (optional)</label>
        <div className="mt-1">
          <ReactQuill
            theme="snow"
            value={htmlMessage}
            onChange={setHtmlMessage}
            modules={{ toolbar: [['bold','italic','underline'], [{ 'list': 'bullet' }], ['link', 'code'] ] }}
            formats={[ 'bold','italic','underline','list','link','code' ]}
          />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showPreview} onChange={e => setShowPreview(e.target.checked)} />
            <span>Show HTML Preview</span>
          </label>
        </div>
        {showPreview && (
          <div className="mt-3 p-3 bg-black/50 rounded border border-border-gray">
            <div dangerouslySetInnerHTML={{ __html: htmlMessage || '<em>No HTML provided</em>' }} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <select value={type} onChange={e => setType(e.target.value)} className="bg-dark-bg px-2 py-1 rounded border border-border-gray">
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300 mr-2">Target:</label>
          <select value={target} onChange={e => setTarget(e.target.value)} className="bg-dark-bg px-2 py-1 rounded border border-border-gray">
            <option value="all">All users</option>
            <option value="site_users">Users of selected site</option>
          </select>
          {target === 'site_users' && (
            <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)} className="bg-dark-bg px-2 py-1 rounded border border-border-gray">
              <option value="">Select site</option>
              {sites.map(s => (
                <option key={s.site_id} value={s.site_id}>{s.site_id} — {s.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="ml-auto">
          <Button onClick={() => setConfirmOpen(true)} disabled={sending}>{sending ? 'Sending...' : 'Send Broadcast'}</Button>
        </div>
      </div>

      {result?.error && (
        <p className="text-red-500 text-sm">{result.error}</p>
      )}
      {result?.ok && (
        <p className="text-green-500 text-sm">Broadcast sent to {result.details?.total || 'N/A'} users</p>
      )}

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Broadcast"
        footer={(
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={send} disabled={sending}>{sending ? 'Sending...' : 'Confirm & Send'}</Button>
          </>
        )}
      >
        <div className="space-y-3">
          <p className="font-semibold">{title}</p>
          <div className="text-sm text-gray-300">{message}</div>
          {htmlMessage && (
            <div>
              <p className="text-sm font-medium mt-2">HTML Preview:</p>
              <div className="mt-2 p-3 bg-black/50 rounded border border-border-gray">
                <div dangerouslySetInnerHTML={{ __html: htmlMessage }} />
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500">Target: {target === 'all' ? 'All users' : `Users of ${selectedSite || '(no site selected)'}`}</p>
        </div>
      </Modal>
    </div>
  )
}

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
          <div className="text-center p-6">
            <p className="text-gray-600 text-sm mb-1">Total Sites</p>
            <p className="text-3xl font-bold">{dashboard?.stats?.sites || 0}</p>
            <p className="text-sm text-green-600 mt-1">
              {dashboard?.stats?.active_sites || 0} active
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center p-6">
            <p className="text-gray-600 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold">{dashboard?.stats?.users || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center p-6">
            <p className="text-gray-600 text-sm mb-1">Notifications</p>
            <p className="text-3xl font-bold">{dashboard?.stats?.notifications || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center p-6">
            <p className="text-gray-600 text-sm mb-1">Pending Sites</p>
            <p className="text-3xl font-bold text-orange-600">
              {dashboard?.stats?.pending_sites || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Channel Stats */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Notifications by Channel</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-2xl font-bold">{dashboard?.channels?.email || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Web Push</p>
              <p className="text-2xl font-bold">{dashboard?.channels?.web_push || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Discord</p>
              <p className="text-2xl font-bold">{dashboard?.channels?.discord || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Webhook</p>
              <p className="text-2xl font-bold">{dashboard?.channels?.webhook || 0}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/sites">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="text-center p-6">
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
            <div className="text-center p-6">
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
            <div className="text-center p-6">
              <div className="text-4xl mb-2">📬</div>
              <h3 className="font-bold text-lg">Notifications</h3>
              <p className="text-sm text-gray-600 mt-1">
                View all notification history
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Broadcast Announcement (Admin) */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-3">Broadcast Announcement</h2>
          <p className="text-sm text-gray-600 mb-4">Send an announcement to all users (product updates, major notices).</p>
          <BroadcastForm />
        </div>
      </Card>

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
