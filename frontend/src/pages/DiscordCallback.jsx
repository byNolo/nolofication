import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function DiscordCallback() {
  const location = useLocation()

  useEffect(() => {
    // Get code from URL query params
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (code && window.opener) {
      // Send code back to parent window
      window.opener.postMessage(
        { type: 'discord-oauth-callback', code },
        window.location.origin
      )
    } else if (error) {
      // Send error back to parent window
      window.opener?.postMessage(
        { type: 'discord-oauth-error', error },
        window.location.origin
      )
    }

    // Close popup after a short delay
    setTimeout(() => {
      window.close()
    }, 500)
  }, [location])

  return (
    <div className="flex items-center justify-center h-screen bg-bg-dark">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple mx-auto mb-4"></div>
        <p className="text-text-white/70">Completing Discord authorization...</p>
      </div>
    </div>
  )
}
