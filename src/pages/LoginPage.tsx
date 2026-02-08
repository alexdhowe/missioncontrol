import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { user, login, loading } = useAuthStore()
  const navigate = useNavigate()

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
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
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to Mission Control</p>
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
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
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
                className="input-dark w-full"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent hover:text-accent-hover transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
