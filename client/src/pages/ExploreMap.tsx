import { useState, useEffect, useMemo } from "react";
import { Phone, MapPin, Clock, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  hours?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
}

const pharmacyMarkerIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMC41IiBjeT0iMjAuNSIgcj0iMjAuNSIgZmlsbD0iIzhCQzE0QSIvPjxwYXRoIGQ9Ik0yMCAxMFYzME0xMCAyMEgzMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [32, 41],
  iconAnchor: [16, 41],
  popupAnchor: [0, -34],
  shadowSize: [41, 41]
})

function MapAutoZoom({ pharmacies }: { pharmacies: Pharmacy[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || pharmacies.length === 0) return
    try {
      const validCoordinates = pharmacies
        .map(p => {
          const lat = p.latitude ?? p.lat
          const lng = p.longitude ?? p.lng
          if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
            return [lat, lng] as [number, number]
          }
          return null
        })
        .filter((coord): coord is [number, number] => coord !== null)

      if (validCoordinates.length > 0) {
        const bounds = L.latLngBounds(validCoordinates)
        if (bounds.isValid()) {
          const sw = bounds.getSouthWest()
          const ne = bounds.getNorthEast()
          if (sw.lat === ne.lat && sw.lng === ne.lng) {
            map.setView(sw, 14)
          } else {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
          }
        }
      }
    } catch (error) {
      console.error("Error in MapAutoZoom:", error)
      map.setView([-8.85, 13.25], 12)
    }
  }, [pharmacies, map])

  return null
}

function isPharmacyActive(status: string): boolean {
  return status === 'active' || status === 'open'
}

export default function ExploreMap() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)

  useEffect(() => {
    fetchPharmacies()
  }, [])

  const fetchPharmacies = async () => {
    try {
      const response = await fetch('/api/pharmacy/list')
      if (response.ok) {
        const data = await response.json()
        setPharmacies(data)
      }
    } catch (error) {
      console.error("Error fetching pharmacies:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full relative">
      {/* Back Button */}
      <button
        onClick={() => window.location.href = "/menu-de-configuracoes"}
        className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-full shadow-lg hover:bg-slate-50 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700" />
      </button>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-4 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-semibold text-slate-800">Carregando farmácias...</p>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer center={[-8.85, 13.25]} zoom={12} className="w-full h-full" style={{ zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapAutoZoom pharmacies={pharmacies} />
        
        {pharmacies.map((pharmacy) => {
          const lat = parseFloat(String(pharmacy.latitude || pharmacy.lat || -8.85))
          const lng = parseFloat(String(pharmacy.longitude || pharmacy.lng || 13.25))
          
          return (
            <Marker 
              key={pharmacy.id} 
              position={[lat, lng]}
              icon={pharmacyMarkerIcon}
              eventHandlers={{
                click: () => setSelectedPharmacy(pharmacy)
              }}
            >
              <Popup>
                <div className="text-xs p-2 min-w-48">
                  <p className="font-bold text-sm mb-2 text-slate-800">{pharmacy.name}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Phone className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-600" />
                      <p className="text-slate-600">{pharmacy.phone}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-600" />
                      <p className="text-slate-600 line-clamp-2">{pharmacy.address}</p>
                    </div>
                    {pharmacy.hours && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-600" />
                        <p className="text-slate-600">{pharmacy.hours}</p>
                      </div>
                    )}
                  </div>
                  {isPharmacyActive(pharmacy.status) && (
                    <div className="mt-3 px-2 py-1 rounded bg-green-100 text-center">
                      <p className="text-xs font-bold text-green-600">✓ Ativa</p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Selected Pharmacy Card */}
      <AnimatePresence>
        {selectedPharmacy && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-24 left-4 right-4 z-20 bg-white rounded-2xl shadow-xl p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800">{selectedPharmacy.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedPharmacy.address}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Phone size={14} /> {selectedPharmacy.phone}
                  </span>
                  {isPharmacyActive(selectedPharmacy.status) && (
                    <span className="text-green-600 font-medium">✓ Aberta</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedPharmacy(null)}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <span className="text-slate-400">✕</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
