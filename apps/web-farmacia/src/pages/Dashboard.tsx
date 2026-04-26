import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import {
  ShoppingBag,
  DollarSign,
  Clock,
  Package
} from 'lucide-react'

interface DashboardStats {
  todayOrders: number
  todayRevenue: string
  pendingOrders: number
  totalProducts: number
  recentOrders: Array<{
    id: number
    customerName: string
    total: string
    status: string
    createdAt: string
  }>
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  accepted: 'bg-lime-100 text-lime-800 dark:bg-lime-500/15 dark:text-lime-300',
  preparing: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  ready: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  out_for_delivery: 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300',
  delivered: 'bg-lime-100 text-lime-800 dark:bg-lime-500/15 dark:text-lime-300',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  preparing: 'Preparando',
  ready: 'Pronto',
  out_for_delivery: 'Em entrega',
  delivered: 'Entregue',
}

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['pharmacy-dashboard', user?.pharmacyId],
    queryFn: async () => {
      if (!user?.pharmacyId) throw new Error('Pharmacy ID not found')
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/pharmacy/dashboard-stats?pharmacyId=${user.pharmacyId}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Pedidos Hoje',
      value: stats?.todayOrders || 0,
      icon: ShoppingBag,
      color: 'bg-green-600',
    },
    {
      label: 'Receita Hoje',
      value: Number(stats?.todayRevenue || 0).toLocaleString('pt-AO', {
        style: 'currency',
        currency: 'AOA'
      }),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      label: 'Pendentes',
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: 'bg-green-700',
    },
    {
      label: 'Produtos',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-emerald-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-green-900">Dashboard</h1>
        <p className="text-green-600/70">Visão geral da sua farmácia</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 w-fit`}>
                <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-green-900">{stat.value}</p>
                <p className="text-sm text-green-600/70">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-green-100">
        <div className="p-6 border-b border-green-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-green-900">Pedidos Recentes</h2>
          <a href="/orders" className="text-sm text-green-600 hover:text-green-700 font-medium">
            Ver todos
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100">
              {stats?.recentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-green-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">
                    {Number(order.total).toLocaleString('pt-AO', {
                      style: 'currency',
                      currency: 'AOA'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
