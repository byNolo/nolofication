import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import Toggle from '../components/Toggle'

export default function AdminSites() {
  const { user } = useAuth()
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedSite, setSelectedSite] = useState(null)
  const [newSite, setNewSite] = useState({ site_id: '', name: '', description: '' })
  const [newCategory, setNewCategory] = useState({
    key: '',
    name: '',
    description: '',
    default_frequency: 'instant'
  })

  const isAdmin = user?.keyn_user_id === '1' && user?.username?.toLowerCase() === 'sam'

  useEffect(() => {
    if (isAdmin) {
      fetchSites()
    }
  }, [isAdmin])

  const fetchSites = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/sites', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch sites')

      const data = await response.json()
      setSites(data.sites)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createSite = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSite)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create site')
      }

      setShowCreateModal(false)
      setNewSite({ site_id: '', name: '', description: '' })
      fetchSites()
    } catch (err) {
      alert(err.message)
    }
  }

  const updateSite = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/admin/sites/${selectedSite.site_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedSite.name,
          description: selectedSite.description
        })
      })

      if (!response.ok) throw new Error('Failed to update site')

      setShowEditModal(false)
      setSelectedSite(null)
      fetchSites()
    } catch (err) {
      alert(err.message)
    }
  }

  const deleteSite = async (siteId) => {
    if (!confirm(`Are you sure you want to delete ${siteId}? This will delete all notifications and categories.`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/admin/sites/${siteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete site')

      fetchSites()
    } catch (err) {
      alert(err.message)
    }
  }

  const toggleSiteActive = async (site) => {
    try {
      const token = localStorage.getItem('token')
      const endpoint = site.is_active ? 'deactivate' : 'activate'
      const response = await fetch(`/api/admin/sites/${site.site_id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to toggle site status')

      fetchSites()
    } catch (err) {
      alert(err.message)
    }
  }

  const regenerateApiKey = async (siteId) => {
    if (!confirm('Are you sure you want to regenerate the API key? The old key will stop working.')) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/admin/sites/${siteId}/regenerate-key`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to regenerate API key')

      const data = await response.json()
      alert(`New API Key: ${data.api_key}\n\nMake sure to copy it now!`)
      fetchSites()
    } catch (err) {
      alert(err.message)
    }
  }

  const createCategory = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/admin/sites/${selectedSite.site_id}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCategory)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create category')
      }

      setShowCategoryModal(false)
      setNewCategory({ key: '', name: '', description: '', default_frequency: 'instant' })
      alert('Category created successfully!')
    } catch (err) {
      alert(err.message)
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
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Sites</h1>
          <p className="text-gray-600">{sites.length} total sites</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Create Site
        </Button>
      </div>

      {error && (
        <Card className="mb-4 bg-red-50 p-6">
          <p className="text-red-600">Error: {error}</p>
        </Card>
      )}

      <div className="space-y-4">
        {sites.map((site) => (
          <Card key={site.id} className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{site.name}</h3>
                  <code className="text-sm bg-gray-100 text-gray-900 px-2 py-1 rounded">{site.site_id}</code>
                  {site.is_active ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inactive</span>
                  )}
                  {!site.is_approved && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Pending Approval</span>
                  )}
                </div>
                
                {site.description && (
                  <p className="text-gray-600 mb-3">{site.description}</p>
                )}
                
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Creator KeyN ID: {site.creator_keyn_id || 'N/A'}</p>
                  <p>Created: {site.created_at ? new Date(site.created_at).toLocaleDateString() : 'N/A'}</p>
                  <p>Notifications: {site.notification_count ?? 0} | Categories: {site.category_count ?? 0}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="font-mono text-xs">API Key: {site.api_key ? `${site.api_key.substring(0, 20)}...` : 'N/A'}</p>
                    {site.api_key && (
                      <button
                        onClick={() => navigator.clipboard.writeText(site.api_key)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedSite(site)
                    setShowEditModal(true)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedSite(site)
                    setShowCategoryModal(true)
                  }}
                >
                  + Category
                </Button>
                <Button
                  variant={site.is_active ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => toggleSiteActive(site)}
                >
                  {site.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => regenerateApiKey(site.site_id)}
                >
                  🔑 Regen Key
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteSite(site.site_id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Site Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Site"
      >
        <div className="space-y-4">
          <Input
            label="Site ID"
            value={newSite.site_id}
            onChange={(e) => setNewSite({ ...newSite, site_id: e.target.value })}
            placeholder="e.g., vinylvote"
          />
          <Input
            label="Name"
            value={newSite.name}
            onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
            placeholder="e.g., Vinyl Vote"
          />
          <Input
            label="Description (optional)"
            value={newSite.description}
            onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
            placeholder="Description of the site"
          />
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={createSite}>Create Site</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Site Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Site"
      >
        {selectedSite && (
          <div className="space-y-4">
            <Input
              label="Name"
              value={selectedSite.name}
              onChange={(e) => setSelectedSite({ ...selectedSite, name: e.target.value })}
            />
            <Input
              label="Description"
              value={selectedSite.description || ''}
              onChange={(e) => setSelectedSite({ ...selectedSite, description: e.target.value })}
            />
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={updateSite}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={`Add Category to ${selectedSite?.name}`}
      >
        <div className="space-y-4">
          <Input
            label="Category Key"
            value={newCategory.key}
            onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value })}
            placeholder="e.g., reminders"
          />
          <Input
            label="Category Name"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            placeholder="e.g., Reminders"
          />
          <Input
            label="Description (optional)"
            value={newCategory.description}
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium mb-2">Default Frequency</label>
            <select
              value={newCategory.default_frequency}
              onChange={(e) => setNewCategory({ ...newCategory, default_frequency: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="instant">Instant</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={createCategory}>Create Category</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
