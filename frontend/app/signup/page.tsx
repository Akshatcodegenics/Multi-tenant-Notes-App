'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '../../lib/api'

export default function SignupPage() {
  const [tenantName, setTenantName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleTenantNameChange = (v: string) => {
    setTenantName(v)
    if (!tenantSlug) {
      const slug = v
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setTenantSlug(slug)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authAPI.register(email, password, tenantName, tenantSlug)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        <div className="card card-3d glow">
          <div className="text-center mb-8">
            <div className="logo mb-2 floating">Create your Workspace</div>
            <p className="text-white text-opacity-90">Sign up to start using NotesSpace</p>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mt-4 rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="notification notification-error">
                <div className="flex items-center">
                  <span className="text-lg mr-2">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white text-opacity-90">🏢 Tenant Name</label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => handleTenantNameChange(e.target.value)}
                required
                className="w-full"
                placeholder="Acme Corporation"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white text-opacity-90">🔗 Tenant Slug</label>
              <input
                type="text"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value.toLowerCase())}
                required
                className="w-full"
                placeholder="acme"
              />
              <p className="text-xs text-white text-opacity-60">Your workspace URL will be https://.../{'{tenant}'}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white text-opacity-90">📧 Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white text-opacity-90">🔒 Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
                placeholder="Choose a strong password"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 btn glow">
              {loading ? 'Creating your workspace...' : '✨ Create Account'}
            </button>
          </form>

          <div className="text-center mt-6 text-white text-opacity-80 text-sm">
            Already have an account? <a href="/login" className="text-blue-400 underline">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  )
}
