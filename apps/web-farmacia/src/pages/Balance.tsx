import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { DollarSign, TrendingUp, ShoppingCart, CheckCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface BalanceData {
  totalRevenue: string
  totalOrders: number
  completedOrders: number
  pendingRevenue: string
  orderBreakdown: Array<{
    date: string
    total: string
    count: number
  }>
}

interface Order {
  id: number
  customerName: string
  total: string
  status: string
  paymentMethod: string
  createdAt: string
}

export default function Balance() {
  const { user } = useAuthStore()
  const [timeRange, setTimeRange] = useState('30')

  const { data: balance, isLoading: balanceLoading } = useQuery<BalanceData>({
    queryKey: ['pharmacy-balance', user?.pharmacyId, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/pharmacy/${user?.pharmacyId}/balance?days=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch balance')
      return response.json()
    },
    enabled: !!user?.pharmacyId,
  })

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['pharmacy-recent-orders', user?.pharmacyId],
    queryFn: async () => {
      const response = await fetch(`/api/pharmacy/${user?.pharmacyId}/orders?limit=10`)
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    },
    enabled: !!user?.pharmacyId,
  })

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(typeof value === 'string' ? parseFloat(value) : value)
  }

  if (balanceLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faturamento</h1>
          <p className="text-gray-600">Acompanhe a receita da sua farmácia</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Este ano</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              +5%
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Receita Total</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(balance?.totalRevenue || 0)}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {balance?.totalOrders || 0}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total de Pedidos</p>
          <p className="text-2xl font-bold text-gray-900">{balance?.totalOrders || 0}</p>
        </div>

        {/* Completed Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              Finalizados
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Pedidos Entregues</p>
          <p className="text-2xl font-bold text-gray-900">{balance?.completedOrders || 0}</p>
        </div>

        {/* Pending Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
              Pendente
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Receita Pendente</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(balance?.pendingRevenue || 0)}
          </p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.customerName}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'delivered' ? 'Entregue' :
                       order.status === 'pending' ? 'Pendente' :
                       order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                    {order.paymentMethod}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
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
