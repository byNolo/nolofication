import { useState, useEffect } from 'react'
import { Bell, Check, Filter, ChevronRight } from 'lucide-react'
import Card, { CardHeader, CardBody } from '../components/Card'
import Button from '../components/Button'
import { useApi, useMutation } from '../hooks/useApi'
import { getNotifications, markNotificationRead, markAllNotificationsRead, getSites } from '../utils/api'

export default function Notifications() {
  const [filter, setFilter] = useState('all')
  const [selectedSite, setSelectedSite] = useState('all')
  
  const { data: sitesData } = useApi(getSites, [])
  const { data: notificationsData, loading, error, refetch } = useApi(
    () => getNotifications({ 
      read: filter === 'unread' ? false : undefined,
      siteId: selectedSite !== 'all' ? selectedSite : undefined
    }), 
    [filter, selectedSite]
  )
  const { mutate: markRead } = useMutation(markNotificationRead)
  const { mutate: markAllRead } = useMutation(markAllNotificationsRead)

  // Extract arrays from response
  const sites = sitesData?.sites || []
  const notifications = notificationsData?.notifications || []

  const handleMarkRead = async (notificationId) => {
    await markRead(notificationId)
    refetch()
  }

  const handleMarkAllRead = async () => {
    await markAllRead(selectedSite !== 'all' ? selectedSite : null)
    refetch()
  }

  const siteOptions = ['all', ...(sites?.map(s => s.site_id) || [])]

  const typeColors = {
    info: 'border-l-electric-cyan',
    success: 'border-l-nolo-green',
    warning: 'border-l-yellow-500',
    error: 'border-l-red-500',
  }

  const typeBadges = {
    info: 'bg-electric-cyan/10 text-electric-cyan',
    success: 'bg-nolo-green/10 text-nolo-green',
    warning: 'bg-yellow-500/10 text-yellow-500',
    error: 'bg-red-500/10 text-red-500',
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-white">Notifications</h1>
        <p className="text-text-white/60 mt-2">
          View and manage your notification history
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-white/60" />
            <span className="text-sm text-text-white/60">Filter:</span>
          </div>
          
          <div className="flex gap-2">
            {['all', 'unread'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${filter === f
                    ? 'bg-nolo-green text-white'
                    : 'bg-dark-bg text-text-white/70 hover:text-text-white hover:bg-dark-bg/70'
                  }
                `}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border-gray" />

          <div className="flex gap-2">
            {siteOptions.map(site => (
              <button
                key={site}
                onClick={() => setSelectedSite(site)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${selectedSite === site
                    ? 'bg-electric-cyan text-dark-bg'
                    : 'bg-dark-bg text-text-white/70 hover:text-text-white hover:bg-dark-bg/70'
                  }
                `}
              >
                {site}
              </button>
            ))}
          </div>

          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Mark All Read
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <Card>
          <CardBody className="text-center py-12 text-text-white/60">
            Loading notifications...
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody className="text-center py-12 text-red-400">
            Error loading notifications: {error}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Bell className="h-12 w-12 text-text-white/30 mx-auto mb-4" />
              <p className="text-text-white/60">No notifications found</p>
            </CardBody>
          </Card>
          ) : (
            notifications.map(notification => {
              const site = sites?.find(s => s.site_id === notification.site_id)
              return (
                <Card 
                  key={notification.id}
                  className={`
                    border-l-4 ${typeColors[notification.type]}
                    ${!notification.is_read ? 'bg-dark-surface' : 'bg-dark-surface/50'}
                  `}
                >
                  <CardBody className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-nolo-green" />
                            )}
                            <h3 className="font-semibold text-text-white">
                              {notification.title}
                            </h3>
                          </div>
                          <p className="text-text-white/70">{notification.message}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${typeBadges[notification.type]}`}>
                            {notification.type}
                          </span>
                          <span className="text-xs text-text-white/50">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-text-white/50">
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-electric-cyan">{site?.name || notification.site_id}</span>
                        </span>
                        <span>•</span>
                        <div className="flex items-center gap-2">
                          {notification.channels_sent && Object.entries(notification.channels_sent).map(([channel, sent]) => 
                            sent && (
                              <span key={channel} className="flex items-center gap-1">
                                <Check className="h-3 w-3 text-nolo-green" />
                                {channel}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {!notification.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notification.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </CardBody>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
