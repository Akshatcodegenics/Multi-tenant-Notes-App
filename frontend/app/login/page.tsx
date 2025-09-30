'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '../../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authAPI.login(email, password)
      console.log('Login successful:', response)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Login failed:', error)
      setError(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        <div className="card card-3d glow">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="logo mb-2 floating">
              NotesSpace
            </div>
            <p className="text-white text-opacity-90 text-lg">
              🌍 Multi-Tenant SaaS Platform
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mt-4 rounded-full"></div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Notification */}
            {error && (
              <div className="notification notification-error">
                <div className="flex items-center">
                  <span className="text-lg mr-2">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-white text-opacity-90">
                📧 Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                placeholder="Enter your email address"
              />
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-white text-opacity-90">
                🔒 Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
                placeholder="Enter your password"
              />
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 btn glow"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <span>🚀 Sign In</span>
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-white text-opacity-80 text-sm">
            New here? <a href="/signup" className="text-blue-400 underline">Create an account</a>
          </div>

          {/* Test Accounts Section */}
          <div className="mt-6 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
            <h3 className="font-semibold mb-4 text-white text-center flex items-center justify-center">
              <span className="text-lg mr-2">🧪</span>
              Demo Accounts
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all cursor-pointer"
                   onClick={() => { setEmail('admin@acme.test'); setPassword('password'); }}>
                <div>
                  <div className="text-white font-medium">🏢 Acme Admin</div>
                  <div className="text-white text-opacity-70 text-xs">admin@acme.test</div>
                </div>
                <span className="badge badge-free">Admin</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all cursor-pointer"
                   onClick={() => { setEmail('user@acme.test'); setPassword('password'); }}>
                <div>
                  <div className="text-white font-medium">🏢 Acme User</div>
                  <div className="text-white text-opacity-70 text-xs">user@acme.test</div>
                </div>
                <span className="badge badge-free">Member</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all cursor-pointer"
                   onClick={() => { setEmail('admin@globex.test'); setPassword('password'); }}>
                <div>
                  <div className="text-white font-medium">🏭 Globex Admin</div>
                  <div className="text-white text-opacity-70 text-xs">admin@globex.test</div>
                </div>
                <span className="badge badge-free">Admin</span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all cursor-pointer"
                   onClick={() => { setEmail('user@globex.test'); setPassword('password'); }}>
                <div>
                  <div className="text-white font-medium">🏭 Globex User</div>
                  <div className="text-white text-opacity-70 text-xs">user@globex.test</div>
                </div>
                <span className="badge badge-free">Member</span>
              </div>
            </div>
            <p className="text-center text-white text-opacity-60 text-xs mt-3">
              💆 Click any account to auto-fill credentials
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 text-white text-opacity-60 text-sm">
          <p>🔒 Secure • 🌐 Multi-Tenant • ✨ Modern UI</p>
        </div>
      </div>
    </div>
  )
}