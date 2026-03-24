import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  FileText,
  ExternalLink
} from 'lucide-react'

interface PharmacyDetails {
  id: number
  name: string
  email: string
  phone: string
  address: string
  lat: number
  lng: number
  status: string
  description?: string
  logoUrl?: string
  documentUrl?: string
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  createdAt: string
  ordersCount: number
  totalRevenue: string
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  active: 'Ativa',
  suspended: 'Suspensa',
  rejected: 'Rejeitada',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
}

const weekDays: Record<string, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export default function PharmacyDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: pharmacy, isLoading } = useQuery<PharmacyDetails>({
    queryKey: ['pharmacy', id],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pharmacies/${id}`)
      if (!response.ok) throw new Error('Failed to fetch pharmacy')
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Farmácia não encontrada</h3>
        <button
          onClick={() => navigate('/pharmacies')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Voltar para lista
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/pharmacies')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pharmacy.name}</h1>
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColors[pharmacy.status]}`}>
            {statusLabels[pharmacy.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{pharmacy.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium text-gray-900">{pharmacy.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Endereço</p>
                  <p className="font-medium text-gray-900">{pharmacy.address}</p>
                </div>
              </div>
            </div>
            {pharmacy.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Descrição</p>
                <p className="text-gray-900">{pharmacy.description}</p>
              </div>
            )}
          </div>

          {/* Opening Hours */}
          {pharmacy.openingHours && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Horário de Funcionamento</h2>
              <div className="space-y-2">
                {Object.entries(pharmacy.openingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-700">{weekDays[day]}</span>
                    {hours.closed ? (
                      <span className="text-red-600 font-medium">Fechado</span>
                    ) : (
                      <span className="text-gray-900">{hours.open} - {hours.close}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {pharmacy.documentUrl && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos</h2>
              <a
                href={pharmacy.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="p-2 bg-red-100 rounded-lg">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Documento de Registro</p>
                  <p className="text-sm text-gray-500">Clique para visualizar</p>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Total de Pedidos</p>
                <p className="text-2xl font-bold text-blue-900">{pharmacy.ordersCount}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Receita Total</p>
                <p className="text-2xl font-bold text-green-900">
                  {Number(pharmacy.totalRevenue).toLocaleString('pt-AO', {
                    style: 'currency',
                    currency: 'AOA'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Registration Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações de Registro</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Cadastrado em:</span>
                <span className="text-gray-900">
                  {new Date(pharmacy.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
