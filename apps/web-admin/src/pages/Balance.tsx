import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, Store, CheckCircle, ShoppingCart } from 'lucide-react'

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Faturamento do Sistema</h1>
          <p className="text-gray-600 dark:text-slate-400">Receita consolidada de todas as farmácias</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Este ano</option>
          </select>
        </div>
      </div>

      {/* Section switcher */}
      <div className="flex flex-wrap justify-center gap-2 bg-white dark:bg-slate-900/70 border border-gray-100 dark:border-slate-800 rounded-xl p-2">
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
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
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
        <div className="bg-white dark:bg-slate-900/70 p-6 rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-slate-800 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-500/15 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
              Ganhos
            </span>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Lucro Total do Sistema (15%)</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
            {formatCurrency(balanceData?.totalSystemProfit || 0)}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900/70 p-6 rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 dark:bg-purple-500/15 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded">
              {balanceData?.totalSystemOrders || 0}
            </span>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Total de Pedidos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{balanceData?.totalSystemOrders || 0}</p>
        </div>

        {/* Completed Orders */}
        <div className="bg-white dark:bg-slate-900/70 p-6 rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 dark:bg-green-500/15 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded">
              Finalizados
            </span>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Pedidos Entregues</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{balanceData?.totalSystemCompleted || 0}</p>
        </div>

        {/* Total System Revenue */}
        <div className="bg-white dark:bg-slate-900/70 p-6 rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 dark:bg-blue-500/15 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded">
              Receita
            </span>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Receita Total Bruta</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
            {formatCurrency(balanceData?.totalSystemRevenue || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Pharmacies */}
        <div className="bg-white dark:bg-slate-900/70 p-6 rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 dark:bg-orange-500/15 p-3 rounded-lg">
              <Store className="w-6 h-6 text-orange-600 dark:text-orange-300" />
            </div>
            <span className="text-xs font-medium text-orange-600 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded">
              Ativas
            </span>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Parceiros Ativos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {balanceData?.pharmacyBreakdown?.length || 0}
          </p>
        </div>
      </div>
        </>
      )}

      {/* Pharmacies Breakdown */}
      {section === 'pharmacies' && (
      <div className="bg-white dark:bg-slate-900/70 rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Faturamento por Farmácia</h2>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="revenue">Ordenar por Receita</option>
              <option value="orders">Ordenar por Pedidos</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  Farmácia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  Receita Bruta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-600 dark:text-emerald-300 uppercase">
                  Lucro (Ganhos)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  % do Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  Entregues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                  Taxa de Conclusão
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {sortedPharmacies.map((pharmacy) => {
                const totalRevenue = parseFloat(balanceData?.totalSystemRevenue || '0')
                const pharmacyRevenue = parseFloat(pharmacy.revenue)
                const percentage = totalRevenue > 0 ? ((pharmacyRevenue / totalRevenue) * 100).toFixed(1) : '0'
                const completionRate = pharmacy.ordersCount > 0
                  ? ((pharmacy.completedOrders / pharmacy.ordersCount) * 100).toFixed(0)
                  : '0'

                return (
                  <tr key={pharmacy.pharmacyId} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">
                      {pharmacy.pharmacyName}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-slate-200">
                      {formatCurrency(pharmacy.revenue)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-300">
                      {formatCurrency(pharmacy.profit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span>{percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                      {pharmacy.ordersCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                      {pharmacy.completedOrders}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${parseFloat(completionRate) >= 80
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300'
                        : parseFloat(completionRate) >= 50
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300'
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
