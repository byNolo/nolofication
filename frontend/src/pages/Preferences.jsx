import { useState, useEffect } from 'react'
import { Save, Mail, Radio, MessageCircle, Webhook as WebhookIcon, Send, Link as LinkIcon, ExternalLink, Bell, BellOff } from 'lucide-react'
import Card, { CardHeader, CardBody, CardFooter } from '../components/Card'
import Button from '../components/Button'
import Toggle from '../components/Toggle'
import Input from '../components/Input'
import { useApi, useMutation } from '../hooks/useApi'
import { getPreferences, updatePreferences, sendTestNotification, getDiscordAuthUrl, linkDiscordAccount, getDiscordDmLink, getVapidPublicKey, subscribeWebPush, unsubscribeWebPush } from '../utils/api'

export default function Preferences() {
  const { data: fetchedPrefs, loading, error } = useApi(getPreferences, [])
  const { mutate: savePrefs, loading: isSaving } = useMutation(updatePreferences)
  const { mutate: testNotification } = useMutation(sendTestNotification)
  
  const [preferences, setPreferences] = useState({
    email: true,
    web_push: false,
    discord: false,
    webhook: false,
    discord_user_id: '',
    webhook_url: '',
  })

  const [saveMessage, setSaveMessage] = useState(null)
  const [testResults, setTestResults] = useState({})
  const [linkingDiscord, setLinkingDiscord] = useState(false)
  const [discordDmUrl, setDiscordDmUrl] = useState(null)
  const [webPushSubscribed, setWebPushSubscribed] = useState(false)
  const [webPushSupported, setWebPushSupported] = useState(false)
  const [webPushDiag, setWebPushDiag] = useState(null)

  // Load preferences from API
  useEffect(() => {
    if (fetchedPrefs) {
      setPreferences({
        email: fetchedPrefs.email ?? true,
        web_push: fetchedPrefs.web_push ?? false,
        discord: fetchedPrefs.discord ?? false,
        webhook: fetchedPrefs.webhook ?? false,
        discord_user_id: fetchedPrefs.discord_user_id ?? '',
        webhook_url: fetchedPrefs.webhook_url ?? '',
      })
    }
  }, [fetchedPrefs])

  // Load Discord bot authorization URL
  useEffect(() => {
    const loadDiscordAuthUrl = async () => {
      try {
        const data = await getDiscordDmLink()
        setDiscordDmUrl(data.authorize_url)
      } catch (error) {
        console.error('Failed to load Discord authorization URL:', error)
      }
    }
    loadDiscordAuthUrl()
  }, [])

  // Check web push support and subscription status
  useEffect(() => {
    const checkWebPush = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setWebPushSupported(true)
        
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          setWebPushSubscribed(!!subscription)
        } catch (error) {
          console.error('Error checking push subscription:', error)
        }
      }
    }
    checkWebPush()
  }, [])

  const handleToggle = (channel) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }))
  }

  const handleSave = async () => {
    const result = await savePrefs(preferences)
    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Preferences saved successfully!' })
    } else {
      setSaveMessage({ type: 'error', text: 'Failed to save preferences' })
    }
    setTimeout(() => setSaveMessage(null), 3000)
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

  const handleLinkDiscord = async () => {
    setLinkingDiscord(true)
    try {
      const { url } = await getDiscordAuthUrl()
      
      // Open Discord OAuth in popup
      const width = 500
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      
      const popup = window.open(
        url,
        'Discord Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      )
      
      // Listen for OAuth callback
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'discord-oauth-callback') {
          popup?.close()
          
          const result = await linkDiscordAccount(event.data.code)
          if (result.success) {
            setPreferences(prev => ({ ...prev, discord_user_id: result.discord_id }))
            setSaveMessage({ 
              type: 'success', 
              text: `Discord linked! (@${result.discord_username})` 
            })
            setTimeout(() => setSaveMessage(null), 5000)
          } else {
            setSaveMessage({ type: 'error', text: 'Failed to link Discord account' })
            setTimeout(() => setSaveMessage(null), 3000)
          }
          setLinkingDiscord(false)
        }
      })
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to start Discord linking' })
      setTimeout(() => setSaveMessage(null), 3000)
      setLinkingDiscord(false)
    }
  }

  const handleSubscribeWebPush = async () => {
    if (!webPushSupported) {
      setSaveMessage({ type: 'error', text: 'Web push not supported in this browser' })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    try {
      console.log('[WebPush] Starting subscription process...')
      
      // Request notification permission
      const permission = await Notification.requestPermission()
      console.log('[WebPush] Permission result:', permission)
      
      if (permission !== 'granted') {
        setSaveMessage({ type: 'error', text: 'Notification permission denied' })
        setTimeout(() => setSaveMessage(null), 3000)
        return
      }

      // Get VAPID public key
      console.log('[WebPush] Fetching VAPID public key...')
      const { public_key } = await getVapidPublicKey()
      console.log('[WebPush] VAPID key received, length:', public_key.length)
      
      // Register service worker and wait for it to be active
      console.log('[WebPush] Registering service worker...')
      let registration;
      try {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        console.log('[WebPush] Service worker registered, state:', registration.active?.state)
        
        // Wait for service worker to be active
        if (registration.installing) {
          console.log('[WebPush] Service worker installing...')
          await new Promise((resolve) => {
            registration.installing.addEventListener('statechange', function() {
              if (this.state === 'activated') {
                console.log('[WebPush] Service worker activated')
                resolve()
              }
            })
          })
        } else if (registration.waiting) {
          console.log('[WebPush] Service worker waiting...')
        } else if (registration.active) {
          console.log('[WebPush] Service worker already active')
        }
        
        await navigator.serviceWorker.ready
        console.log('[WebPush] Service worker ready confirmed')
      } catch (swError) {
        console.error('[WebPush] Service worker registration failed:', swError)
        throw new Error(`Service worker registration failed: ${swError.message}`)
      }

      // Convert base64 VAPID key to Uint8Array
      // The key is in ASN.1 DER format, we need to extract the uncompressed public key (last 65 bytes)
      const vapidKey = base64ToUint8Array(public_key)
      console.log('[WebPush] VAPID key decoded, total bytes:', vapidKey.length)
      
      // Extract the uncompressed public key from DER format
      // For NIST P-256, the uncompressed key is the last 65 bytes (0x04 + 32 bytes X + 32 bytes Y)
      const applicationServerKey = vapidKey.slice(-65)
      console.log('[WebPush] Application server key extracted, bytes:', applicationServerKey.length)
      console.log('[WebPush] First byte (should be 0x04):', applicationServerKey[0])

      // Subscribe to push
      console.log('[WebPush] Subscribing to push manager...')
      console.log('[WebPush] Push manager available:', !!registration.pushManager)
      console.log('[WebPush] Permission state:', await registration.pushManager.permissionState({ 
        userVisibleOnly: true, 
        applicationServerKey: applicationServerKey 
      }))
      
      let subscription;
      try {
        // Check if already subscribed
        const existingSub = await registration.pushManager.getSubscription()
        if (existingSub) {
          console.log('[WebPush] Already subscribed, unsubscribing first...')
          await existingSub.unsubscribe()
        }
        
        // Try to subscribe with a longer timeout and better error capture
        console.log('[WebPush] Starting subscription attempt...')
        const subscribePromise = registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        }).then(sub => {
          console.log('[WebPush] Subscription promise resolved successfully')
          return sub
        }).catch(err => {
          console.error('[WebPush] Subscription promise rejected:', err)
          throw err
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => {
            console.error('[WebPush] Timeout reached after 20s')
            reject(new Error('Subscription timeout - browser may not be able to reach push service (FCM). Check network/firewall or extensions.'))
          }, 20000)
        );
        
        subscription = await Promise.race([subscribePromise, timeoutPromise]);
      } catch (subError) {
        console.error('[WebPush] Push manager subscription failed:', subError);
        console.error('[WebPush] Error name:', subError.name);
        console.error('[WebPush] Error message:', subError.message);
        console.error('[WebPush] Error stack:', subError.stack);
        
        // Provide helpful error message
        let errorMsg = subError.message;
        if (errorMsg.includes('timeout')) {
          errorMsg = 'Cannot connect to push service. Possible causes:\n- Ad/Privacy extensions blocking FCM (disable for this site)\n- Network/firewall blocking FCM\n- VPN or proxy issues\n- Corporate network restrictions\n- Try Firefox or an Incognito window without extensions';
        }
        setWebPushDiag({
          browser: navigator.userAgent,
          permission: Notification.permission,
          serviceWorker: {
            supported: 'serviceWorker' in navigator,
          },
          pushManager: {
            supported: 'PushManager' in window,
          }
        })
        throw new Error(`Push subscription failed: ${errorMsg}`);
      }
      
      console.log('[WebPush] Push subscription created:', subscription.endpoint.substring(0, 50) + '...')

      // Send subscription to server
      console.log('[WebPush] Sending subscription to server...')
      const subscriptionData = subscription.toJSON();
      console.log('[WebPush] Subscription data:', subscriptionData);
      
      const result = await subscribeWebPush(subscriptionData)
      console.log('[WebPush] Server response:', result)
      
      setWebPushSubscribed(true)
      setPreferences(prev => ({ ...prev, web_push: true }))
      setSaveMessage({ type: 'success', text: 'Web push notifications enabled!' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('[WebPush] Subscription error:', error)
      setSaveMessage({ type: 'error', text: `Failed to enable web push: ${error.message}` })
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

  // Connectivity diagnostics: attempt a fetch to FCM that often gets blocked by extensions
  const runWebPushDiagnostics = async () => {
    const results = {
      browser: navigator.userAgent,
      sw: 'serviceWorker' in navigator,
      push: 'PushManager' in window,
      fcmReachable: null,
    }
    try {
      // no-cors so it won't error due to CORS; if extensions block, it likely throws
      await fetch('https://fcm.googleapis.com/fcm/connect', { mode: 'no-cors' })
      results.fcmReachable = true
    } catch (e) {
      console.error('[Diag] FCM connect fetch failed', e)
      results.fcmReachable = false
    }
    setWebPushDiag(results)
    setSaveMessage({ type: 'error', text: results.fcmReachable === false ? 'Browser appears unable to reach FCM. Disable blockers or try Firefox/Incognito.' : 'Diagnostics collected. If issues persist, try disabling extensions.' })
    setTimeout(() => setSaveMessage(null), 5000)
  }

  const handleUnsubscribeWebPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        await unsubscribeWebPush(subscription.endpoint)
      }
      
      setWebPushSubscribed(false)
      setPreferences(prev => ({ ...prev, web_push: false }))
      setSaveMessage({ type: 'success', text: 'Web push notifications disabled' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Web push unsubscribe error:', error)
      setSaveMessage({ type: 'error', text: 'Failed to disable web push' })
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  // Helper function to convert base64 to Uint8Array
  const base64ToUint8Array = (base64String) => {
    const binaryString = window.atob(base64String)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  const channels = [
    {
      key: 'email',
      label: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: Mail,
      color: 'text-nolo-green'
    },
    {
      key: 'web_push',
      label: 'Web Push',
      description: 'Browser push notifications',
      icon: Radio,
      color: 'text-electric-cyan'
    },
    {
      key: 'discord',
      label: 'Discord',
      description: 'Receive notifications via Discord webhook',
      icon: MessageCircle,
      color: 'text-electric-cyan'
    },
    {
      key: 'webhook',
      label: 'Custom Webhook',
      description: 'Send notifications to your own webhook',
      icon: WebhookIcon,
      color: 'text-nolo-green'
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-white">Global Preferences</h1>
        <p className="text-text-white/60 mt-2">
          Configure your default notification settings across all sites
        </p>
      </div>

      {loading ? (
        <Card>
          <CardBody className="text-center py-8 text-text-white/60">
            Loading preferences...
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody className="text-center py-8 text-red-400">
            Error loading preferences: {error}
          </CardBody>
        </Card>
      ) : (
        <>
        <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-text-white">Notification Channels</h2>
          <p className="text-text-white/60 text-sm mt-1">
            Enable or disable channels for receiving notifications
          </p>
        </CardHeader>

        <CardBody className="space-y-6">
          {channels.map(channel => {
            const Icon = channel.icon
            return (
              <div key={channel.key} className="flex items-start gap-4">
                <div className={`${channel.color} mt-1`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-white">{channel.label}</h3>
                      <p className="text-sm text-text-white/60 mt-0.5">{channel.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Send}
                        onClick={() => handleTest(channel.key)}
                        disabled={!preferences[channel.key] || testResults[channel.key] === 'sending'}
                        className="min-w-20"
                      >
                        {testResults[channel.key] === 'sending' ? 'Sending...' : 
                         testResults[channel.key] === 'success' ? '✓ Sent' :
                         testResults[channel.key] === 'error' ? '✗ Failed' : 'Test'}
                      </Button>
                      <Toggle
                        enabled={preferences[channel.key]}
                        onChange={() => handleToggle(channel.key)}
                        label={channel.label}
                      />
                    </div>
                  </div>

                  {/* Additional inputs for Discord and Webhook */}
                  {channel.key === 'web_push' && preferences.web_push && (
                    <div className="mt-3">
                      {webPushSupported ? (
                        <div className="flex gap-2">
                          {webPushSubscribed ? (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={BellOff}
                              onClick={handleUnsubscribeWebPush}
                              className="w-full"
                            >
                              ✓ Subscribed - Click to Unsubscribe
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Bell}
                              onClick={handleSubscribeWebPush}
                              className="w-full"
                            >
                              Subscribe to Push Notifications
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={runWebPushDiagnostics}
                            className="min-w-36"
                          >
                            Diagnose
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-text-white/50">
                          Web push notifications are not supported in this browser
                        </p>
                      )}
                      {webPushDiag && (
                        <div className="mt-2 text-xs text-text-white/60">
                          <div>Browser: {webPushDiag.browser}</div>
                          <div>Service Worker: {String(webPushDiag.sw)}</div>
                          <div>PushManager: {String(webPushDiag.push)}</div>
                          {webPushDiag.fcmReachable !== null && (
                            <div>FCM reachable: {webPushDiag.fcmReachable ? 'Yes' : 'No (likely blocked by extension/network)'}</div>
                          )}
                          <div className="mt-1">Tip: Disable ad/privacy blockers for this site, or try Firefox/Incognito.</div>
                        </div>
                      )}
                    </div>
                  )}

                  {channel.key === 'discord' && preferences.discord && (
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={LinkIcon}
                            onClick={handleLinkDiscord}
                            disabled={linkingDiscord || !!preferences.discord_user_id}
                            className="w-full"
                          >
                            {preferences.discord_user_id ? '✓ Discord Linked' : linkingDiscord ? 'Linking...' : 'Link Discord Account'}
                          </Button>
                        </div>
                        {preferences.discord_user_id && discordDmUrl && (
                          <div className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={ExternalLink}
                              onClick={() => window.open(discordDmUrl, '_blank')}
                              className="w-full"
                            >
                              Authorize Bot
                            </Button>
                          </div>
                        )}
                      </div>
                      {!preferences.discord_user_id ? (
                        <p className="text-xs text-text-white/50">
                          1. Click "Link Discord Account" to connect your Discord<br/>
                          2. Then click "Authorize Bot" to enable DM notifications
                        </p>
                      ) : (
                        <p className="text-xs text-text-white/50">
                          Click "Authorize Bot" to allow the bot to send you DM notifications
                        </p>
                      )}
                    </div>
                  )}

                  {channel.key === 'webhook' && preferences.webhook && (
                    <Input
                      label="Webhook URL"
                      placeholder="https://example.com/webhook"
                      value={preferences.webhook_url}
                      onChange={(e) => setPreferences(prev => ({ ...prev, webhook_url: e.target.value }))}
                      className="mt-3"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </CardBody>

        <CardFooter className="flex items-center justify-between">
          {saveMessage && (
            <div className={`text-sm ${saveMessage.type === 'success' ? 'text-nolo-green' : 'text-red-500'}`}>
              {saveMessage.text}
            </div>
          )}
          <div className="ml-auto">
            <Button
              icon={Save}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardFooter>
      </Card>

        <div className="bg-dark-surface/50 border border-border-gray rounded-lg p-4">
          <p className="text-sm text-text-white/60">
            <span className="font-medium text-electric-cyan">Note:</span> These are your global settings.
            You can override them for individual sites in the site-specific preferences.
          </p>
        </div>
        </>
      )}
    </div>
  )
}
