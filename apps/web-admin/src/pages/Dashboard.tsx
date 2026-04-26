import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
  Shield,
  Search,
  Mail,
  Calendar
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
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
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

interface User {
  id: number
  name: string
  email: string
  emailVerified: boolean
  role: string
  createdAt: string
  ordersCount: number
}

type UserTab = 'clients' | 'team'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<UserTab>('clients')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/admin/dashboard-stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
  })

  // Fetch users based on active tab
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users', activeTab],
    queryFn: async () => {
      const endpoint = activeTab === 'team' 
        ? '/api/admin/team-users' 
        : '/api/admin/users?role=CLIENTE'
      const response = await fetch(import.meta.env.VITE_API_URL + endpoint)
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
  })

  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      label: 'Lucro do Sistema (10%)',
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visão geral do marketplace</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
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
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <span className="text-sm font-medium text-blue-600">{stat.trend}</span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stat.isCurrency
                    ? Number(stat.value).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })
                    : stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmácia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.pharmacyName}
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
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management Section with Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'clients'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Gestão de Clientes
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'team'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            Equipa / Farmácias
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'clients' ? 'cliente' : 'membro da equipa'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Tab Content with Animation */}
        <div className="overflow-x-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === 'clients' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'clients' ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {activeTab === 'clients' ? 'Cliente' : 'Membro'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    {activeTab === 'team' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Função
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedidos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadastro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={activeTab === 'team' ? 6 : 5} className="px-6 py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredUsers?.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'team' ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                        Nenhum {activeTab === 'clients' ? 'cliente' : 'membro'} encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredUsers?.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activeTab === 'clients' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              <span className={`text-sm font-medium ${
                                activeTab === 'clients' ? 'text-blue-600' : 'text-purple-600'
                              }`}>
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {user.email}
                          </div>
                        </td>
                        {activeTab === 'team' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'ADMIN'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {user.role === 'ADMIN' ? 'Administrador' : 'Farmácia'}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.emailVerified
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {user.emailVerified ? 'Verificado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.ordersCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
