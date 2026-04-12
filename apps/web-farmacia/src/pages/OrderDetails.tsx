import { useState } from 'react'
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
  Package,
  AlertCircle,
  CheckCircle,
  Eye,
  Lock
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
  isLocked?: boolean
  paymentProof?: string
  notes?: string
  pharmacyIban?: string
  pharmacyMulticaixaExpress?: string
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
  awaiting_proof: 'bg-amber-100 text-amber-800',
  proof_submitted: 'bg-blue-100 text-blue-800',
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
  awaiting_proof: 'Aguardando Comprovativo',
  proof_submitted: 'Comprovativo Enviado',
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
  awaiting_proof: 'preparing',
  proof_submitted: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
}

const statusActions: Record<string, { label: string; color: string }> = {
  pending: { label: 'Aceitar Pedido', color: 'bg-green-600 hover:bg-green-700' },
  accepted: { label: 'Iniciar Preparo', color: 'bg-purple-600 hover:bg-purple-700' },
  awaiting_proof: { label: 'Iniciar Preparo', color: 'bg-purple-600 hover:bg-purple-700' },
  proof_submitted: { label: 'Iniciar Preparo', color: 'bg-purple-600 hover:bg-purple-700' },
  preparing: { label: 'Marcar como Pronto', color: 'bg-indigo-600 hover:bg-indigo-700' },
  ready: { label: 'Saiu para Entrega', color: 'bg-orange-600 hover:bg-orange-700' },
  out_for_delivery: { label: 'Marcar como Entregue', color: 'bg-green-600 hover:bg-green-700' },
}

/** Multicaixa Express, transferência e ATM exigem comprovativo enviado pelo cliente */
const PAYMENT_METHODS_REQUIRING_PROOF = ['multicaixa_express', 'transferencia', 'atm'] as const

function paymentMethodRequiresProof(method: string): boolean {
  return (PAYMENT_METHODS_REQUIRING_PROOF as readonly string[]).includes(method)
}

function getProofDisplay(proof: string): { src: string; isPdf: boolean } {
  const lower = proof.toLowerCase()
  if (lower.startsWith('data:application/pdf')) {
    return { src: proof, isPdf: true }
  }
  if (proof.startsWith('http://') || proof.startsWith('https://')) {
    return { src: proof, isPdf: lower.endsWith('.pdf') || lower.includes('.pdf?') }
  }
  if (proof.startsWith('data:')) {
    return { src: proof, isPdf: lower.startsWith('data:application/pdf') }
  }
  return { src: `data:image/jpeg;base64,${proof}`, isPdf: false }
}

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [showProofModal, setShowProofModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState({
    iban: '',
    multicaixaExpress: ''
  })


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

  // Fetch pharmacy payment info
  const { data: paymentInfoData } = useQuery({
    queryKey: ['pharmacy-payment-info', user?.pharmacyId],
    queryFn: async () => {
      if (!user?.pharmacyId) return null
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pharmacies/${user.pharmacyId}/payment-info`)
      if (!response.ok) throw new Error('Failed to fetch payment info')
      return response.json()
    },
    enabled: !!user?.pharmacyId
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, paymentData }: { status: string; paymentData?: { iban?: string; multicaixaExpress?: string; paymentStatus?: string } }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pharmacy/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminId: user.id, ...paymentData }),
      })
      if (!response.ok) throw new Error('Failed to update status')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['pharmacy-orders'] })
      toast.success('Status atualizado!')
      setShowPaymentModal(false)
    },
    onError: () => {
      toast.error('Erro ao atualizar status')
    },
  })

  const handleAcceptOrder = () => {
    // If payment method is not cash and no payment info is set, show modal
    if (order.paymentMethod !== 'cash') {
      if (paymentInfoData?.hasIban || paymentInfoData?.hasMulticaixaExpress) {
        setPaymentInfo({
          iban: paymentInfoData.iban || '',
          multicaixaExpress: paymentInfoData.multicaixaExpress || ''
        })
      } else {
        setPaymentInfo({ iban: '', multicaixaExpress: '' })
      }
      setShowPaymentModal(true)
    } else {
      updateStatusMutation.mutate({ status: 'accepted' })
    }
  }

  const handleConfirmAccept = () => {
    // If electronic payment, status is "awaiting_proof", otherwise "accepted"
    const newStatus = order.paymentMethod !== 'cash' ? 'awaiting_proof' : 'accepted'
    updateStatusMutation.mutate({
      status: newStatus,
      paymentData: {
        iban: paymentInfo.iban || undefined,
        multicaixaExpress: paymentInfo.multicaixaExpress || undefined
      }
    })
  }

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
  const canReject = order.status === 'pending' && !order.isLocked
  
  // Bloquear avanço se pagamento não for "cash" e status for awaiting_proof ou proof_submitted
  const isElectronicPayment = order.paymentMethod !== 'cash'
  const isPendingProof = isElectronicPayment && (order.status === 'awaiting_proof' || order.status === 'proof_submitted')
  
  // Só pode avançar para "preparing" se não for pagamento pendente de comprovativo
  const canProceed = !isPendingProof
  
  // Pedido está bloqueado - não permite cancelamento ou edição
  const isOrderLocked = order.isLocked || false
  // Métodos de pagamento que bloqueiam o pedido
  const lockablePaymentMethods = ['multicaixa_express', 'transferencia', 'atm']
  const isDigitalPayment = lockablePaymentMethods.includes(order.paymentMethod)
  const requiresProofFromClient = paymentMethodRequiresProof(order.paymentMethod)
  const proofDisplay = order.paymentProof ? getProofDisplay(order.paymentProof) : null

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
          {/* Payment Status Warning */}
          {isPendingProof && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Pagamento Pendente</p>
                  <p className="text-sm text-amber-700 mt-1">
                    {order.status === 'awaiting_proof' ? (
                      <>
                        O cliente ainda não enviou o comprovativo de pagamento. O pedido só avançará após análise do comprovativo.
                      </>
                    ) : (
                      <>
                        O cliente enviou o comprovativo. Analise e confirme ou recuse.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Locked Order Warning */}
          {isOrderLocked && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800 flex items-center gap-2">
                    <span>🔒 Transação Garantida - MCX</span>
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Este pedido foi bloqueado porque o pagamento foi processado via {order.paymentMethod === 'multicaixa_express' ? 'Multicaixa Express' : order.paymentMethod === 'transferencia' ? 'Transferência Bancária' : 'ATM'}. 
                    O pedido não pode ser cancelado ou modificado para proteger o saldo do cliente.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Proof Verification Actions */}
          {order.status === 'proof_submitted' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analisar Comprovativo</h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    updateStatusMutation.mutate({ 
                      status: 'preparing',
                      paymentData: { paymentStatus: 'paid' }
                    })
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirmar Pagamento
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ status: 'awaiting_proof' })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Recusar Comprovativo
                </button>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-500 ${isOrderLocked ? 'opacity-60' : ''}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações</h2>
            <div className="space-y-3">
              {!isOrderLocked && action && order.status !== 'proof_submitted' && (
                <button
                  onClick={() => order.status === 'pending' ? handleAcceptOrder() : updateStatusMutation.mutate({ status: nextStatusMap[order.status] })}
                  disabled={updateStatusMutation.isPending || !canProceed}
                  className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${canProceed ? action.color : 'bg-gray-400 cursor-not-allowed'}`}
                  title={!canProceed ? 'Aguarde confirmação do pagamento' : ''}
                >
                  {action.label}
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => updateStatusMutation.mutate({ status: 'rejected' })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Rejeitar Pedido
                </button>
              )}
              {isOrderLocked && (
                <div className="py-3 px-4 bg-gray-100 text-gray-600 font-medium rounded-lg text-center flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  Pedido Bloqueado - Em Processamento
                </div>
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
                <span className="text-gray-900 capitalize">
                  {order.paymentMethod === 'cash' ? 'Pagamento na Entrega' : 
                   order.paymentMethod === 'multicaixa_express' ? 'Multicaixa Express' : 
                   order.paymentMethod === 'transferencia' ? 'Transferência Bancária' : 
                   order.paymentMethod}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">
                  {new Date(order.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              
              {/* Comprovativo: Express / Transferência / ATM — aguardar envio; depois pode ver */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {requiresProofFromClient ? (
                  !order.paymentProof ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Aguardando comprovativo</p>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                          Este pagamento exige comprovativo (Multicaixa Express ou transferência). O cliente envia o comprovativo na app; quando for enviado, poderá visualizá-lo aqui e confirmar na secção &quot;Analisar Comprovativo&quot;.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Comprovativo recebido</p>
                      <button
                        type="button"
                        onClick={() => setShowProofModal(true)}
                        className="w-full py-2 px-4 bg-[#eef7e8] hover:bg-[#dcefd0] text-[#072a1c] font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-[#dce4d7]"
                      >
                        <Eye className="w-4 h-4" />
                        Ver comprovativo
                      </button>
                    </div>
                  )
                ) : (
                  order.paymentProof && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Comprovativo</p>
                      <button
                        type="button"
                        onClick={() => setShowProofModal(true)}
                        className="w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver comprovativo
                      </button>
                    </div>
                  )
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  {order.paymentStatus === 'paid' || isOrderLocked ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700">
                        {isOrderLocked ? 'Pagamento Garantido (Bloqueado)' : 'Pagamento Confirmado'}
                      </span>
                    </>
                  ) : requiresProofFromClient ? (
                    !order.paymentProof ? (
                      <>
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-amber-800">Aguardando envio do comprovativo</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          {order.status === 'proof_submitted'
                            ? 'Comprovativo enviado — analise acima ou na secção Analisar Comprovativo'
                            : 'Comprovativo disponível — aguarde análise'}
                        </span>
                      </>
                    )
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span className="font-medium text-amber-700">Aguardando Pagamento</span>
                    </>
                  )}
                </div>
                {/* Confirmar manualmente só para métodos que não dependem de comprovativo do cliente neste fluxo */}
                {order.paymentStatus !== 'paid' && !isOrderLocked && !requiresProofFromClient && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pharmacy/orders/${order.id}/mark-paid`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminId: user?.id }),
                        });
                        if (response.ok) {
                          toast.success('Pagamento confirmado!');
                          queryClient.invalidateQueries({ queryKey: ['order', id] });
                        } else {
                          toast.error('Erro ao confirmar pagamento');
                        }
                      } catch (error) {
                        toast.error('Erro ao confirmar pagamento');
                      }
                    }}
                    className="w-full py-2 px-4 bg-[#072a1c] hover:bg-[#0a3a26] text-[#b5f176] font-medium rounded-lg transition-colors"
                  >
                    Confirmar Pagamento
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Info Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informação de Pagamento</h3>
            <p className="text-sm text-gray-600 mb-4">
              Forneça os dados para receber o pagamento eletrónico:
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                <input
                  type="text"
                  value={paymentInfo.iban}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, iban: e.target.value })}
                  placeholder="AO06 0040 0001 1234 5678 9101 4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Multicaixa Express</label>
                <input
                  type="text"
                  value={paymentInfo.multicaixaExpress}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, multicaixaExpress: e.target.value })}
                  placeholder="+244 923 456 789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAccept}
                disabled={updateStatusMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'A processar...' : 'Aceitar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {showProofModal && proofDisplay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Comprovativo de Pagamento</h3>
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex justify-center">
              {proofDisplay.isPdf ? (
                <iframe
                  src={proofDisplay.src}
                  className="w-full h-96 rounded-lg border border-gray-200"
                  title="Comprovativo PDF"
                />
              ) : (
                <img
                  src={proofDisplay.src}
                  alt="Comprovativo de pagamento"
                  className="max-w-full max-h-[70vh] rounded-lg object-contain border border-gray-200"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
