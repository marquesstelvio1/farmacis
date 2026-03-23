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
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
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
   const response = await fetch(`/api/pharmacy/${user.pharmacyId}/dashboard-stats`)
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
      color: 'bg-blue-500',
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
      color: 'bg-yellow-500',
    },
    {
      label: 'Produtos',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visão geral da sua farmácia</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 w-fit`}>
                <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
          <a href="/orders" className="text-sm text-green-600 hover:text-green-700 font-medium">
            Ver todos
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
