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
  Package
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
  createdAt: string
  items: Array<{
    productName: string
    quantity: number
    unitPrice: string
  }>
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
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
  pending: { label: 'Aceitar Pedido', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
  accepted: { label: 'Iniciar Preparo', icon: Package, color: 'bg-purple-600 hover:bg-purple-700' },
  preparing: { label: 'Pronto para Entrega', icon: CheckCircle, color: 'bg-indigo-600 hover:bg-indigo-700' },
  ready: { label: 'Saiu para Entrega', icon: MapPin, color: 'bg-orange-600 hover:bg-orange-700' },
  out_for_delivery: { label: 'Marcar Entregue', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
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
  const response = await fetch(`/api/pharmacy/${user.pharmacyId}/orders`)
  if (!response.ok) throw new Error('Failed to fetch orders')
  return response.json()
   },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`/api/pharmacy/orders/${orderId}/status`, {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500">Gerencie os pedidos da sua farmácia</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
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
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Pedido #{order.id}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {Number(order.total).toLocaleString('pt-AO', {
                        style: 'currency',
                        currency: 'AOA'
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {action && (
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
                  {order.status === 'pending' && (
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
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Cliente</p>
                  <p className="text-sm text-gray-900">{order.customerName}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {order.customerPhone}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Endereço</p>
                  <p className="text-sm text-gray-900 flex items-start gap-1">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {order.customerAddress}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Itens</p>
                <div className="flex flex-wrap gap-2">
                  {order.items?.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
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
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum pedido encontrado</h3>
          <p className="text-gray-500">Os pedidos aparecerão aqui quando os clientes fizerem compras</p>
        </div>
      )}
    </div>
  )
}
