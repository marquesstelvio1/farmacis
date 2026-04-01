import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle
} from 'lucide-react'

interface Prescription {
  id: number
  orderId: number
  productId: number
  userId?: number
  imageUrl: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  createdAt: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
}

export default function Prescriptions() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ['pharmacy-prescriptions', user?.pharmacyId],
    queryFn: async () => {
      if (!user?.pharmacyId) throw new Error('Pharmacy ID not found')
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/pharmacy/${user.pharmacyId}/prescriptions`)
      if (!response.ok) throw new Error('Failed to fetch prescriptions')
      return response.json()
    },
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ prescriptionId, status, rejectionReason }: { prescriptionId: number; status: 'approved' | 'rejected'; rejectionReason?: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/prescriptions/${prescriptionId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          rejectionReason,
          reviewedBy: user?.id,
        }),
      })
      if (!response.ok) throw new Error('Failed to review prescription')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-prescriptions'] })
      setSelectedPrescription(null)
      setRejectionReason('')
      toast.success('Prescrição analisada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao analisar prescrição')
    },
  })

  const filteredPrescriptions = prescriptions?.filter((p) => {
    const matchesSearch = p.orderId.toString().includes(searchTerm) || p.id.toString().includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = prescriptions?.filter(p => p.status === 'pending').length || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receitas Médicas</h1>
          <p className="text-gray-500 dark:text-slate-400">Analise e aprove as receitas dos clientes</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 rounded-lg">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID do pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovadas</option>
            <option value="rejected">Rejeitadas</option>
          </select>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {filteredPrescriptions?.map((prescription) => (
          <div key={prescription.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  prescription.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-500/15' :
                  prescription.status === 'approved' ? 'bg-green-100 dark:bg-green-500/15' : 'bg-red-100 dark:bg-red-500/15'
                }`}>
                  <FileText className={`w-7 h-7 ${
                    prescription.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                    prescription.status === 'approved' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Receita #{prescription.id}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[prescription.status]}`}>
                      {statusLabels[prescription.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Pedido #{prescription.orderId} • {new Date(prescription.createdAt).toLocaleString('pt-BR')}
                  </p>
                  {prescription.rejectionReason && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {prescription.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPrescription(prescription)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
                {prescription.status === 'pending' && (
                  <>
                    <button
                      onClick={() => reviewMutation.mutate({ prescriptionId: prescription.id, status: 'approved' })}
                      disabled={reviewMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPrescription(prescription)
                        setRejectionReason('')
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Recusar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPrescriptions?.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhuma receita encontrada</h3>
          <p className="text-gray-500">As receitas aparecerão aqui quando os clientes enviarem</p>
        </div>
      )}

      {/* Prescription Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Receita #{selectedPrescription.id}</h2>
                  <p className="text-xs text-gray-500">Pedido #{selectedPrescription.orderId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrescription(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <img
                src={selectedPrescription.imageUrl}
                alt="Receita médica"
                className="w-full max-h-[60vh] object-contain rounded-xl border border-gray-200 bg-gray-50"
              />

              {selectedPrescription.status === 'pending' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => reviewMutation.mutate({ prescriptionId: selectedPrescription.id, status: 'approved' })}
                    disabled={reviewMutation.isPending}
                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Aprovar Receita
                  </button>
                </div>
              )}

              {selectedPrescription.status === 'pending' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <XCircle className="w-4 h-4 inline mr-1 text-red-500" />
                    Recusar Receita
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Motivo da recusa (obrigatório)..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                    rows={3}
                  />
                  <button
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        toast.error('Por favor, informe o motivo da recusa')
                        return
                      }
                      reviewMutation.mutate({
                        prescriptionId: selectedPrescription.id,
                        status: 'rejected',
                        rejectionReason,
                      })
                    }}
                    disabled={reviewMutation.isPending || !rejectionReason.trim()}
                    className="mt-3 w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Recusar
                  </button>
                </div>
              )}

              {selectedPrescription.status === 'approved' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Esta receita foi aprovada</span>
                  </div>
                </div>
              )}

              {selectedPrescription.status === 'rejected' && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <XCircle className="w-5 h-5" />
                    <span className="font-semibold">Esta receita foi recusada</span>
                  </div>
                  <p className="text-sm text-red-600">{selectedPrescription.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
