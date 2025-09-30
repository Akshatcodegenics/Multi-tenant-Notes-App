'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, notesAPI, tenantAPI } from '../../lib/api'

interface User {
  id: string
  email: string
  role: string
  tenant: {
    id: string
    name: string
    slug: string
    subscription: string
  }
}

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    email: string
    role: string
  }
}

interface Tenant {
  id: string
  name: string
  slug: string
  subscription: string
  noteCount: number
  noteLimit: number
  canCreateNote: boolean
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      // Load user info and notes
      const [userResponse, notesResponse, tenantResponse] = await Promise.all([
        authAPI.me(),
        notesAPI.getAll(),
        tenantAPI.getCurrent()
      ])

      setUser(userResponse.user)
      setNotes(notesResponse.notes)
      setTenant(tenantResponse.tenant)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      setError('Failed to load dashboard')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    authAPI.logout()
    router.push('/login')
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.title.trim() || !newNote.content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      await notesAPI.create(newNote.title, newNote.content)
      setSuccess('Note created successfully!')
      setNewNote({ title: '', content: '' })
      setShowCreateForm(false)
      loadDashboard()
    } catch (error: any) {
      console.error('Failed to create note:', error)
      setError(error.response?.data?.error || 'Failed to create note')
    }
  }

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote || !editingNote.title.trim() || !editingNote.content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      await notesAPI.update(editingNote.id, editingNote.title, editingNote.content)
      setSuccess('Note updated successfully!')
      setEditingNote(null)
      loadDashboard()
    } catch (error: any) {
      console.error('Failed to update note:', error)
      setError(error.response?.data?.error || 'Failed to update note')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await notesAPI.delete(noteId)
      setSuccess('Note deleted successfully!')
      loadDashboard()
    } catch (error: any) {
      console.error('Failed to delete note:', error)
      setError(error.response?.data?.error || 'Failed to delete note')
    }
  }

  const handleUpgradeToPro = async () => {
    if (!tenant || !user) return

    try {
      await tenantAPI.upgrade(tenant.slug)
      setSuccess('Successfully upgraded to Pro plan!')
      loadDashboard()
    } catch (error: any) {
      console.error('Failed to upgrade:', error)
      setError(error.response?.data?.error || 'Failed to upgrade')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="floating mb-6">
            <div className="text-6xl">📝</div>
          </div>
          <div className="spinner mb-4 mx-auto"></div>
          <h1 className="text-2xl font-bold gradient-text mb-2">Loading Dashboard...</h1>
          <p className="text-white text-opacity-70">Please wait while we load your data ✨</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="glass-dark shadow-lg border-b border-white border-opacity-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="mr-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl font-bold floating">
                  {tenant?.name?.charAt(0) || 'N'}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text-alt mb-1">
                  {tenant?.name} Dashboard
                </h1>
                <p className="text-white text-opacity-80 flex items-center">
                  👋 Welcome, <span className="font-semibold ml-1">{user?.email}</span>
                  <span className={`badge ml-2 ${user?.role === 'ADMIN' ? 'badge-pro' : 'badge-free'}`}>
                    {user?.role}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center justify-end mb-1">
                  <span className="text-lg mr-1">
                    {tenant?.subscription === 'PRO' ? '🎆' : '🌐'}
                  </span>
                  <span className={`badge ${tenant?.subscription === 'PRO' ? 'badge-pro' : 'badge-free'}`}>
                    {tenant?.subscription} Plan
                  </span>
                </div>
                <p className="text-xs text-white text-opacity-70">
                  {tenant?.subscription === 'FREE' 
                    ? `📄 ${tenant?.noteCount}/${tenant?.noteLimit} notes used` 
                    : '♾️ Unlimited notes'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 btn glow"
              >
                💯 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Enhanced Messages */}
        {error && (
          <div className="notification notification-error">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">⚠️</span>
                <span>{error}</span>
              </div>
              <button 
                onClick={() => setError('')} 
                className="text-white hover:text-red-200 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {success && (
          <div className="notification notification-success">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-2">✅</span>
                <span>{success}</span>
              </div>
              <button 
                onClick={() => setSuccess('')} 
                className="text-white hover:text-green-200 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Upgrade Notice */}
        {tenant?.subscription === 'FREE' && !tenant?.canCreateNote && user?.role === 'ADMIN' && (
          <div className="card glow mb-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="text-center">
              <div className="text-4xl mb-2">🚀</div>
              <h3 className="font-bold text-xl mb-2 text-white">Time to Upgrade!</h3>
              <p className="text-white text-opacity-90 mb-4">
                You've reached your limit of {tenant?.noteLimit} notes. Unlock unlimited potential with Pro!
              </p>
              <div className="flex items-center justify-center mb-4">
                <div className="text-white text-opacity-80 mr-4">
                  <div className="text-2xl">📄</div>
                  <div className="text-sm">Limited Notes</div>
                </div>
                <div className="text-white text-opacity-50 mx-4">→</div>
                <div className="text-white">
                  <div className="text-2xl">♾️</div>
                  <div className="text-sm">Unlimited Notes</div>
                </div>
              </div>
              <button
                onClick={handleUpgradeToPro}
                className="bg-white text-purple-600 px-6 py-3 btn font-bold glow hover:scale-105 transform transition-all"
              >
                🌟 Upgrade to Pro Now!
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Create Note Section */}
        <div className="mb-6">
          {tenant?.canCreateNote ? (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-6 py-3 btn glow"
            >
              {showCreateForm ? '❌ Cancel' : '✨ Create New Note'}
            </button>
          ) : (
            <div className="card bg-gradient-to-r from-orange-400 to-red-500 text-white text-center">
              <div className="text-3xl mb-2">🚫</div>
              <p className="font-semibold mb-2">Note Limit Reached!</p>
              <p className="text-white text-opacity-90">
                {user?.role === 'ADMIN' 
                  ? 'Upgrade to Pro for unlimited notes! 🚀' 
                  : 'Ask your admin to upgrade the plan. 💬'}
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Create Note Form */}
        {showCreateForm && (
          <div className="card card-3d glow mb-6">
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">📝</span>
              <h2 className="text-xl font-bold text-white">Create New Note</h2>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white text-opacity-90 mb-2">
                  🏷️ Title
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full"
                  placeholder="Enter note title..."
                  maxLength={200}
                />
                <div className="text-xs text-white text-opacity-60 mt-1">
                  {newNote.title.length}/200 characters
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white text-opacity-90 mb-2">
                  💬 Content
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={6}
                  className="w-full"
                  placeholder="Write your note content here..."
                  maxLength={10000}
                />
                <div className="text-xs text-white text-opacity-60 mt-1">
                  {newNote.content.length}/10,000 characters
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-3 btn glow flex-1"
                >
                  🎆 Create Note
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-600 text-white px-6 py-3 btn flex-1"
                >
                  🚫 Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Enhanced Edit Note Form */}
        {editingNote && (
          <div className="card card-3d glow mb-6">
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">✏️</span>
              <h2 className="text-xl font-bold text-white">Edit Note</h2>
            </div>
            <form onSubmit={handleUpdateNote} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white text-opacity-90 mb-2">
                  🏷️ Title
                </label>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full"
                  placeholder="Enter note title..."
                  maxLength={200}
                />
                <div className="text-xs text-white text-opacity-60 mt-1">
                  {editingNote.title.length}/200 characters
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white text-opacity-90 mb-2">
                  💬 Content
                </label>
                <textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  rows={6}
                  className="w-full"
                  placeholder="Write your note content here..."
                  maxLength={10000}
                />
                <div className="text-xs text-white text-opacity-60 mt-1">
                  {editingNote.content.length}/10,000 characters
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-3 btn glow flex-1"
                >
                  💾 Update Note
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="bg-gray-600 text-white px-6 py-3 btn flex-1"
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Enhanced Notes List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold gradient-text flex items-center">
              📁 Your Notes 
              <span className="badge badge-free ml-3">{notes.length}</span>
            </h2>
            <div className="text-white text-opacity-70 text-sm flex items-center">
              🔄 Auto-refreshed
            </div>
          </div>
          
          {notes.length === 0 ? (
            <div className="card text-center card-3d">
              <div className="text-6xl mb-4 floating">📦</div>
              <h3 className="text-xl font-bold text-white mb-2">No Notes Yet!</h3>
              <p className="text-white text-opacity-80 mb-4">
                Start your journey by creating your first note. ✨
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-6 py-3 btn glow"
                disabled={!tenant?.canCreateNote}
              >
                📝 Create First Note
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {notes.map((note, index) => (
                <div 
                  key={note.id} 
                  className="card card-3d hover:scale-105 transition-transform duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white mb-1 line-clamp-2">
                        {note.title}
                      </h3>
                      <div className="flex items-center text-xs text-white text-opacity-60">
                        <span className="mr-2">👤</span>
                        <span className="mr-3">{note.author.email}</span>
                        <span className={`badge ${note.author.role === 'ADMIN' ? 'badge-pro' : 'badge-free'}`}>
                          {note.author.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="bg-blue-500 bg-opacity-20 text-blue-300 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm btn transition-all"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="bg-red-500 bg-opacity-20 text-red-300 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm btn transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-white text-opacity-90 leading-relaxed">
                      {note.content.length > 150 
                        ? `${note.content.substring(0, 150)}...` 
                        : note.content}
                    </p>
                  </div>
                  
                  <div className="border-t border-white border-opacity-10 pt-3 flex items-center justify-between text-xs text-white text-opacity-60">
                    <div className="flex items-center">
                      📅 {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                    {note.updatedAt !== note.createdAt && (
                      <div className="flex items-center">
                        🔄 {new Date(note.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}