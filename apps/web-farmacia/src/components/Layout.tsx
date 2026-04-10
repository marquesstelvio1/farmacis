import { useState, useEffect, useCallback } from 'react'
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
  FileText,
  Clock,
  ChevronRight,
  Package2
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useSocket } from '../hooks/useSocket'

interface Notification {
  id: number
  type: 'order' | 'prescription'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

interface Toast {
  id: number
  orderId: number
  customerName: string
  total: string
}

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
  const [notifPanelOpen, setNotifPanelOpen] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [pendingPrescriptionsCount, setPendingPrescriptionsCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [lastSeenCount, setLastSeenCount] = useState(0)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  // Connect to WebSocket for real-time notifications
  const { socket } = useSocket(user?.pharmacyId)

  // Fetch pending counts and load saved state
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        if (!user?.pharmacyId) return;
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/pharmacy/orders/pending-count?pharmacyId=${user.pharmacyId}`)
        if (response.ok) {
          const data = await response.json()
          setNewOrdersCount(data.count)
          // Load last seen count from localStorage
          const savedLastSeen = localStorage.getItem(`lastSeenCount_${user.pharmacyId}`)
          if (savedLastSeen) {
            setLastSeenCount(parseInt(savedLastSeen, 10))
          }
        }
      } catch (error) {
        console.error('Error fetching pending count:', error)
      }
    }

    const fetchPendingPrescriptions = async () => {
      try {
        if (!user?.pharmacyId) return;
        const apiUrl = import.meta.env.VITE_API_URL || '';
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

  // Listen for new orders via WebSocket
  useEffect(() => {
    if (!socket) return

    const handleNewOrder = (order: any) => {
      // Add notification
      const newNotif: Notification = {
        id: Date.now(),
        type: 'order',
        title: 'Novo Pedido!',
        message: `Pedido #${order.id} de ${order.customerName}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: order
      }
      setNotifications(prev => [newNotif, ...prev])
      
      // Add toast
      const newToast: Toast = {
        id: Date.now(),
        orderId: order.id,
        customerName: order.customerName,
        total: order.total
      }
      setToasts(prev => [...prev, newToast])
      
      // Update count
      setNewOrdersCount(prev => prev + 1)
      
      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id))
      }, 5000)
    }

    socket.on('new-order', handleNewOrder)
    return () => {
      socket.off('new-order', handleNewOrder)
    }
  }, [socket])

  // Open notification panel and mark as seen
  const openNotifications = useCallback(() => {
    setNotifPanelOpen(true)
    // Mark current count as seen
    setLastSeenCount(newOrdersCount)
    if (user?.pharmacyId) {
      localStorage.setItem(`lastSeenCount_${user.pharmacyId}`, newOrdersCount.toString())
    }
  }, [newOrdersCount, user?.pharmacyId])

  // Remove toast on touch/click
  const removeToast = useCallback((toastId: number) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))
  }, [])

  // Calculate unread count (difference between current and last seen)
  const unreadCount = Math.max(0, newOrdersCount - lastSeenCount)

  return (
    <div className="min-h-screen bg-green-50/50 text-green-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
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
              <button 
                onClick={openNotifications}
                className="relative p-2 text-green-700 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-amber-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
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

        {/* Page content */}
        <main className="p-4 lg:p-8 min-h-[calc(100vh-4rem)] bg-green-50/50">
          {children}
        </main>
      </div>

      {/* Notification Panel */}
      {notifPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-50"
          onClick={() => setNotifPanelOpen(false)}
        >
          <div 
            className="absolute right-4 top-16 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-green-100 overflow-hidden"
            style={{ animation: 'slideIn 0.2s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-green-100 flex items-center justify-between">
              <h3 className="font-semibold text-green-900">Notificações</h3>
              <button 
                onClick={() => setNotifPanelOpen(false)}
                className="p-1 hover:bg-green-50 rounded-lg text-green-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-green-200 mx-auto mb-3" />
                  <p className="text-green-600/70 text-sm">Sem notificações novas</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    to="/orders"
                    onClick={() => setNotifPanelOpen(false)}
                    className="flex items-start gap-3 p-4 hover:bg-green-50 border-b border-green-50 last:border-0 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${notif.type === 'order' ? 'bg-green-100' : 'bg-amber-100'}`}>
                      <Package2 className={`w-4 h-4 ${notif.type === 'order' ? 'text-green-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-green-900 text-sm">{notif.title}</p>
                      <p className="text-green-600/70 text-xs mt-0.5">{notif.message}</p>
                      <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-green-400" />
                  </Link>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="p-3 border-t border-green-100 bg-green-50/50">
                <Link
                  to="/orders"
                  onClick={() => setNotifPanelOpen(false)}
                  className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Ver todos os pedidos
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="pointer-events-auto bg-white rounded-xl shadow-xl border-l-4 border-green-500 p-4 flex items-center gap-3 cursor-pointer transform transition-all"
          >
            <div className="p-2 bg-green-100 rounded-full">
              <ShoppingBag className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-900 text-sm">Novo Pedido #{toast.orderId}</p>
              <p className="text-green-600/70 text-xs truncate">{toast.customerName} • {Number(toast.total).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
              className="p-1 hover:bg-green-50 rounded-lg text-green-400 hover:text-green-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
