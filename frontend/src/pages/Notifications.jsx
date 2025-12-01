import { useState } from 'react'
import { Bell, Filter } from 'lucide-react'
import Card, { CardBody } from '../components/Card'
import { useApi } from '../hooks/useApi'
import { getNotifications, getSites } from '../utils/api'

export default function Notifications() {
  const [selectedSite, setSelectedSite] = useState('all')
  
  const { data: sitesData } = useApi(getSites, [])
  const { data: notificationsData, loading, error } = useApi(
    () => getNotifications({ 
      siteId: selectedSite !== 'all' ? selectedSite : undefined
    }), 
    [selectedSite]
  )

  // Extract arrays from response
  const sites = sitesData?.sites || []
  const notifications = notificationsData?.notifications || []

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

  const formatDate = (isoString) => {
    if (!isoString) return ''

    // Some backends emit naive ISO strings (no timezone). Those are UTC
    // timestamps in this app. Browsers may interpret naive ISO as local time,
    // which causes incorrect offsets. Append 'Z' when there's no timezone
    // designator so Date parses it as UTC.
    let s = String(isoString)
    if (!/[zZ]|[+\-]\d{2}:?\d{2}$/.test(s)) {
      s = s + 'Z'
    }

    let date = new Date(s)
    const now = new Date()
    let diffMs = now - date

    // If parsing produced a future date (negative diff), clamp to 0 so we
    // don't display things like "-297m ago" or incorrectly show "Just now"
    if (diffMs < 0) diffMs = 0

    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
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
            <span className="text-sm text-text-white/60">Filter by site:</span>
          </div>

          <div className="flex gap-2 flex-wrap">
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
            notifications.map(notification => (
              <Card 
                key={notification.id}
                className={`border-l-4 ${typeColors[notification.type]}`}
              >
                <CardBody className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-white text-lg mb-1">
                          {notification.title}
                        </h3>
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

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-text-white/50">Site:</span>
                        <span className="font-medium text-electric-cyan">
                          {notification.site_name}
                        </span>
                      </div>
                      
                      {notification.category && (
                        <>
                          <span className="text-text-white/30">•</span>
                          <div className="flex items-center gap-2">
                            <span className="text-text-white/50">Category:</span>
                            <span className="font-medium text-nolo-green">
                              {notification.category}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {notification.channels && Object.entries(notification.channels).some(([_, sent]) => sent) && (
                        <>
                          <span className="text-text-white/30">•</span>
                          <div className="flex items-center gap-2">
                            <span className="text-text-white/50">Sent via:</span>
                            <div className="flex gap-2">
                              {Object.entries(notification.channels).map(([channel, sent]) => 
                                sent && (
                                  <span key={channel} className="px-2 py-0.5 bg-dark-bg rounded text-xs text-text-white/70">
                                    {channel.replace('_', ' ')}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
