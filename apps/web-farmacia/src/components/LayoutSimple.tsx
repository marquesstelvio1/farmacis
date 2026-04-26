import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  DollarSign,
  FileText
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Pedidos', icon: ShoppingBag },
  { path: '/prescriptions', label: 'Receitas', icon: FileText },
  { path: '/products', label: 'Produtos', icon: Package },
  { path: '/balance', label: 'Faturamento', icon: DollarSign },
  { path: '/settings', label: 'Configurações', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [pendingPrescriptionsCount, setPendingPrescriptionsCount] = useState(0)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        if (!user?.pharmacyId) return
        const apiUrl = import.meta.env.VITE_API_URL || ''
        const response = await fetch(`${apiUrl}/api/pharmacy/orders/pending-count?pharmacyId=${user.pharmacyId}`)
        if (response.ok) {
          const data = await response.json()
          setNewOrdersCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching pending count:', error)
      }
    }

    const fetchPendingPrescriptions = async () => {
      try {
        if (!user?.pharmacyId) return
        const apiUrl = import.meta.env.VITE_API_URL || ''
        const response = await fetch(`${apiUrl}/api/pharmacy/${user.pharmacyId}/prescriptions/pending-count`)
        if (response.ok) {
          const data = await response.json()
          setPendingPrescriptionsCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching pending prescriptions:', error)
      }
    }

    if (user?.pharmacyId) {
      fetchPendingCount()
      fetchPendingPrescriptions()
      const interval = setInterval(() => {
        fetchPendingCount()
        fetchPendingPrescriptions()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.pharmacyId])

  return (
    <div className="min-h-screen bg-green-50/50 text-green-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-green-100
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-green-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Brócolis" className="w-8 h-8 object-contain" />
            <div>
              <p className="text-sm font-semibold text-green-900">{user?.pharmacyName}</p>
              <p className="text-xs text-green-600/70">Brócolis Farmácia</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-green-50"
          >
            <X className="w-5 h-5 text-green-700" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const isOrders = item.path === '/orders'
            const isPrescriptions = item.path === '/prescriptions'
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-colors relative
                  ${isActive
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                    : 'text-green-700 hover:bg-green-50 hover:text-green-900'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {isOrders && newOrdersCount > 0 && (
                  <span className="absolute right-3 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {newOrdersCount}
                  </span>
                )}
                {isPrescriptions && pendingPrescriptionsCount > 0 && (
                  <span className="absolute right-3 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingPrescriptionsCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-100">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-sm font-medium text-green-700">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-green-600/70 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2 mt-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white border-b border-green-100 h-16 flex-shrink-0 overflow-visible">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                onTouchStart={() => setSidebarOpen(true)}
                className="lg:hidden p-3 rounded-lg hover:bg-green-50 active:bg-green-100 touch-manipulation z-50 relative focus:outline-none focus:ring-2 focus:ring-green-600"
                aria-label="Abrir menu de navegação"
              >
                <Menu className="w-6 h-6 text-green-800" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-green-700 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <span className="text-sm text-green-700 hidden sm:block">
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 min-h-[calc(100vh-4rem)] bg-green-50/50">
          {children}
        </main>
      </div>
    </div>
  )
}
