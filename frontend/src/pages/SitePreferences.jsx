import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Save, ArrowLeft, RotateCcw, Send, Clock, Calendar, Bell, BellOff } from 'lucide-react'
import Card, { CardHeader, CardBody, CardFooter } from '../components/Card'
import Button from '../components/Button'
import Toggle from '../components/Toggle'
import Input from '../components/Input'
import { useApi, useMutation } from '../hooks/useApi'
import { getSite, getSitePreferences, updateSitePreferences, resetSitePreferences, getPreferences, sendTestNotification, getSiteCategories, updateUserCategoryPreference } from '../utils/api'

export default function SitePreferences() {
  const { siteId } = useParams()
  
  const { data: siteInfo, loading: siteLoading } = useApi(() => getSite(siteId), [siteId])
  const { data: sitePrefs, loading: prefsLoading, refetch } = useApi(() => getSitePreferences(siteId), [siteId])
  const { data: globalPrefs, loading: globalLoading } = useApi(getPreferences, [])
  const { data: categoriesData, loading: categoriesLoading, refetch: refetchCategories } = useApi(() => getSiteCategories(siteId), [siteId])
  const { mutate: savePrefs, loading: isSaving } = useMutation(updateSitePreferences)
  const { mutate: resetPrefs, loading: isResetting } = useMutation(resetSitePreferences)
  const { mutate: testNotification } = useMutation(sendTestNotification)
  const { mutate: saveCategoryPref } = useMutation(updateUserCategoryPreference)
  
  const [preferences, setPreferences] = useState({
    email: null,
    web_push: null,
    discord: null,
    webhook: null,
  })
  
  const [scheduleSettings, setScheduleSettings] = useState({
    frequency: 'instant',
    time_of_day: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    weekly_day: 1 // Monday
  })

  const [categoryPreferences, setCategoryPreferences] = useState({})
  const [saveMessage, setSaveMessage] = useState(null)
  const [testResults, setTestResults] = useState({})

  // Load site preferences from API
  useEffect(() => {
    if (sitePrefs?.site_preferences) {
      setPreferences({
        email: sitePrefs.site_preferences.email ?? null,
        web_push: sitePrefs.site_preferences.web_push ?? null,
        discord: sitePrefs.site_preferences.discord ?? null,
        webhook: sitePrefs.site_preferences.webhook ?? null,
      })
      
      // Load schedule settings if available
      const schedule = sitePrefs.site_preferences.schedule
      if (schedule) {
        setScheduleSettings({
          frequency: schedule.frequency || 'instant',
          time_of_day: schedule.time_of_day || '09:00',
          timezone: schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          weekly_day: schedule.weekly_day !== null ? schedule.weekly_day : 1
        })
      }
    }
  }, [sitePrefs])
  
  // Load category preferences
  useEffect(() => {
    if (categoriesData?.categories) {
      const prefs = {}
      categoriesData.categories.forEach(item => {
        const catKey = item.category.key
        const userPref = item.user_preference
        const defaultSchedule = {
          frequency: item.category.defaults?.frequency || 'instant',
          time_of_day: item.category.defaults?.time_of_day || '09:00',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          weekly_day: item.category.defaults?.weekly_day ?? 1
        }
        prefs[catKey] = {
          enabled: userPref?.enabled !== false,
          schedule: userPref?.schedule ? {
            frequency: userPref.schedule.frequency || defaultSchedule.frequency,
            time_of_day: userPref.schedule.time_of_day || defaultSchedule.time_of_day,
            timezone: userPref.schedule.timezone || defaultSchedule.timezone,
            weekly_day: userPref.schedule.weekly_day ?? defaultSchedule.weekly_day
          } : defaultSchedule
        }
      })
      setCategoryPreferences(prefs)
    }
  }, [categoriesData])

  const handleToggle = (channel) => {
    setPreferences(prev => {
      const currentGlobal = globalPrefs?.[channel] ?? false
      const currentValue = prev[channel]
      
      if (currentValue === null) {
        // Not overridden - set to opposite of global
        return { ...prev, [channel]: !currentGlobal }
      } else {
        // Already overridden - toggle or remove override
        return { ...prev, [channel]: currentValue ? null : true }
      }
    })
  }

  const handleSave = async () => {
    const result = await savePrefs(siteId, {
      ...preferences,
      schedule: scheduleSettings
    })
    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Site preferences saved!' })
      refetch()
    } else {
      setSaveMessage({ type: 'error', text: 'Failed to save preferences' })
    }
    setTimeout(() => setSaveMessage(null), 3000)
  }
  
  const handleSaveCategoryPreference = async (categoryKey) => {
    const pref = categoryPreferences[categoryKey]
    const result = await saveCategoryPref(siteId, categoryKey, {
      enabled: pref.enabled,
      schedule: pref.schedule
    })
    if (result.success) {
      setSaveMessage({ type: 'success', text: `${categoryKey} preference saved!` })
      refetchCategories()
    } else {
      setSaveMessage({ type: 'error', text: `Failed to save ${categoryKey}` })
    }
    setTimeout(() => setSaveMessage(null), 3000)
  }
  
  const toggleCategoryEnabled = (categoryKey) => {
    setCategoryPreferences(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        enabled: !prev[categoryKey]?.enabled
      }
    }))
  }
  
  const updateCategorySchedule = (categoryKey, field, value) => {
    setCategoryPreferences(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        schedule: {
          ...prev[categoryKey]?.schedule,
          [field]: value
        }
      }
    }))
  }

  const resetAllPreferences = async () => {
    const result = await resetPrefs(siteId)
    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Preferences reset to global!' })
      setPreferences({
        email: null,
        web_push: null,
        discord: null,
        webhook: null,
      })
      refetch()
    } else {
      setSaveMessage({ type: 'error', text: 'Failed to reset preferences' })
    }
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const getEffectiveValue = (channel) => {
    return preferences[channel] !== null ? preferences[channel] : (globalPrefs?.[channel] ?? false)
  }

  const isOverridden = (channel) => {
    return preferences[channel] !== null
  }

  const handleTest = async (channel) => {
    setTestResults({ ...testResults, [channel]: 'sending' })
    const result = await testNotification(channel)
    if (result.success) {
      setTestResults({ ...testResults, [channel]: 'success' })
      setTimeout(() => setTestResults({ ...testResults, [channel]: null }), 3000)
    } else {
      setTestResults({ ...testResults, [channel]: 'error' })
      setTimeout(() => setTestResults({ ...testResults, [channel]: null }), 3000)
    }
  }

  const channels = [
    { key: 'email', label: 'Email' },
    { key: 'web_push', label: 'Web Push' },
    { key: 'discord', label: 'Discord' },
    { key: 'webhook', label: 'Webhook' },
  ]
  
  const weekDays = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' },
  ]

  const loading = siteLoading || prefsLoading || globalLoading || categoriesLoading

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-electric-cyan hover:text-electric-cyan/80 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-text-white">{siteInfo?.name || siteId}</h1>
        <p className="text-text-white/60 mt-2">
          {siteInfo?.description || 'Loading...'} - Site-specific notification preferences
        </p>
      </div>

      {loading ? (
        <Card>
          <CardBody className="text-center py-8 text-text-white/60">
            Loading preferences...
          </CardBody>
        </Card>
      ) : (
        <>
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-white">Channel Overrides</h2>
              <p className="text-text-white/60 text-sm mt-1">
                Customize notifications for this site only
              </p>
            </div>
            <Button variant="ghost" icon={RotateCcw} size="sm" onClick={resetAllPreferences} disabled={isResetting}>
              {isResetting ? 'Resetting...' : 'Reset All'}
            </Button>
          </div>
        </CardHeader>

        <CardBody className="space-y-4">
          {channels.map(channel => (
            <div key={channel.key} className="flex items-center justify-between p-4 rounded-lg bg-dark-bg/50 border border-border-gray">
              <div className="flex-1">
                <h3 className="font-medium text-text-white">{channel.label}</h3>
                <p className="text-sm text-text-white/60 mt-0.5">
                  {isOverridden(channel.key) ? (
                    <span className="text-electric-cyan">Overridden</span>
                  ) : (
                    <>Using global setting: <span className="text-text-white/80">{globalPrefs?.[channel.key] ? 'Enabled' : 'Disabled'}</span></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Send}
                  onClick={() => handleTest(channel.key)}
                  disabled={!getEffectiveValue(channel.key) || testResults[channel.key] === 'sending'}
                  className="min-w-20"
                >
                  {testResults[channel.key] === 'sending' ? 'Sending...' : 
                   testResults[channel.key] === 'success' ? '✓ Sent' :
                   testResults[channel.key] === 'error' ? '✗ Failed' : 'Test'}
                </Button>
                <Toggle
                  enabled={getEffectiveValue(channel.key)}
                  onChange={() => handleToggle(channel.key)}
                  label={channel.label}
                />
              </div>
            </div>
          ))}
        </CardBody>

        <CardFooter className="flex items-center justify-between">
          {saveMessage && (
            <div className={`text-sm ${saveMessage.type === 'success' ? 'text-nolo-green' : 'text-red-500'}`}>
              {saveMessage.text}
            </div>
          )}
          <div className="ml-auto">
            <Button icon={Save} onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Default Schedule Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-electric-cyan" />
            <div>
              <h2 className="text-xl font-semibold text-text-white">Default Schedule</h2>
              <p className="text-text-white/60 text-sm mt-1">
                Set default notification timing for this site (applies to categories without specific schedules)
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-white mb-2">Frequency</label>
              <select
                value={scheduleSettings.frequency}
                onChange={(e) => setScheduleSettings({ ...scheduleSettings, frequency: e.target.value })}
                className="w-full px-3 py-2 bg-dark-bg border border-border-gray rounded-lg text-text-white focus:outline-none focus:ring-2 focus:ring-electric-cyan"
              >
                <option value="instant">Instant (Real-time)</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
              </select>
            </div>
            
            {scheduleSettings.frequency !== 'instant' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-white mb-2">Time of Day</label>
                  <Input
                    type="time"
                    value={scheduleSettings.time_of_day}
                    onChange={(e) => setScheduleSettings({ ...scheduleSettings, time_of_day: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-white mb-2">Timezone</label>
                  <Input
                    value={scheduleSettings.timezone}
                    onChange={(e) => setScheduleSettings({ ...scheduleSettings, timezone: e.target.value })}
                    placeholder="e.g., America/New_York"
                  />
                </div>
                
                {scheduleSettings.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-text-white mb-2">Day of Week</label>
                    <select
                      value={scheduleSettings.weekly_day}
                      onChange={(e) => setScheduleSettings({ ...scheduleSettings, weekly_day: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-dark-bg border border-border-gray rounded-lg text-text-white focus:outline-none focus:ring-2 focus:ring-electric-cyan"
                    >
                      {weekDays.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </CardBody>
      </Card>
      
      {/* Notification Categories */}
      {categoriesData?.categories && categoriesData.categories.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-nolo-green" />
              <div>
                <h2 className="text-xl font-semibold text-text-white">Notification Categories</h2>
                <p className="text-text-white/60 text-sm mt-1">
                  Choose which types of notifications you want to receive and when
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardBody className="space-y-6">
            {categoriesData.categories.map(({ category }) => {
              const pref = categoryPreferences[category.key] || { enabled: true, schedule: category.defaults }
              
              return (
                <div key={category.key} className="border border-border-gray rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-text-white text-lg">{category.name}</h3>
                        <Toggle
                          enabled={pref.enabled}
                          onChange={() => toggleCategoryEnabled(category.key)}
                          label={category.name}
                        />
                      </div>
                      {category.description && (
                        <p className="text-sm text-text-white/60 mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {pref.enabled && (
                    <div className="pl-4 border-l-2 border-electric-cyan/30 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-text-white/70 mb-1">Frequency</label>
                          <select
                            value={pref.schedule?.frequency || 'instant'}
                            onChange={(e) => updateCategorySchedule(category.key, 'frequency', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm bg-dark-bg border border-border-gray rounded text-text-white focus:outline-none focus:ring-1 focus:ring-electric-cyan"
                          >
                            <option value="instant">Instant</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                        
                        {pref.schedule?.frequency !== 'instant' && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-text-white/70 mb-1">Time</label>
                              <Input
                                type="time"
                                value={pref.schedule?.time_of_day || '09:00'}
                                onChange={(e) => updateCategorySchedule(category.key, 'time_of_day', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            
                            {pref.schedule?.frequency === 'weekly' && (
                              <div>
                                <label className="block text-xs font-medium text-text-white/70 mb-1">Day</label>
                                <select
                                  value={pref.schedule?.weekly_day || 1}
                                  onChange={(e) => updateCategorySchedule(category.key, 'weekly_day', parseInt(e.target.value))}
                                  className="w-full px-2 py-1.5 text-sm bg-dark-bg border border-border-gray rounded text-text-white focus:outline-none focus:ring-1 focus:ring-electric-cyan"
                                >
                                  {weekDays.map(day => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-xs font-medium text-text-white/70 mb-1">Timezone</label>
                              <Input
                                value={pref.schedule?.timezone || 'UTC'}
                                onChange={(e) => updateCategorySchedule(category.key, 'timezone', e.target.value)}
                                placeholder="UTC"
                                className="text-sm"
                              />
                            </div>
                          </>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveCategoryPreference(category.key)}
                        icon={Save}
                      >
                        Save {category.name}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </CardBody>
        </Card>
      )}
        </>
      )}

      <div className="bg-dark-surface/50 border border-border-gray rounded-lg p-4 space-y-2">
        <p className="text-sm text-text-white/60">
          <span className="font-medium text-nolo-green">How it works:</span>
        </p>
        <ul className="text-sm text-text-white/60 space-y-1 ml-4 list-disc">
          <li>Toggle channels to override global settings for this site</li>
          <li>Set default schedule to control when you receive notifications</li>
          <li>Configure individual categories for fine-grained control</li>
          <li>Categories support instant, daily, or weekly delivery</li>
          <li>Overridden settings are shown in <span className="text-electric-cyan">cyan</span></li>
        </ul>
      </div>
    </div>
  )
}
