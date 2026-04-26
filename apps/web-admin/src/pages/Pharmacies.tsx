import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {
  Store,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Plus,
  X,
  Key,
  Shield,
  Copy,
  User,
  RotateCcw,
  Navigation,
  CheckCircle2
} from 'lucide-react'
import { normalizeError } from '@/lib/errorHandler'

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/images/marker-icon-2x.png",
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
});

const markerIcon = new L.Icon({
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationMarker({
  position,
  onChange
}: {
  position: [number, number] | null;
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  if (!position) return null;
  return <Marker position={position} icon={markerIcon} />;
}

interface Pharmacy {
  id: number
  name: string
  email: string
  phone: string
  address: string
  status: 'pending' | 'active' | 'suspended' | 'rejected'
  createdAt: string
  documentUrl?: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  active: 'Ativa',
  suspended: 'Suspensa',
  rejected: 'Rejeitada',
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  active: CheckCircle,
  suspended: AlertCircle,
  rejected: XCircle,
}

export default function Pharmacies() {
  const [controlSection, setControlSection] = useState<'pharmacies' | 'clinics' | 'professionals' | 'insurers'>('pharmacies')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showCredsModal, setShowCredsModal] = useState(false)
  const [selectedPharmacyForCreds, setSelectedPharmacyForCreds] = useState<Pharmacy | null>(null)
  const [pharmacyAdminsList, setPharmacyAdminsList] = useState<any[]>([])
  const [loadingCreds, setLoadingCreds] = useState(false)
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)
  const queryClient = useQueryClient()

  const { data: pharmacies, isLoading } = useQuery<Pharmacy[]>({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/admin/pharmacies')
      if (!response.ok) throw new Error('Failed to fetch pharmacies')
      return response.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pharmacies/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update status')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] })
      toast.success('Status atualizado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(normalizeError(error))
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (data: Partial<Pharmacy>) => {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/admin/pharmacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Falha ao registrar farmácia')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] })
      toast.success('Farmácia registrada com sucesso!')
      setShowRegisterModal(false)
    },
    onError: (error: Error) => {
      toast.error(normalizeError(error))
    },
  })

  const fetchCredsMutation = useMutation({
    mutationFn: async (id: number) => {
      setLoadingCreds(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pharmacies/${id}/credentials`)
      if (!response.ok) throw new Error('Falha ao buscar credenciais')
      return response.json()
    },
    onSuccess: (data) => {
      setPharmacyAdminsList(data)
      setLoadingCreds(false)
    },
    onError: (error: any) => {
      toast.error(normalizeError(error))
      setLoadingCreds(false)
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ pharmacyId, adminId, newPassword }: { pharmacyId: number; adminId: number; newPassword?: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pharmacies/${pharmacyId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, newPassword }),
      })
      if (!response.ok) throw new Error('Falha ao redefinir senha')
      return response.json()
    },
    onSuccess: (data) => {
      toast.success(`Senha redefinida com sucesso! Nova senha: ${data.defaultPassword}`)
    },
    onError: (error: any) => {
      toast.error(normalizeError(error))
    }
  })

  const handleOpenCreds = (pharmacy: Pharmacy) => {
    setSelectedPharmacyForCreds(pharmacy)
    setShowCredsModal(true)
    fetchCredsMutation.mutate(pharmacy.id)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência')
  }

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: markerPosition ? `${markerPosition[0]}, ${markerPosition[1]}` : 'Luanda, Angola',
      lat: markerPosition ? markerPosition[0].toString() : '-8.8387',
      lng: markerPosition ? markerPosition[1].toString() : '13.2344',
      iban: formData.get('iban') as string || null,
      multicaixaExpress: formData.get('multicaixaExpress') as string || null,
      accountName: formData.get('accountName') as string || null,
    }
    registerMutation.mutate(data)
    setMarkerPosition(null)
  }

  const filteredPharmacies = pharmacies?.filter((pharmacy) => {
    const matchesSearch =
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || pharmacy.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Área de Controle</h1>
          <p className="text-gray-500">
            Registe e controle farmácias, clínicas, profissionais e seguradoras.
          </p>
        </div>
      </div>

      {/* Section switcher */}
      <div className="flex flex-wrap justify-center gap-2 bg-white border border-gray-100 rounded-xl p-2">
        {[
          { id: 'pharmacies' as const, label: 'Farmácias', icon: Store },
          { id: 'clinics' as const, label: 'Clínicas', icon: Shield },
          { id: 'professionals' as const, label: 'Profissionais', icon: User },
          { id: 'insurers' as const, label: 'Seguradoras', icon: Shield },
        ].map((item) => {
          const Icon = item.icon
          const active = controlSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setControlSection(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          )
        })}
      </div>

      {controlSection === 'pharmacies' && (
        <div>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Farmácia
          </button>
        </div>
      )}

      {controlSection !== 'pharmacies' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900">
            {controlSection === 'clinics'
              ? 'Clínicas'
              : controlSection === 'professionals'
                ? 'Profissionais'
                : 'Seguradoras'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Esta área está pronta para receber as telas de registo e gestão. Quando você quiser, eu crio as páginas e rotas reais aqui no admin.
          </p>
        </div>
      )}

      {controlSection === 'pharmacies' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar farmácia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendentes</option>
                <option value="active">Ativas</option>
                <option value="suspended">Suspensas</option>
                <option value="rejected">Rejeitadas</option>
              </select>
            </div>
          </div>

          {/* Pharmacy Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPharmacies?.map((pharmacy) => {
              const StatusIcon = statusIcons[pharmacy.status]
              return (
                <div key={pharmacy.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Store className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{pharmacy.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColors[pharmacy.status]}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusLabels[pharmacy.status]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenCreds(pharmacy)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver Credenciais"
                      >
                        <Key className="w-5 h-5" />
                      </button>
                      <Link
                        to={`/pharmacies/${pharmacy.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {pharmacy.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {pharmacy.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {pharmacy.address}
                    </div>
                  </div>

                  {pharmacy.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: pharmacy.id, status: 'active' })}
                        disabled={updateStatusMutation.isPending}
                        className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: pharmacy.id, status: 'rejected' })}
                        disabled={updateStatusMutation.isPending}
                        className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Rejeitar
                      </button>
                    </div>
                  )}

                  {pharmacy.status === 'active' && (
                    <div className="mt-4">
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: pharmacy.id, status: 'suspended' })}
                        disabled={updateStatusMutation.isPending}
                        className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Suspender
                      </button>
                    </div>
                  )}

                  {pharmacy.status === 'suspended' && (
                    <div className="mt-4">
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: pharmacy.id, status: 'active' })}
                        disabled={updateStatusMutation.isPending}
                        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Reativar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filteredPharmacies?.length === 0 && (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma farmácia encontrada</h3>
              <p className="text-gray-500">Tente ajustar os filtros de busca</p>
            </div>
          )}

          {/* Registration Modal */}
          {showRegisterModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                  <h2 className="text-xl font-bold text-gray-900">Registrar Nova Farmácia</h2>
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleRegister} className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nome da Farmácia *</label>
                    <input
                      required
                      name="name"
                      type="text"
                      placeholder="Ex: Farmácia Central de Luanda"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">E-mail Comercial *</label>
                      <input
                        required
                        name="email"
                        type="email"
                        placeholder="email@farmacia.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Telefone *</label>
                      <input
                        required
                        name="phone"
                        type="tel"
                        placeholder="+244 9XX XXX XXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-blue-600" />
                      <label className="text-sm font-semibold text-gray-700">Localização da Farmácia</label>
                    </div>

                    <div className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Clique no mapa para marcar a localização
                    </div>

                    <div className="rounded-lg overflow-hidden border-2 h-[200px]">
                      <MapContainer
                        center={markerPosition || [-8.8387, 13.2344]}
                        zoom={12}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={markerPosition} onChange={(lat, lng) => setMarkerPosition([lat, lng])} />
                      </MapContainer>
                    </div>

                    {markerPosition && markerPosition[0] !== undefined ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-green-700 font-semibold text-sm">Local Selecionado</p>
                          <p className="text-green-600 text-xs font-mono">
                            {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-amber-600 text-sm flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Selecione a localização no mapa acima
                      </p>
                    )}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <label className="text-sm font-semibold text-green-800">Dados para Pagamento</label>
                    </div>
                    <p className="text-xs text-green-600">Preencha pelo menos uma opção de pagamento</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-green-700">IBAN</label>
                        <input
                          name="iban"
                          type="text"
                          placeholder="AO06 0040 0000 1234 5678 9101 2"
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-green-700">Multicaixa Express</label>
                        <input
                          name="multicaixaExpress"
                          type="text"
                          placeholder="+244 9XX XXX XXX"
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-green-700">Nome Associado à Conta</label>
                      <input
                        name="accountName"
                        type="text"
                        placeholder="Nome da farmácia ou titular da conta"
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </form>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setShowRegisterModal(false); setMarkerPosition(null); }}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={registerMutation.isPending || !markerPosition}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registerMutation.isPending ? 'Registrando...' : 'Salvar Farmácia'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Credentials Modal */}
          {showCredsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Credenciais de Acesso</h2>
                      <p className="text-xs text-gray-500">{selectedPharmacyForCreds?.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCredsModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  {loadingCreds ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : pharmacyAdminsList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p>Nenhum administrador encontrado para esta farmácia.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pharmacyAdminsList.map((admin) => (
                        <div key={admin.id} className="p-4 border rounded-xl bg-gray-50 border-gray-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-bold text-gray-900">{admin.name}</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {admin.role}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-gray-400">Usuário/E-mail</span>
                              <span className="text-sm font-medium text-gray-700">{admin.email}</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(admin.email)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-col gap-2 p-2 bg-white rounded-lg border border-gray-100">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Nova Senha</span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Digite a nova senha"
                                className="flex-1 px-2 py-1 text-sm border rounded outline-none focus:ring-1 focus:ring-blue-500"
                                id={`pwd-${admin.id}`}
                              />
                              <button
                                onClick={() => {
                                  const input = document.getElementById(`pwd-${admin.id}`) as HTMLInputElement;
                                  if (!input.value) {
                                    toast.error("Digite uma senha");
                                    return;
                                  }
                                  resetPasswordMutation.mutate({
                                    pharmacyId: selectedPharmacyForCreds!.id,
                                    adminId: admin.id,
                                    newPassword: input.value
                                  });
                                  input.value = "";
                                }}
                                disabled={resetPasswordMutation.isPending}
                                className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                Alterar
                              </button>
                            </div>
                          </div>

                          <div className="pt-2 flex gap-2">
                            <button
                              onClick={() => resetPasswordMutation.mutate({
                                pharmacyId: selectedPharmacyForCreds!.id,
                                adminId: admin.id,
                                newPassword: "farm123"
                              })}
                              disabled={resetPasswordMutation.isPending}
                              className="flex-1 py-1 px-2 bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-lg hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                            >
                              <RotateCcw className="w-3 h-3" />
                              {resetPasswordMutation.isPending ? 'Redefinindo...' : 'Resetar para farm123'}
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <p className="text-[10px] text-amber-700 leading-relaxed">
                          <strong>Dica:</strong> Podes definir uma senha personalizada ou resetar para o padrão <strong>"farm123"</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setShowCredsModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
