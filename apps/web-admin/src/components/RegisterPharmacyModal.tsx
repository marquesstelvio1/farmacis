import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { X, MapPin, Navigation, CheckCircle2, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatIBAN(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const groups = cleaned.match(/.{1,4}/g)
  return groups ? groups.join(' ') : cleaned
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('244')) {
    const parts = []
    if (digits.length > 0) parts.push('+' + digits.slice(0, 3))
    if (digits.length > 3) parts.push(digits.slice(3, 6))
    if (digits.length > 6) parts.push(digits.slice(6, 9))
    if (digits.length > 9) parts.push(digits.slice(9, 12))
    return parts.join(' ')
  } else if (digits.startsWith('9')) {
    const parts = []
    if (digits.length > 0) parts.push(digits.slice(0, 3))
    if (digits.length > 3) parts.push(digits.slice(3, 6))
    if (digits.length > 6) parts.push(digits.slice(6, 9))
    return parts.join(' ')
  }
  return digits
}

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

interface RegisterPharmacyModalProps {
  onClose: () => void
  onRegister: (data: any) => Promise<void>
}

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

export default function RegisterPharmacyModal({ onClose, onRegister }: RegisterPharmacyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    lat: -8.8387,
    lng: 13.2344,
    description: '',
    iban: '',
    multicaixaExpress: '',
    accountName: '',
  })
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)

  const hasLocation = markerPosition !== null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onRegister({
      ...formData,
      lat: markerPosition ? markerPosition[0].toString() : formData.lat.toString(),
      lng: markerPosition ? markerPosition[1].toString() : formData.lng.toString(),
    })
  }

  const handleMapClick = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl bg-white max-h-[95vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
          <CardTitle>Registrar Nova Farmácia</CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </CardHeader>
        
        <CardContent className="p-4 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Farmácia</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: formatPhoneNumber(e.target.value)})}
                  placeholder="+244 9XX XXX XXX"
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, address: e.target.value})}
                  placeholder="Rua, número, bairro..."
                  required
                />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-green-600" />
                <Label className="text-green-800 font-semibold">Dados de Pagamento (Para Transferências)</Label>
              </div>
              <p className="text-sm text-green-600 mb-3">
                Estes dados serão mostrados aos clientes para efectuarem pagamentos
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="iban">IBAN da Farmácia</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, iban: formatIBAN(e.target.value)})}
                    placeholder="AO06 0040 0000 1234 5678 9012 3"
                  />
                </div>
                <div>
                  <Label htmlFor="multicaixaExpress">Número Multicaixa Express</Label>
                  <Input
                    id="multicaixaExpress"
                    value={formData.multicaixaExpress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, multicaixaExpress: formatPhoneNumber(e.target.value)})}
                    placeholder="+244 9XX XXX XXX"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="accountName">Nome Associado à Conta</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, accountName: e.target.value})}
                    placeholder="Nome da farmácia ou titular da conta"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-5 h-5 text-blue-600" />
                <Label className="text-blue-800 font-semibold">Localização da Farmácia</Label>
              </div>

              <div className="text-sm text-blue-600 mb-3 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Clique no mapa para marcar a localização
              </div>

              <div className="rounded-lg overflow-hidden border-2 h-[300px]">
                <MapContainer
                  center={markerPosition || [formData.lat, formData.lng]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker position={markerPosition} onChange={handleMapClick} />
                </MapContainer>
              </div>

              {markerPosition ? (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-green-700 font-semibold text-sm">Local Selecionado</p>
                    <p className="text-green-600 text-xs font-mono">
                      {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-amber-600 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Selecione a localização no mapa acima
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={!hasLocation}>
                Registrar Farmácia
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
