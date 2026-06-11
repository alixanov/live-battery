import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin, useRegister } from '../../api/hooks'
import { useAppStore } from '../../store'
import { Zap } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const setAuth = useAppStore(s => s.setAuth)
  const login = useLogin()
  const register = useRegister()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      let data: any
      if (mode === 'login') {
        data = await login.mutateAsync({ email, password })
      } else {
        data = await register.mutateAsync({ email, password, name })
      }
      setAuth(data.access_token, { email, name: data.name })
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap className="text-brand-500" size={28} />
          <span className="text-2xl font-bold text-white tracking-tight">EVBIS</span>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">
            {mode === 'login' ? 'Sign in to your account' : 'Create account'}
          </h2>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={login.isPending || register.isPending}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {login.isPending || register.isPending
                ? 'Loading...'
                : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-brand-500 hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
