import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Sidebar from './components/common/Sidebar'
import Overview from './pages/Overview'
import Vehicles from './pages/Vehicles'
import VehicleDetail from './pages/VehicleDetail'
import AlertsCenter from './pages/AlertsCenter'
import Analytics from './pages/Analytics'
import Compare from './pages/Compare'

function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-base)' }}>
        {/* mobile: top padding for fixed header */}
        <div className="md:hidden" style={{ height: 56 }} />
        <Outlet />
        <div className="md:hidden" style={{ height: 60 }} />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/alerts" element={<AlertsCenter />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/compare" element={<Compare />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
