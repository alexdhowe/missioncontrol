import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { user, register, loading } = useAuthStore()
  const navigate = useNavigate()

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      await register(email, password, name)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative glow orbs */}
      <div className="glow-orb w-72 h-72 bg-indigo-500" style={{ top: '10%', left: '15%' }} />
      <div className="glow-orb w-96 h-96 bg-purple-600" style={{ bottom: '10%', right: '10%' }} />

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xl font-bold mb-4 shadow-glow-accent">
            M
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">
            Start organizing your work in one place
          </p>
        </div>

        <div className="glass-panel-raised p-6 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="input-dark w-full"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-dark w-full"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input-dark w-full"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
