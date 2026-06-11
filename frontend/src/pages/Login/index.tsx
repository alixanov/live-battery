import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap size={28} style={{ color: 'var(--accent)' }} />
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>EV Battery</span>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Войти в систему</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="you@example.com" required />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: 'var(--text-muted)' }}>Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="••••••••" required />
            </div>
            <button type="submit" className="w-full font-medium rounded-lg py-2.5 text-sm transition-colors"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
              Войти (Demo)
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
