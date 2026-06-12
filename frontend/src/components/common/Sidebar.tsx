import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Car, Bell, BarChart3, Zap, Sun, Moon, ChevronRight, GitCompare } from 'lucide-react'
import { useDemoAlerts } from '../../hooks/useDemoAlerts'
import { useAppStore } from '../../store'

const NAV = [
  { to: '/',          label: 'Главная',    icon: LayoutDashboard, desc: 'Обзор парка' },
  { to: '/vehicles',  label: 'Мои авто',   icon: Car,             desc: 'Список авто' },
  { to: '/alerts',    label: 'Сигналы',    icon: Bell,            desc: 'Уведомления' },
  { to: '/analytics', label: 'Аналитика',  icon: BarChart3,        desc: 'Графики' },
  { to: '/compare',   label: 'Сравнение',  icon: GitCompare,       desc: 'Сравнить авто' },
]

export default function Sidebar() {
  const { stats } = useDemoAlerts(true)
  const { darkMode, toggleDarkMode } = useAppStore()
  const criticalCount = stats.CRITICAL + stats.HIGH

  return (
    <>
      {/* ═══════════════════ DESKTOP SIDEBAR ═══════════════════ */}
      <aside className="hidden md:flex flex-col h-full w-64 shrink-0"
        style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', boxShadow: '0 4px 12px rgba(59,130,246,0.35)' }}>
            <Zap size={18} color="#fff" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
              EV Battery
            </p>
            <p className="text-xs leading-tight mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              Мониторинг батарей
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-semibold px-3 mb-3"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 10 }}>
            Навигация
          </p>
          {NAV.map(({ to, label, icon: Icon, desc }) => (
            <NavLink key={to} to={to} end className="block">
              {({ isActive }) => (
                <div className="sidebar-nav-item group"
                  data-active={isActive ? 'true' : 'false'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 12px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(59,130,246,0.2)' : 'transparent'}`,
                    position: 'relative',
                  }}>
                  {/* Left accent bar */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 20, borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, #3b82f6, #6366f1)',
                    }} />
                  )}
                  {/* Icon container */}
                  <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: isActive ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)',
                      border: `1px solid ${isActive ? 'rgba(59,130,246,0.25)' : 'var(--border)'}`,
                    }}>
                    <Icon size={15} style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }} />
                  </div>
                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none"
                      style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                  {/* Alert badge */}
                  {to === '/alerts' && criticalCount > 0 && (
                    <span className="shrink-0 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                      style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: 10 }}>
                      {criticalCount > 9 ? '9+' : criticalCount}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: darkMode ? 'rgba(251,191,36,0.1)' : 'rgba(96,165,250,0.1)' }}>
              {darkMode
                ? <Sun size={14} style={{ color: '#fbbf24' }} />
                : <Moon size={14} style={{ color: '#60a5fa' }} />}
            </div>
            <span className="flex-1 text-left" style={{ color: 'var(--text-primary)', fontSize: 13 }}>
              {darkMode ? 'Светлая тема' : 'Тёмная тема'}
            </span>
          </button>

          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>v1.0.0</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              Демо
            </span>
          </div>
        </div>
      </aside>

      {/* ═══════════════════ MOBILE BOTTOM NAV ═══════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          height: 60,
          paddingBottom: 'env(safe-area-inset-bottom)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className="flex-1 h-full">
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center h-full gap-1 relative">
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 28, height: 2.5, borderRadius: '0 0 4px 4px',
                    background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  }} />
                )}
                <div className="relative flex items-center justify-center w-9 h-6 rounded-lg transition-all duration-150"
                  style={{ backgroundColor: isActive ? 'rgba(59,130,246,0.12)' : 'transparent' }}>
                  <Icon size={17} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
                  {to === '/alerts' && criticalCount > 0 && (
                    <span className="absolute -top-1 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full font-bold"
                      style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: 8 }}>
                      {criticalCount > 9 ? '9+' : criticalCount}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--accent)' : 'var(--text-muted)', lineHeight: 1 }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}

        {/* Dark mode toggle — last slot */}
        <button onClick={toggleDarkMode} className="flex-1 h-full flex flex-col items-center justify-center gap-1">
          <div className="flex items-center justify-center w-9 h-6 rounded-lg"
            style={{ backgroundColor: 'transparent' }}>
            {darkMode
              ? <Sun size={17} style={{ color: 'var(--text-muted)' }} />
              : <Moon size={17} style={{ color: 'var(--text-muted)' }} />}
          </div>
          <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-muted)', lineHeight: 1 }}>
            {darkMode ? 'Светло' : 'Темно'}
          </span>
        </button>
      </nav>
    </>
  )
}
