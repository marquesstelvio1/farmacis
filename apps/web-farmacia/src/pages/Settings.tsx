import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Store, MapPin, Phone, Mail, Save, CheckCircle } from 'lucide-react'
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

export default function Settings() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)
  const [formData, setFormData] = useState({
    name: user?.pharmacyName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    description: '',
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
        })
        .catch(console.error)
    }
  }, [user?.pharmacyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/pharmacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lat: markerPosition?.[0],
          lng: markerPosition?.[1],
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
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Rua, número, bairro..."
                />
              </div>
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
