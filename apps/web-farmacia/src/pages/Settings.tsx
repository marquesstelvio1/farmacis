import { useState, useEffect, useCallback, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { Store, MapPin, Phone, Mail, Save, CheckCircle, Building2, Search, Upload, X, CreditCard } from 'lucide-react'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { toast } from 'sonner'

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function formatIBAN(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')
  // Limit to 21 digits (after AO06)
  const limited = digits.slice(0, 21)
  // Group by 4 characters
  const groups = limited.match(/.{1,4}/g)
  return groups ? groups.join(' ') : limited
}

function LocationMarker({
  position,
  onChange,
  onReverseGeocode
}: {
  position: [number, number] | null;
  onChange: (lat: number, lng: number) => void;
  onReverseGeocode?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
      onReverseGeocode?.(e.latlng.lat, e.latlng.lng);
    },
  });
  if (!position) return null;
  return <Marker position={position} icon={markerIcon} />;
}

export default function Settings() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string, lat: string, lon: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [reverseGeocodedAddress, setReverseGeocodedAddress] = useState('')
  const [formData, setFormData] = useState({
    name: user?.pharmacyName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    description: '',
    logoUrl: '',
    iban: '',
    multicaixaExpress: '',
    accountName: '',
  })

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB.')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas.')
        return
      }
      setSelectedImage(file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      // Upload automático
      uploadImageMutation.mutate(file)
    }
  }

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload/pharmacy-logo`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload image')
      return response.json()
    },
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, logoUrl: data.url }))
      toast.success('Logo enviado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao fazer upload da imagem')
    }
  })

  useEffect(() => {
    if (user?.pharmacyId) {
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/pharmacies/${user.pharmacyId}`)
        .then(res => res.json())
        .then(data => {
          if (data.lat && data.lng) {
            setMarkerPosition([parseFloat(data.lat), parseFloat(data.lng)])
          }
          if (data.address) {
            setFormData(prev => ({ ...prev, address: data.address }))
          }
          if (data.phone) {
            setFormData(prev => ({ ...prev, phone: data.phone }))
          }
          if (data.description) {
            setFormData(prev => ({ ...prev, description: data.description }))
          }
          if (data.logoUrl) {
            setFormData(prev => ({ ...prev, logoUrl: data.logoUrl }))
          }
          if (data.iban) {
            setFormData(prev => ({ ...prev, iban: data.iban.replace('AO06', '').replace(/\s/g, '') }))
          }
          if (data.multicaixaExpress) {
            setFormData(prev => ({ ...prev, multicaixaExpress: data.multicaixaExpress.replace('+244', '').replace(/\s/g, '') }))
          }
          if (data.accountName) {
            setFormData(prev => ({ ...prev, accountName: data.accountName }))
          }
        })

        .catch(console.error)
    }
  }, [user?.pharmacyId])

  // Search for locations using Nominatim API
  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ao&limit=5`
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Error searching locations:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const data = await response.json()
      if (data.display_name) {
        setReverseGeocodedAddress(data.display_name)
        setFormData(prev => ({ ...prev, address: data.display_name }))
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocations(searchQuery)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, searchLocations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/pharmacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pharmacyId: user?.pharmacyId,
          lat: markerPosition?.[0],
          lng: markerPosition?.[1],
          iban: formData.iban ? `AO06 ${formData.iban}` : null,
          multicaixaExpress: formData.multicaixaExpress ? `+244 ${formData.multicaixaExpress}` : null,
        }),
      })


      if (response.ok) {
        toast.success('Configurações salvas com sucesso!')
      } else {
        toast.error('Erro ao salvar configurações')
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">Gerencie as informações da sua farmácia</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Farmácia
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço (texto)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery || formData.address}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Pesquise e selecione o endereço..."
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, address: result.display_name }))
                        setSearchQuery(result.display_name)
                        setMarkerPosition([parseFloat(result.lat), parseFloat(result.lon)])
                        setSearchResults([])
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-sm"
                    >
                      <Search className="inline w-4 h-4 mr-2 text-gray-400" />
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              placeholder="Descreva sua farmácia..."
            />
          </div>

          {/* Logo da Farmácia */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo da Farmácia (aparece no app do cliente)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {imagePreview || formData.logoUrl ? (
              <div className="relative w-full max-w-xs aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imagePreview || formData.logoUrl}
                  alt="Logo da farmácia"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview(null)
                    setFormData(prev => ({ ...prev, logoUrl: '' }))
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded-full shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xs aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">Clique para enviar logo</span>
                <span className="text-xs text-gray-400">Máx. 5MB</span>
              </button>
            )}

            <p className="text-xs text-gray-500 mt-2">
              Esta imagem será exibida no aplicativo do cliente
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Dados de Pagamento</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                IBAN (17 dígitos após AO06)
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm font-mono text-gray-500">
                  AO06
                </span>
                <input
                  type="text"
                  maxLength={17}
                  value={formData.iban}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 17)
                    setFormData({ ...formData, iban: val })
                  }}
                  placeholder="0000 0000 0000 0000 0"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono"
                />
              </div>
              <p className="text-[10px] text-gray-400">Insira apenas os 17 algarismos que seguem o prefixo AO06</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Multicaixa Express (9 dígitos)
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm font-mono text-gray-500">
                  +244
                </span>
                <input
                  type="text"
                  maxLength={9}
                  value={formData.multicaixaExpress}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9)
                    setFormData({ ...formData, multicaixaExpress: val })
                  }}
                  placeholder="9XX XXX XXX"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nome do Titular da Conta (IBAN)
              </label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="Nome completo do titular da conta bancária"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>


        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Localização no Mapa</h2>
          <p className="text-sm text-gray-500 mb-4">
            Clique no mapa para marcar a localização da sua farmácia
          </p>

          <div className="rounded-lg overflow-hidden border border-gray-200 h-[300px]">
            <MapContainer
              center={markerPosition || [-8.8387, 13.2344]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker
                position={markerPosition}
                onChange={(lat, lng) => setMarkerPosition([lat, lng])}
                onReverseGeocode={reverseGeocode}
              />
            </MapContainer>
          </div>

          {markerPosition ? (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-green-700 font-semibold text-sm">Localização Selecionada</p>
                <p className="text-green-600 text-xs font-mono">
                  {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-amber-600 text-sm flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Clique no mapa para selecionar a localização
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
