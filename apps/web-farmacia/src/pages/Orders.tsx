import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/authStore'
import {
  ShoppingBag,
  Search,
  Filter,
  MapPin,
  Phone,
  ChevronRight,
  CheckCircle,
  XCircle,
  Package,
  Lock
} from 'lucide-react'

interface Order {
  id: number
  customerName: string
  customerPhone: string
  customerAddress: string
  total: string
  deliveryFee: string
  status: string
  paymentMethod: string
  paymentStatus?: string
  isLocked?: boolean
  createdAt: string
  items: Array<{
    productName: string
    quantity: number
    unitPrice: string
  }>
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-lime-100 text-lime-800',
  preparing: 'bg-emerald-100 text-emerald-800',
  ready: 'bg-green-100 text-green-800',
  out_for_delivery: 'bg-teal-100 text-teal-800',
  delivered: 'bg-lime-100 text-lime-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-700',
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

const nextStatusMap: Record<string, string> = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
}

const statusActions: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Aceitar Pedido', icon: CheckCircle, color: 'bg-[#072a1c] hover:bg-[#0a3a26]' },
  accepted: { label: 'Iniciar Preparo', icon: Package, color: 'bg-emerald-600 hover:bg-emerald-700' },
  preparing: { label: 'Pronto para Entrega', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
  ready: { label: 'Saiu para Entrega', icon: MapPin, color: 'bg-teal-600 hover:bg-teal-700' },
  out_for_delivery: { label: 'Marcar Entregue', icon: CheckCircle, color: 'bg-[#8bc14a] hover:bg-[#77aa3f]' },
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['pharmacy-orders', user?.pharmacyId],
    queryFn: async () => {
      if (!user?.pharmacyId) throw new Error('Pharmacy ID not found')
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/pharmacy/orders?pharmacyId=${user.pharmacyId}`)
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pharmacy/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update status')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] })
      toast.success('Status atualizado!')
    },
    onError: () => {
      toast.error('Erro ao atualizar status')
    },
  })

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#dce4d7] border-t-[#072a1c]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 transition-colors">
      <div>
        <h1 className="text-2xl font-bold text-[#072a1c]">Pedidos</h1>
        <p className="text-[#607369]">Gerencie os pedidos da sua farmácia</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#607369]" />
          <input
            type="text"
            placeholder="Buscar pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#dce4d7] bg-white text-[#072a1c] rounded-lg shadow-sm focus:ring-2 focus:ring-[#8bc14a] focus:border-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#607369]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-[#dce4d7] bg-white text-[#072a1c] rounded-lg shadow-sm focus:ring-2 focus:ring-[#8bc14a] focus:border-transparent outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="accepted">Aceitos</option>
            <option value="preparing">Preparando</option>
            <option value="ready">Prontos</option>
            <option value="out_for_delivery">Em entrega</option>
            <option value="delivered">Entregues</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders?.map((order) => {
          const action = statusActions[order.status]
          const ActionIcon = action?.icon

          return (
            <div key={order.id} className={`bg-white rounded-xl shadow-sm border border-[#dce4d7] p-6 transition-all ${order.isLocked ? 'border-l-4 border-l-[#8bc14a]' : ''}`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#eef7e8] rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-6 h-6 text-[#8bc14a]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#072a1c]">Pedido #{order.id}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                      {order.isLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-[#eef7e8] text-[#072a1c]">
                          <Lock className="w-3 h-3" />
                          Transação Garantida - MCX
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-[#072a1c] mt-1">
                      {Number(order.total).toLocaleString('pt-AO', {
                        style: 'currency',
                        currency: 'AOA'
                      })}
                    </p>
                    <p className="text-sm text-[#607369]">
                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!order.isLocked && action && (
                    <button
                      onClick={() => updateStatusMutation.mutate({
                        orderId: order.id,
                        status: nextStatusMap[order.status]
                      })}
                      disabled={updateStatusMutation.isPending}
                      className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
                    >
                      <ActionIcon className="w-4 h-4" />
                      {action.label}
                    </button>
                  )}
                  {order.status === 'pending' && !order.isLocked && (
                    <button
                      onClick={() => updateStatusMutation.mutate({
                        orderId: order.id,
                        status: 'rejected'
                      })}
                      disabled={updateStatusMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeitar
                    </button>
                  )}
                  <Link
                    to={`/orders/${order.id}`}
                    className="p-2 text-[#607369] hover:text-[#072a1c] hover:bg-[#f7faf5] rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#eef3ec] grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-[#607369] mb-1">Cliente</p>
                  <p className="text-sm text-[#072a1c]">{order.customerName}</p>
                  <p className="text-sm text-[#607369] flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {order.customerPhone}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-[#607369] mb-1">Endereço</p>
                  <p className="text-sm text-[#072a1c] flex items-start gap-1">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {order.customerAddress}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#eef3ec]">
                <p className="text-sm font-medium text-[#607369] mb-2">Itens</p>
                <div className="flex flex-wrap gap-2">
                  {order.items?.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-[#f7faf5] text-[#072a1c] text-sm rounded-full border border-[#dce4d7]">
                      {item.quantity}x {item.productName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredOrders?.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-[#8bc14a] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#072a1c]">Nenhum pedido encontrado</h3>
          <p className="text-[#607369]">Os pedidos aparecerão aqui quando os clientes fizerem compras</p>
        </div>
      )}
    </div>
  )
}
