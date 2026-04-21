import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, Store, CheckCircle, ShoppingCart, AlertCircle, PackageX } from 'lucide-react'

interface AdminBalanceData {
  totalSystemRevenue: string
  totalSystemProfit: string
  totalSystemOrders: number
  totalSystemCompleted: number
  pharmacyBreakdown: Array<{
    pharmacyId: number
    pharmacyName: string
    revenue: string
    profit: string
    ordersCount: number
    completedOrders: number
    unpaidOrdersCount: number
    lostRevenue: string
  }>
}

export default function AdminBalance() {
  const [timeRange, setTimeRange] = useState('30')
  const [sortBy, setSortBy] = useState('revenue')
  const [section, setSection] = useState<'platform' | 'pharmacies'>('platform')

  const { data: balanceData, isLoading } = useQuery<AdminBalanceData>({
    queryKey: ['admin-balance', timeRange],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/balance?days=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch balance')
      return response.json()
    },
  })

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(typeof value === 'string' ? parseFloat(value) : value)
  }

  const sortedPharmacies = (balanceData?.pharmacyBreakdown || []).sort((a, b) => {
    if (sortBy === 'revenue') {
      return parseFloat(b.revenue) - parseFloat(a.revenue)
    } else if (sortBy === 'orders') {
      return b.ordersCount - a.ordersCount
    }
    return parseFloat(b.revenue) - parseFloat(a.revenue)
  })

  const totalLostRevenue = balanceData?.pharmacyBreakdown?.reduce((acc, p) => acc + parseFloat(p.lostRevenue || '0'), 0) || 0;
  const totalUnpaidOrders = balanceData?.pharmacyBreakdown?.reduce((acc, p) => acc + (p.unpaidOrdersCount || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faturamento do Sistema</h1>
          <p className="text-gray-600">Receita consolidada de todas as farmácias</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Este ano</option>
          </select>
        </div>
      </div>

      {/* Section switcher */}
      <div className="flex flex-wrap justify-center gap-2 bg-white rounded-xl p-2 shadow-xl">
        {[
          { id: 'platform' as const, label: 'Plataforma' },
          { id: 'pharmacies' as const, label: 'Farmácias' },
        ].map((item) => {
          const active = section === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                active
                  ? item.id === 'platform' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-emerald-600 text-white shadow-sm'
                  : `text-gray-600 ${
                      section === 'platform'
                        ? 'hover:bg-blue-100/50'
                        : 'hover:bg-emerald-100/50'
                    }`
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Plataforma */}
      {section === 'platform' && (
        <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total System Profit */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Ganhos
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Lucro Total do Sistema (10%)</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(balanceData?.totalSystemProfit || 0)}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
              {balanceData?.totalSystemOrders || 0}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total de Pedidos</p>
          <p className="text-2xl font-bold text-gray-900">{balanceData?.totalSystemOrders || 0}</p>
        </div>

        {/* Completed Orders */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              Finalizados
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Pedidos Entregues</p>
          <p className="text-2xl font-bold text-gray-900">{balanceData?.totalSystemCompleted || 0}</p>
        </div>

        {/* Total System Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Receita
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Receita Total Bruta</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(balanceData?.totalSystemRevenue || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Lost Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
              Inadimplência
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Receita Perdida Total</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalLostRevenue)}
          </p>
        </div>

        {/* Unpaid Orders Count */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-50 p-3 rounded-lg">
              <PackageX className="w-6 h-6 text-red-500" />
            </div>
            <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
              {totalUnpaidOrders} pedidos
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Pedidos Não Pagos</p>
          <p className="text-2xl font-bold text-gray-900">{totalUnpaidOrders}</p>
        </div>

        {/* Active Pharmacies */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Store className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Ativas
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-1">Parceiros Ativos</p>
          <p className="text-2xl font-bold text-gray-900">
            {balanceData?.pharmacyBreakdown?.length || 0}
          </p>
        </div>
      </div>
        </>
      )}

      {/* Pharmacies Breakdown */}
      {section === 'pharmacies' && (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Faturamento por Farmácia</h2>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-100 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="revenue">Ordenar por Receita</option>
              <option value="orders">Ordenar por Pedidos</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Farmácia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Receita Bruta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-600 uppercase">
                  Lucro (Ganhos)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  % do Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Entregues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase">
                  Não Pagos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase">
                  Receita Perdida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Taxa de Conclusão
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sortedPharmacies.map((pharmacy) => {
                const totalRevenue = parseFloat(balanceData?.totalSystemRevenue || '0')
                const pharmacyRevenue = parseFloat(pharmacy.revenue)
                const percentage = totalRevenue > 0 ? ((pharmacyRevenue / totalRevenue) * 100).toFixed(1) : '0'
                const completionRate = pharmacy.ordersCount > 0
                  ? ((pharmacy.completedOrders / pharmacy.ordersCount) * 100).toFixed(0)
                  : '0'

                return (
                  <tr key={pharmacy.pharmacyId} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {pharmacy.pharmacyName}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                      {formatCurrency(pharmacy.revenue)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                      {formatCurrency(pharmacy.profit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span>{percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pharmacy.ordersCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pharmacy.completedOrders}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-500">
                      {pharmacy.unpaidOrdersCount}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600">
                      {formatCurrency(pharmacy.lostRevenue)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${parseFloat(completionRate) >= 80
                        ? 'bg-green-100 text-green-800'
                        : parseFloat(completionRate) >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {completionRate}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div >
  )
}
