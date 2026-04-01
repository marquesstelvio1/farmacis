import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Store, 
  ShoppingCart, 
  Users, 
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Shield,
  DollarSign,
  Settings
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useTheme } from '../hooks/useTheme'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pharmacies', label: 'Área de Controle', icon: Store },
  { path: '/orders', label: 'Pedidos', icon: ShoppingCart },
  { path: '/users', label: 'Usuários', icon: Users },
  { path: '/admin-users', label: 'Administradores', icon: Shield },
  { path: '/balance', label: 'Faturamento', icon: DollarSign },
  { path: '/settings', label: 'Configurações', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between h-16 px-6 border-b border-border flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Brócolis" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold text-primary">Brócolis Admin</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-colors
                  ${isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }
                `}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex-shrink-0 p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-2 mt-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border h-16 flex-shrink-0 overflow-visible">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                onTouchStart={() => setSidebarOpen(true)}
                className="lg:hidden p-3 rounded-lg hover:bg-accent active:bg-accent/80 touch-manipulation z-50 relative focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Abrir menu de navegação"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <span className="text-sm text-muted-foreground">
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
        <main className="p-4 lg:p-8 pb-20">
          {children}
        </main>
      </div>
    </div>
  )
}
