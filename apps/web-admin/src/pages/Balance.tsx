import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DollarSign, TrendingUp, Store, CheckCircle, ShoppingCart,
  AlertCircle, PackageX, History, CreditCard, Upload,
  Download, Search, X, Loader2, Camera, User, Shield,
  Menu, Filter, ChevronRight, LayoutDashboard, Building2
} from 'lucide-react'


interface AdminBalanceData {
  totalSystemRevenue: string
  totalSystemProfit: string
  platformFeePercent?: string
  totalSystemOrders: number
  totalSystemCompleted: number
  pharmacyBreakdown: Array<{
    pharmacyId: number
    pharmacyName: string
    revenue: string
    platformRevenue: string
    directRevenue: string
    profit: string
    payableToPharmacy: string
    ordersCount: number
    completedOrders: number
    unpaidOrdersCount?: number
    lostRevenue?: string
  }>

}

interface SettlementHistory {
  id: number
  pharmacyId: number
  pharmacyName: string
  amount: string
  platformProfit: string
  totalRevenue: string
  proofUrl: string | null
  createdAt: string
}


export default function AdminBalance() {
  const queryClient = useQueryClient()
  const [timeRange, setTimeRange] = useState('30')
  const [sortBy, setSortBy] = useState('revenue')
  const [entityType, setEntityType] = useState<'pharmacies' | 'clinics' | 'professionals' | 'insurers'>('pharmacies')
  const [section, setSection] = useState<'platform' | 'pharmacies' | 'settlements' | 'history'>('platform')


  // Settlement state
  const [selectedPharmacy, setSelectedPharmacy] = useState<any | null>(null)
  const [proofBase64, setProofBase64] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: balanceData, isLoading, refetch: refetchBalance } = useQuery<AdminBalanceData>({
    queryKey: ['admin-balance', timeRange],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/balance`)
      if (!response.ok) throw new Error('Failed to fetch balance')
      return response.json()
    },
  })

  const { data: historyData, isLoading: isLoadingHistory } = useQuery<SettlementHistory[]>({
    queryKey: ['admin-settlements'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/settlements`)
      if (!response.ok) throw new Error('Failed to fetch history')
      return response.json()
    },
    enabled: section === 'history' || section === 'settlements'
  })

  // Fetch individual pharmacy bank details when selecting for payment
  const { data: pharmacyDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['pharmacy-details', selectedPharmacy?.pharmacyId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pharmacies/${selectedPharmacy.pharmacyId}`)
      if (!response.ok) throw new Error('Failed to fetch pharmacy details')
      return response.json()
    },
    enabled: !!selectedPharmacy
  })


  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(typeof value === 'string' ? parseFloat(value) : value)
  }

  const formatPhone = (phone: string) => {
    if (!phone) return 'Não configurado'
    const clean = phone.replace(/\s/g, '')
    if (clean.startsWith('+244') && clean.length === 13) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 10)} ${clean.slice(10)}`
    }
    return phone
  }

  const formatIBAN = (iban: string) => {
    if (!iban) return 'Não configurado'
    // Remove existing spaces and group by 4
    const clean = iban.replace(/\s/g, '')
    return (clean.match(/.{1,4}/g) || [clean]).join(' ')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofBase64(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSettle = async () => {
    if (!selectedPharmacy || !proofBase64) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pharmacies/${selectedPharmacy.pharmacyId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPharmacy.payableToPharmacy,
          platformProfit: selectedPharmacy.profit,
          totalRevenue: selectedPharmacy.revenue,
          proofUrl: proofBase64,
          notes: `Pagamento de saldo pendente via painel admin`
        })
      })

      if (!response.ok) throw new Error('Falha ao processar pagamento')

      // Success
      alert('Pagamento processado com sucesso!')
      setSelectedPharmacy(null)
      setProofBase64(null)
      refetchBalance()
      queryClient.invalidateQueries({ queryKey: ['admin-settlements'] })
    } catch (err) {
      console.error(err)
      alert('Erro ao processar pagamento')
    } finally {
      setIsSubmitting(false)
    }
  }


  const sortedPharmacies = (balanceData?.pharmacyBreakdown || []).sort((a, b) => {
    if (sortBy === 'revenue') {
      return parseFloat(b.revenue) - parseFloat(a.revenue)
    } else if (sortBy === 'orders') {
      return b.ordersCount - a.ordersCount
    }
    return parseFloat(b.revenue) - parseFloat(a.revenue)
  })

  const filteredPharmacies = sortedPharmacies.filter(p =>
    p.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase())
  )


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
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Faturamento do Sistema</h1>
          <p className="text-sm md:text-base text-gray-600">Receita consolidada da plataforma</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[150px] shadow-sm text-sm"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Este ano</option>
          </select>
        </div>
      </div>

      {/* Main Entity Switcher */}
      <div className="flex flex-wrap justify-center gap-2 bg-white border border-gray-100 rounded-xl p-2 shadow-sm">
        {[
          { id: 'pharmacies' as const, label: 'Farmácias', icon: Store },
          { id: 'clinics' as const, label: 'Clínicas', icon: Building2 },
          { id: 'professionals' as const, label: 'Profissionais', icon: User },
          { id: 'insurers' as const, label: 'Seguradoras', icon: Shield },
        ].map((item) => {
          const active = entityType === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setEntityType(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${active
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Content for Pharmacies (The existing logic) */}
      {entityType === 'pharmacies' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Tab Switcher */}
          <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-center gap-1 md:gap-2 bg-gray-100/50 rounded-xl p-1.5 shadow-inner">
            {[
              { id: 'platform' as const, label: 'Plataforma', icon: TrendingUp },
              { id: 'pharmacies' as const, label: 'Liquidez', icon: Store },
              { id: 'settlements' as const, label: 'Pagamentos Pendentes', icon: CreditCard },
              { id: 'history' as const, label: 'Histórico', icon: History },
            ].map((item) => {
              const active = section === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id)
                    setSelectedPharmacy(null)
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${active
                    ? 'bg-white text-blue-600 shadow-md scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </div>



          {/* Plataforma */}
          {section === 'platform' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Total System Profit */}
                <div className="bg-white p-5 md:p-6 rounded-xl shadow-lg border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-100 p-2 md:p-3 rounded-lg">
                      <TrendingUp className="w-5 h-5 md:w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Ganhos
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs md:text-sm mb-1">
                    Lucro da Plataforma ({balanceData?.platformFeePercent || '10'}%)
                  </p>
                  <p className="text-xl md:text-2xl font-black text-blue-600">
                    {formatCurrency(balanceData?.totalSystemProfit || 0)}
                  </p>
                </div>

                {/* Total Orders */}
                <div className="bg-white p-5 md:p-6 rounded-xl shadow-lg border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-purple-100 p-2 md:p-3 rounded-lg">
                      <ShoppingCart className="w-5 h-5 md:w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      {balanceData?.totalSystemOrders || 0}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs md:text-sm mb-1">Total de Pedidos</p>
                  <p className="text-xl md:text-2xl font-black text-gray-900">{balanceData?.totalSystemOrders || 0}</p>
                </div>

                {/* Completed Orders */}
                <div className="bg-white p-5 md:p-6 rounded-xl shadow-lg border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-emerald-100 p-2 md:p-3 rounded-lg">
                      <CheckCircle className="w-5 h-5 md:w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      Taxa: {balanceData?.totalSystemOrders ? ((balanceData.totalSystemCompleted / balanceData.totalSystemOrders) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs md:text-sm mb-1">Pedidos Entregues</p>
                  <p className="text-xl md:text-2xl font-black text-gray-900">{balanceData?.totalSystemCompleted || 0}</p>
                </div>

                {/* Total System Revenue */}
                <div className="bg-white p-5 md:p-6 rounded-xl shadow-lg border-l-4 border-l-indigo-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-indigo-100 p-2 md:p-3 rounded-lg">
                      <DollarSign className="w-5 h-5 md:w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      Bruto
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs md:text-sm mb-1">Receita Total Bruta</p>
                  <p className="text-xl md:text-2xl font-black text-indigo-600">
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
                        Lucro da Plataforma
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">
                        A Pagar à Farmácia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Receita Plataforma
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Receita em Cash/Loja
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
                          <td className="px-6 py-4 text-sm font-semibold text-blue-700">
                            {formatCurrency(pharmacy.payableToPharmacy || '0')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(pharmacy.platformRevenue)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(pharmacy.directRevenue)}
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
          {/* Settlements Tab */}
          {section === 'settlements' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">Saldos a Pagar</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar farmácia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden h-fit">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Farmácia
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Vendas Totais
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                          Lucro Plataforma
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                          Valor Líquido
                        </th>
                        <th className="px-10 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPharmacies.filter(p => parseFloat(p.payableToPharmacy) > 0).map((pharmacy) => (
                        <tr
                          key={pharmacy.pharmacyId}
                          className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${selectedPharmacy?.pharmacyId === pharmacy.pharmacyId ? 'bg-blue-50' : ''}`}
                          onClick={() => setSelectedPharmacy(pharmacy)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Store className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-900">{pharmacy.pharmacyName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatCurrency(pharmacy.revenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                            {formatCurrency(pharmacy.profit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                            {formatCurrency(pharmacy.payableToPharmacy)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedPharmacy(pharmacy)
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              Pagar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredPharmacies.filter(p => parseFloat(p.payableToPharmacy) > 0).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            Nenhum pagamento pendente no momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-fit sticky top-6">
                  {selectedPharmacy ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Efetuar Pagamento</h3>
                        <button onClick={() => setSelectedPharmacy(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                          <Store className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-blue-900">{selectedPharmacy.pharmacyName}</span>
                        </div>
                        <div className="text-2xl font-black text-blue-700">
                          {formatCurrency(selectedPharmacy.payableToPharmacy)}
                        </div>
                      </div>

                      {isLoadingDetails ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                      ) : pharmacyDetails && (
                        <div className="space-y-4">
                          <div className="text-sm font-medium text-gray-700">Dados de Destino</div>
                          <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500 uppercase tracking-tighter">IBAN:</span>
                              <span className="font-mono text-gray-900 select-all font-bold">{formatIBAN(pharmacyDetails.iban)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500 uppercase tracking-tighter">Express:</span>
                              <span className="font-mono text-gray-900 font-bold">{formatPhone(pharmacyDetails.multicaixaExpress)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500 uppercase tracking-tighter">Titular:</span>
                              <span className="font-medium text-gray-900 font-bold">{pharmacyDetails.accountName || 'Não configurado'}</span>
                            </div>
                          </div>


                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700">Comprovativo de Pagamento</label>
                            <div
                              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${proofBase64 ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/10'
                                }`}
                            >
                              {proofBase64 ? (
                                <>
                                  <img src={proofBase64} alt="Preview" className="max-h-40 rounded-lg shadow-md mb-4" />
                                  <button
                                    onClick={() => setProofBase64(null)}
                                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  <span className="text-xs font-bold text-emerald-700">Imagem selecionada</span>
                                </>
                              ) : (
                                <>
                                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                                    <Camera className="w-8 h-8 text-gray-400" />
                                  </div>
                                  <p className="text-sm text-gray-500 mb-2">Toque para fazer upload</p>
                                  <p className="text-xs text-gray-400">(PDF, JPG ou PNG)</p>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                </>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={handleSettle}
                            disabled={!proofBase64 || isSubmitting}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 ${!proofBase64 || isSubmitting
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:scale-[1.02] active:scale-95'
                              }`}
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-5 h-5" />
                                Confirmar e Enviar
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <div className="bg-gray-50 p-6 rounded-full">
                        <User className="w-12 h-12 text-gray-300" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Nenhuma farmácia selecionada</h3>
                        <p className="text-sm text-gray-500">Selecione uma farmácia na lista ao lado para processar o pagamento do saldo pendente.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {section === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Histórico de Pagamentos</h2>
              </div>

              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Farmácia</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Total Vendas</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-600 uppercase">Lucro Sistema</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase">Pago</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Documentos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyData?.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(item.createdAt).toLocaleDateString('pt-AO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {item.pharmacyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(item.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                          {formatCurrency(item.platformProfit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {item.proofUrl && (
                            <a
                              href={item.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs"
                            >
                              <Download className="w-3 h-3" />
                              Ver Comprovativo
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                    {historyData?.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          Nenhum registro de pagamento encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl shadow-xl border border-gray-100 animate-in zoom-in-95 duration-500">
          <div className="bg-blue-50 p-6 rounded-full mb-6">
            <LayoutDashboard className="w-12 h-12 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Relatórios em Breve</h3>
          <p className="text-gray-500 max-w-md">
            Estamos a trabalhar na consolidação dos dados de {entityType === 'clinics' ? 'Clínicas' : entityType === 'professionals' ? 'Profissionais' : 'Seguradoras'}.
            Esta secção estará disponível na próxima atualização.
          </p>
          <button
            onClick={() => setEntityType('pharmacies')}
            className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg"
          >
            Voltar para Farmácias
          </button>
        </div>
      )}
    </div>
  )
}


