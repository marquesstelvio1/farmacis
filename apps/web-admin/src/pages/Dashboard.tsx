import { useQuery } from '@tanstack/react-query'
import {
  Store,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface DashboardStats {
  totalPharmacies: number
  activePharmacies: number
  pendingPharmacies: number
  totalOrders: number
  todayOrders: number
  totalUsers: number
  totalRevenue: string
  totalProfit: string
  recentOrders: Array<{
    id: number
    customerName: string
    pharmacyName: string
    total: string
    status: string
    createdAt: string
  }>
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300',
  accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  preparing: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
  ready: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
  out_for_delivery: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-slate-500/15 dark:text-slate-300',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  preparing: 'Preparando',
  ready: 'Pronto',
  out_for_delivery: 'Em entrega',
  delivered: 'Entregue',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/admin/dashboard-stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total de Farmácias',
      value: stats?.totalPharmacies || 0,
      icon: Store,
      color: 'bg-blue-500',
      trend: '+12%'
    },
    {
      label: 'Farmácias Ativas',
      value: stats?.activePharmacies || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: '+5%'
    },
    {
      label: 'Pendentes Aprovação',
      value: stats?.pendingPharmacies || 0,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      trend: '3 novas'
    },
    {
      label: 'Lucro do Sistema (15%)',
      value: stats?.totalProfit || '0',
      isCurrency: true,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      trend: '+15.3%'
    },
    {
      label: 'Receita Total Bruta',
      value: stats?.totalRevenue || '0',
      isCurrency: true,
      icon: DollarSign,
      color: 'bg-indigo-500',
      trend: '+8%'
    },
    {
      label: 'Total de Pedidos',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      trend: '+23%'
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400">Visão geral do marketplace</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/20">
        <h2 className="text-lg font-bold mb-2">Ações Rápidas</h2>
        <p className="text-blue-100 text-sm mb-4">Gerencie seu marketplace de forma eficiente.</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/pharmacies" className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
            Registrar Nova Farmácia
          </Link>
          <Link to="/users" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-400 transition-colors">
            Gerenciar Usuários
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-900/70 p-6 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 dark:bg-opacity-20`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')} dark:opacity-95`} />
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">{stat.trend}</span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {stat.isCurrency
                    ? Number(stat.value).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })
                    : stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-slate-900/70 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-slate-800">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Pedidos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Farmácia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {stats?.recentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                    {order.pharmacyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
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
