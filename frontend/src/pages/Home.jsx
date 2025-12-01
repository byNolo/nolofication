import { Bell, Settings, Zap, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card, { CardHeader, CardBody } from '../components/Card'
import Button from '../components/Button'
import { useApi } from '../hooks/useApi'
import { getSites } from '../utils/api'

export default function Home() {
  const { data: sitesData, loading, error } = useApi(getSites, [])
  
  // Extract sites array from response
  const sites = sitesData?.sites || []

  const features = [
    {
      icon: Bell,
      title: 'Multi-Channel Notifications',
      description: 'Receive notifications via email, web push, Discord, and webhooks.',
      color: 'cyan'
    },
    {
      icon: Settings,
      title: 'Granular Control',
      description: 'Set global preferences or customize settings per site.',
      color: 'green'
    },
    {
      icon: Zap,
      title: 'Powered by KeyN',
      description: 'Secure authentication and seamless integration with the byNolo ecosystem.',
      color: 'cyan'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-nolo-green blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative">
              <Zap className="h-24 w-24 text-electric-cyan mx-auto" fill="currentColor" />
            </div>
          </div>
        </div>
        
        <h1 className="text-5xl font-bold">
          <span className="text-nolo-green">Nolo</span>
          <span className="text-text-white">fication</span>
        </h1>
        
        <p className="text-xl text-text-white/70 max-w-2xl mx-auto">
          Unified notifications for apps byNolo
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <Link to="/preferences">
            <Button size="lg" icon={Settings}>
              Manage Preferences
            </Button>
          </Link>
          <Link to="/notifications">
            <Button size="lg" variant="secondary" icon={Bell}>
              View Notifications
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} glowColor={feature.color}>
              <CardBody className="text-center space-y-4 py-8">
                <div className={`
                  inline-flex items-center justify-center w-16 h-16 rounded-full
                  ${feature.color === 'green' ? 'bg-nolo-green/10' : 'bg-electric-cyan/10'}
                `}>
                  <Icon className={`h-8 w-8 ${feature.color === 'green' ? 'text-nolo-green' : 'text-electric-cyan'}`} />
                </div>
                <h3 className="text-xl font-semibold text-text-white">{feature.title}</h3>
                <p className="text-text-white/60">{feature.description}</p>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* Active Sites */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-text-white flex items-center gap-2">
            <Check className="h-6 w-6 text-nolo-green" />
            Active Sites
          </h2>
          <p className="text-text-white/60 mt-1">Sites integrated with Nolofication</p>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8 text-text-white/60">Loading sites...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">Error loading sites: {error}</div>
          ) : sites.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {sites.map(site => (
                <Link 
                  key={site.site_id} 
                  to={`/sites/${site.site_id}/preferences`}
                  className="
                    p-4 rounded-lg border border-border-gray
                    hover:border-nolo-green hover:bg-nolo-green/5
                    transition-all duration-200 group
                  "
                >
                  <h3 className="font-semibold text-text-white group-hover:text-nolo-green transition-colors">
                    {site.name}
                  </h3>
                  <p className="text-sm text-text-white/60 mt-1">{site.description || 'No description'}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-white/60">No sites registered yet</div>
          )}
        </CardBody>
      </Card>

      {/* Info Section */}
      <div className="text-center text-text-white/50 text-sm space-y-2 py-8">
        <p>Centralized notification preferences for all your byNolo apps</p>
        <p>Secure, fast, and reliable notification delivery</p>
      </div>
    </div>
  )
}
