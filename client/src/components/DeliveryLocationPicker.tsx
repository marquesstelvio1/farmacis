import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, MapPin, Navigation, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/images/marker-icon-2x.png",
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
});

const markerIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52"><path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 32 20 32s20-18 20-32C40 8.954 31.046 0 20 0z" fill="#EF4444" stroke="white" stroke-width="2"/><circle cx="20" cy="18" r="8" fill="white"/></svg>`),
  iconSize: [40, 52],
  iconAnchor: [20, 52],
  popupAnchor: [0, -52],
});

const pharmacyIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56"><circle cx="24" cy="22" r="20" fill="#3B82F6" stroke="white" stroke-width="3"/><circle cx="24" cy="22" r="14" fill="white"/><text x="24" y="27" text-anchor="middle" font-size="16" font-weight="bold" fill="#3B82F6">+</text></svg>`),
  iconSize: [48, 56],
  iconAnchor: [24, 56],
  popupAnchor: [0, -56],
});

const userMarkerIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52"><path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 32 20 32s20-18 20-32C40 8.954 31.046 0 20 0z" fill="#22C55E" stroke="white" stroke-width="2"/><circle cx="20" cy="18" r="8" fill="white"/></svg>`),
  iconSize: [40, 52],
  iconAnchor: [20, 52],
  popupAnchor: [0, -52],
});

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  lat: string;
  lng: string;
}

interface DeliveryLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number | null;
  initialLng?: number | null;
}

// Componente auxiliar para centralizar o mapa automaticamente
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 16);
  return null;
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

export function DeliveryLocationPicker({ 
  isOpen, 
  onClose, 
  onSelect,
  initialLat,
  initialLng 
}: DeliveryLocationPickerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  
  // Estados para Autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteAbortRef = useRef<AbortController | null>(null);
  const latestAutocompleteQueryRef = useRef("");

  useEffect(() => {
    if (initialLat && initialLng) {
      setMarkerPosition([initialLat, initialLng]);
      setAddress("");
    }
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (isOpen) {
      fetchPharmacies();
    }
  }, [isOpen]);

  const fetchPharmacies = async () => {
    setLoadingPharmacies(true);
    try {
      const response = await fetch("/api/pharmacies");
      if (response.ok) {
        const data = await response.json();
        const activePharmacies = Array.isArray(data) ? data : data?.pharmacies || [];
        setPharmacies(activePharmacies.filter((p: Pharmacy) => p.lat && p.lng));
      }
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
    }
    setLoadingPharmacies(false);
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (markerPosition) {
      onSelect(markerPosition[0], markerPosition[1], address);
      onClose();
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    reverseGeocode(lat, lng);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const fetchSuggestions = async (query: string) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    latestAutocompleteQueryRef.current = normalizedQuery;
    if (autocompleteAbortRef.current) autocompleteAbortRef.current.abort();
    autocompleteAbortRef.current = new AbortController();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(normalizedQuery)}&limit=6&accept-language=pt&countrycodes=ao&addressdetails=1`,
        { signal: autocompleteAbortRef.current.signal }
      );

      if (!response.ok) {
        throw new Error("Falha ao obter sugestoes");
      }

      const data = await response.json();
      // Evita race condition quando respostas antigas chegam depois.
      if (latestAutocompleteQueryRef.current !== normalizedQuery) return;
      setSuggestions(Array.isArray(data) ? data : []);
      setShowSuggestions(true);
      setActiveSuggestionIndex(-1);
    } catch (error) {
      if ((error as any)?.name !== "AbortError") {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
        setShowSuggestions(true);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    setActiveSuggestionIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 500);
  };

  const handleSelectSuggestion = (s: any) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    setMarkerPosition([lat, lon]);
    setAddress(s.display_name);
    setSearchQuery(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (activeSuggestionIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt`
      );
      const data = await response.json();
      if (data.display_name) {
        const parts = data.display_name.split(", ");
        const shortAddress = parts.slice(0, 3).join(", ");
        setAddress(shortAddress);
        setSearchQuery(data.display_name);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    setIsSearching(false);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMarkerPosition([latitude, longitude]);
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl bg-white dark:bg-slate-800 max-h-[90vh] overflow-hidden flex flex-col border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Escolher Local de Entrega</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <CardContent className="p-4 flex-1 overflow-y-auto bg-white dark:bg-slate-800">
          <div className="space-y-4">
            {/* Campo de Pesquisa com Autocomplete */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <Input
                  placeholder="Digite seu endereço ou local..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 3) setShowSuggestions(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10 h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSuggestions([]);
                      setShowSuggestions(false);
                      setActiveSuggestionIndex(-1);
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin" />
                )}
              </div>

              {showSuggestions && searchQuery.trim().length >= 3 && (
                <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                  {suggestions.length > 0 ? (
                    suggestions.map((s, index) => (
                      <button
                        key={s.place_id}
                        onClick={() => handleSelectSuggestion(s)}
                        className={`w-full text-left px-4 py-3 text-sm border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors flex items-start gap-3 ${
                          activeSuggestionIndex === index ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-200 line-clamp-2">{s.display_name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      Nenhum endereco encontrado. Tente um termo mais especifico.
                    </div>
                  )}
                </div>
              )}
              {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Digite pelo menos 3 caracteres para buscar.</p>
              )}
            </div>

            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleUseCurrentLocation}
              className="flex items-center gap-1 w-full h-10 bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              <Navigation className="w-4 h-4" />
              Usar Minha Localização Actual
            </Button>
            
            <div className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Clique no mapa para marcar o ponto de entrega
            </div>

            {loadingPharmacies ? (
              <div className="flex items-center justify-center h-[400px] bg-gray-50 dark:bg-slate-700 rounded-lg border-2 border-slate-200 dark:border-slate-600">
                <p className="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                  <Search className="w-4 h-4 animate-spin" />
                  A carregar farmácias...
                </p>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-600 h-[400px] bg-gray-50 dark:bg-slate-700">
                <MapContainer
                  center={markerPosition || [-8.8387, 13.2344]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  {markerPosition && <ChangeView center={markerPosition} />}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {pharmacies.map((pharmacy) => (
                    <Marker
                      key={pharmacy.id}
                      position={[parseFloat(pharmacy.lat), parseFloat(pharmacy.lng)]}
                      icon={pharmacyIcon}
                      eventHandlers={{
                        click: () => {
                          setMarkerPosition([parseFloat(pharmacy.lat), parseFloat(pharmacy.lng)]);
                          setAddress(pharmacy.address || pharmacy.name);
                        },
                      }}
                    >
                    </Marker>
                  ))}
                  <LocationMarker position={markerPosition} onChange={handleMapClick} />
                </MapContainer>
              </div>
            )}

            <div className="flex gap-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">+</div>
                <span className="text-sm font-bold text-blue-800 dark:text-blue-300">
                  {pharmacies.length} Farmácia{pharmacies.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span className="text-sm font-bold text-red-800 dark:text-red-300">Seu Local</span>
              </div>
            </div>

            {pharmacies.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">Clique numa farmácia para definir entrega:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pharmacies.map((pharmacy) => (
                    <button
                      key={pharmacy.id}
                      type="button"
                      onClick={() => {
                        setMarkerPosition([parseFloat(pharmacy.lat), parseFloat(pharmacy.lng)]);
                        setAddress(pharmacy.address || pharmacy.name);
                      }}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        markerPosition && 
                        markerPosition[0] === parseFloat(pharmacy.lat) && 
                        markerPosition[1] === parseFloat(pharmacy.lng)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">+</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-800 dark:text-slate-200 truncate">{pharmacy.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{pharmacy.address}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {markerPosition && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  Ponto selecionado: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                </div>
                
                <div>
                  <Input
                    placeholder="Endereço (opcional)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mb-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                  {isSearching && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">
                      <Search className="w-3 h-3 animate-spin" />
                      A procurar endereço...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <div className="flex gap-2 p-4 border-t border-slate-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm} 
            disabled={!markerPosition}
            className="flex-1"
          >
            Confirmar Local
          </Button>
        </div>
      </Card>
    </div>
  );
}
