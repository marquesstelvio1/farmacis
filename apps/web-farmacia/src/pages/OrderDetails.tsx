import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Clock,
  CreditCard,
  Package
} from 'lucide-react'

interface OrderDetails {
  id: number
  customerName: string
  customerPhone: string
  customerAddress: string
  customerLat?: number
  customerLng?: number
  total: string
  deliveryFee: string
  status: string
  paymentMethod: string
  paymentStatus: string
  notes?: string
  createdAt: string
  items: Array<{
    productName: string
    quantity: number
    unitPrice: string
    totalPrice: string
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

const statusActions: Record<string, { label: string; color: string }> = {
  pending: { label: 'Aceitar Pedido', color: 'bg-green-600 hover:bg-green-700' },
  accepted: { label: 'Iniciar Preparo', color: 'bg-purple-600 hover:bg-purple-700' },
  preparing: { label: 'Marcar como Pronto', color: 'bg-indigo-600 hover:bg-indigo-700' },
  ready: { label: 'Saiu para Entrega', color: 'bg-orange-600 hover:bg-orange-700' },
  out_for_delivery: { label: 'Marcar como Entregue', color: 'bg-green-600 hover:bg-green-700' },
}

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Faça login para acessar os detalhes do pedido.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Fazer Login
          </button>
        </div>
      </div>
    )
  }

  const { data: order, isLoading } = useQuery<OrderDetails>({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pharmacy/orders/${id}`)
      if (!response.ok) throw new Error('Failed to fetch order')
      return response.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pharmacy/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminId: user.id }),
      })
      if (!response.ok) throw new Error('Failed to update status')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] })
      toast.success('Status atualizado!')
    },
    onError: () => {
      toast.error('Erro ao atualizar status')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Pedido não encontrado</h3>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 text-green-600 hover:text-green-700"
        >
          Voltar para pedidos
        </button>
      </div>
    )
  }

  const action = statusActions[order.status]
  const canReject = order.status === 'pending'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.id}</h1>
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
            {statusLabels[order.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Cliente</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium text-gray-900">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium text-gray-900">{order.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Endereço de Entrega</p>
                  <p className="font-medium text-gray-900">{order.customerAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h2>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-500">{item.quantity}x unidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {Number(item.totalPrice).toLocaleString('pt-AO', {
                        style: 'currency',
                        currency: 'AOA'
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {Number(item.unitPrice).toLocaleString('pt-AO', {
                        style: 'currency',
                        currency: 'AOA'
                      })} cada
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações</h2>
            <div className="space-y-3">
              {action && (
                <button
                  onClick={() => updateStatusMutation.mutate(nextStatusMap[order.status])}
                  disabled={updateStatusMutation.isPending}
                  className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
                >
                  {action.label}
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => updateStatusMutation.mutate('rejected')}
                  disabled={updateStatusMutation.isPending}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Rejeitar Pedido
                </button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  {Number(Number(order.total) - Number(order.deliveryFee)).toLocaleString('pt-AO', {
                    style: 'currency',
                    currency: 'AOA'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Taxa de Entrega</span>
                <span className="font-medium">
                  {Number(order.deliveryFee).toLocaleString('pt-AO', {
                    style: 'currency',
                    currency: 'AOA'
                  })}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {Number(order.total).toLocaleString('pt-AO', {
                    style: 'currency',
                    currency: 'AOA'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pagamento</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">
                  {new Date(order.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
