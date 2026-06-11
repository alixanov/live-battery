import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Car, Bell, BarChart3, Zap, Sun, Moon, X, Menu } from 'lucide-react'
import { useDemoAlerts } from '../../hooks/useDemoAlerts'
import { useAppStore } from '../../store'

const NAV = [
  { to: '/',           label: 'Главная',   icon: LayoutDashboard },
  { to: '/vehicles',   label: 'Мои авто',  icon: Car },
  { to: '/alerts',     label: 'Сигналы',   icon: Bell },
  { to: '/analytics',  label: 'Аналитика', icon: BarChart3 },
]

export default function Sidebar() {
  const { stats } = useDemoAlerts(true)
  const { darkMode, toggleDarkMode } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const criticalCount = stats.CRITICAL + stats.HIGH

  return (
    <>
      {/* ── DESKTOP SIDEBAR ──────────────────────────────── */}
      <aside className="hidden md:flex flex-col h-full w-60 shrink-0 overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <Zap size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: 'var(--text-primary)' }}>EV Battery</p>
            <p className="text-xs mt-0.5 leading-none" style={{ color: 'var(--text-muted)' }}>Мониторинг батареи</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs px-3 mb-2 font-medium" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            НАВИГАЦИЯ
          </p>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end>
              {({ isActive }) => (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer select-none"
                  style={{
                    backgroundColor: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--border)'; e.currentTarget.style.color = isActive ? 'var(--accent)' : 'var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? 'rgba(59,130,246,0.12)' : 'transparent'; e.currentTarget.style.color = isActive ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {/* Active indicator */}
                  <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                    <Icon size={17} />
                  </div>
                  <span className="flex-1">{label}</span>
                  {/* Alert badge */}
                  {to === '/alerts' && criticalCount > 0 && (
                    <span className="text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none"
                      style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                      {criticalCount}
                    </span>
                  )}
                  {/* Active dot */}
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {/* Theme toggle */}
          <button onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
            <div className="shrink-0 w-5 h-5 flex items-center justify-center">
              {darkMode
                ? <Sun size={16} style={{ color: '#fbbf24' }} />
                : <Moon size={16} style={{ color: '#60a5fa' }} />}
            </div>
            <span>{darkMode ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>

          {/* Version */}
          <div className="px-3 pt-1 flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>v1.0.0</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
              Demo
            </span>
          </div>
        </div>
      </aside>

      {/* ── MOBILE HEADER ────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 56 }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
            <Zap size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>EV Battery</span>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="text-xs font-bold rounded-full px-2 py-0.5"
              style={{ backgroundColor: '#ef4444', color: '#fff' }}>
              {criticalCount}
            </span>
          )}
          <button onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Открыть меню">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileOpen(false)} />

          {/* Drawer */}
          <div className="relative w-72 h-full flex flex-col"
            style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                  <Zap size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>EV Battery</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Мониторинг батареи</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Закрыть меню">
                <X size={18} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              <p className="text-xs px-3 mb-2 font-medium" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                НАВИГАЦИЯ
              </p>
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end onClick={() => setMobileOpen(false)}>
                  {({ isActive }) => (
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isActive ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)' }}>
                        <Icon size={18} />
                      </div>
                      <span className="flex-1 text-base" style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {label}
                      </span>
                      {to === '/alerts' && criticalCount > 0 && (
                        <span className="text-xs font-bold rounded-full px-2 py-0.5"
                          style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                          {criticalCount}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Bottom */}
            <div className="px-3 pb-6 space-y-1" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <button onClick={toggleDarkMode}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}>
                {darkMode
                  ? <Sun size={18} style={{ color: '#fbbf24' }} />
                  : <Moon size={18} style={{ color: '#60a5fa' }} />}
                <span style={{ color: 'var(--text-primary)' }}>{darkMode ? 'Светлая тема' : 'Тёмная тема'}</span>
              </button>
              <div className="px-3 pt-1 flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>v1.0.0</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>Demo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          height: 60,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className="flex-1">
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-colors"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                <div className="relative">
                  <Icon size={20} />
                  {to === '/alerts' && criticalCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-white rounded-full font-bold"
                      style={{ backgroundColor: '#ef4444', fontSize: 9 }}>
                      {criticalCount > 9 ? '9+' : criticalCount}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
                {isActive && (
                  <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ backgroundColor: 'var(--accent)' }} />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
