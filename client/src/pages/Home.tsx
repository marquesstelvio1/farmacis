import { useState, useEffect, useMemo, useRef } from "react";
import { Map as MapIcon, Package, Building2, User, Phone, MapPin, Clock, SlidersHorizontal, LocateFixed, Heart, MessageCircle, Stethoscope, ClipboardList, UserRound, LogOut, ShoppingCart, Pill, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom pharmacy icon (green)
const pharmacyMarkerIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMC41IiBjeT0iMjAuNSIgcj0iMjAuNSIgZmlsbD0iIzhCQzE0QSIvPjxwYXRoIGQ9Ik0yMCAxMFYzME0xMCAyMEgzMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [32, 41],
  iconAnchor: [16, 41],
  popupAnchor: [0, -34],
  shadowSize: [41, 41]
})

const selectedPointIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMC41IiBjeT0iMjAuNSIgcj0iMjAuNSIgZmlsbD0iI0Y5NTk1QSIvPjxjaXJjbGUgY3g9IjIwLjUiIGN5PSIyMC41IiByPSI2IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [32, 41],
  iconAnchor: [16, 41],
  popupAnchor: [0, -34],
  shadowSize: [41, 41]
})

// Component to auto-zoom the map to fit all pharmacies
function MapAutoZoom({ pharmacies }: { pharmacies: Pharmacy[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || pharmacies.length === 0) return

    try {
      // Parse and validate coordinates
      const validCoordinates = pharmacies
        .map(p => {
          const lat = p.latitude ?? p.lat
          const lng = p.longitude ?? p.lng
          if (typeof lat === "number" && typeof lng === "number") {
            return [lat, lng] as [number, number]
          }
          return null
        })
        .filter((coord): coord is [number, number] => coord !== null)

      if (validCoordinates.length > 0) {
        const bounds = L.latLngBounds(validCoordinates)
        if (bounds.isValid()) {
          // Use setView for single points or identical coordinates to avoid invalid bounds behavior
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
      // Fallback to default center
      map.setView([-8.85, 13.25], 12)
    }
  }, [pharmacies, map])

  return null
}

function MapInteractionController({
  focusPoint,
  pickedPoint,
  onPickPoint,
}: {
  focusPoint: LocationPoint | null
  pickedPoint: LocationPoint | null
  onPickPoint: (point: LocationPoint) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!focusPoint) return
    map.setView([focusPoint.lat, focusPoint.lng], 14)
  }, [focusPoint, map])

  useMapEvents({
    click(event) {
      onPickPoint({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })

  if (!pickedPoint) return null

  return (
    <Marker position={[pickedPoint.lat, pickedPoint.lng]} icon={selectedPointIcon}>
      <Popup>
        <div className="text-xs">
          <p className="font-semibold">Ponto selecionado</p>
          <p>Lat: {pickedPoint.lat.toFixed(5)}</p>
          <p>Lng: {pickedPoint.lng.toFixed(5)}</p>
        </div>
      </Popup>
    </Marker>
  )
}

function CheckoutMapPicker({
  point,
  onPickPoint,
}: {
  point: LocationPoint
  onPickPoint: (point: LocationPoint) => void
}) {
  useMapEvents({
    click(event) {
      onPickPoint({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })

  return (
    <Marker position={[point.lat, point.lng]} icon={selectedPointIcon} />
  )
}

// Types
interface Pharmacy {
  id: number;
  name: string;
  address: string;
  distance?: string;
  status?: "open" | "closed" | "soon" | "active" | "pending" | "suspended" | "rejected";
  logo?: string;
  logoUrl?: string;
  rating?: number;
  services?: string[];
  phone: string;
  hours?: string;
  openingHours?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  email?: string;
  description?: string;
}

interface Product {
  id: number;
  name: string;
  dosage: string;
  price: number;
  pharmacyName: string;
  pharmacyId?: number | null;
  imageUrl?: string;
  description?: string;
  category?: string;
  brand?: string;
  stock?: number;
  prescriptionRequired?: boolean;
  activeIngredient?: string;
}

interface LocationPoint {
  lat: number;
  lng: number;
}

interface LocationSuggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  label: string;
  lat: number;
  lng: number;
}

interface SmartSuggestion {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

interface CheckoutSummary {
  pharmacyCount: number;
  pharmacyNames: string[];
  createdOrders: Array<{ pharmacyId: number; pharmacyName: string; orderId: number }>;
}

interface UserOrderNotification {
  id: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  total: string;
  reviewRating?: number | null;
}

// Mock Data
const mockPharmacies: Pharmacy[] = [
  {
    id: 1,
    name: "Farmácia Popular de Luanda",
    address: "Avenida Lenine, Luanda, Angola",
    distance: "A 1.2km",
    status: "open",
    logo: "https://images.unsplash.com/photo-1633057715757-531218911b47?w=300&q=80",
    rating: 4.8,
    services: ["Entrega Grátis", "Vacinação", "Consultoria"],
    phone: "+244-923-456-789",
    hours: "Aberta até às 22h",
    latitude: -8.85,
    longitude: 13.25
  },
  {
    id: 2,
    name: "Farmácia Central",
    address: "Av. João Paulo II, Luanda, Angola",
    distance: "A 2.5km",
    status: "open",
    logo: "https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?w=300&q=80",
    rating: 4.6,
    services: ["Entrega Grátis", "Teste Covid"],
    phone: "+244-923-789-012",
    hours: "Aberta até às 20h",
    latitude: -8.83,
    longitude: 13.23
  },
  {
    id: 3,
    name: "Plantão 24h",
    address: "Rua Principal, Luanda, Angola",
    distance: "A 0.8km",
    status: "open",
    logo: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&q=80",
    rating: 4.9,
    services: ["Aberto 24h", "Suporte Técnico"],
    phone: "+244-923-111-222",
    hours: "Aberto 24 horas",
    latitude: -8.87,
    longitude: 13.28
  }
];

type TabType = "explore" | "catalog" | "pharmacies" | "profile";

// Helper function to ensure pharmacy has all required fields
const normalizePharmacy = (pharmacy: any): Pharmacy => {
  // Safely parse coordinates - handle both string and number values
  let lat = -8.85; // Default Luanda latitude
  let lng = 13.25; // Default Luanda longitude

  // Try to get latitude
  if (pharmacy.latitude !== undefined && pharmacy.latitude !== null) {
    const parsed = parseFloat(String(pharmacy.latitude));
    if (!isNaN(parsed)) lat = parsed;
  } else if (pharmacy.lat !== undefined && pharmacy.lat !== null) {
    const parsed = parseFloat(String(pharmacy.lat));
    if (!isNaN(parsed)) lat = parsed;
  }

  // Try to get longitude
  if (pharmacy.longitude !== undefined && pharmacy.longitude !== null) {
    const parsed = parseFloat(String(pharmacy.longitude));
    if (!isNaN(parsed)) lng = parsed;
  } else if (pharmacy.lng !== undefined && pharmacy.lng !== null) {
    const parsed = parseFloat(String(pharmacy.lng));
    if (!isNaN(parsed)) lng = parsed;
  }

  // Validate coordinates are within Angola's bounds
  // Angola coordinates approx: lat [-5.5, -11.5], lng [11.5, 24.1]
  const validLat = lat >= -15 && lat <= -4 ? lat : -8.85;
  const validLng = lng >= 10 && lng <= 25 ? lng : 13.25;

  return {
    id: pharmacy.id || Math.random(),
    name: pharmacy.name || 'Farmácia sem nome',
    address: pharmacy.address || 'Endereço indisponível',
    distance: pharmacy.distance || 'Localização',
    status: pharmacy.status || 'active',
    logo: pharmacy.logoUrl || pharmacy.logo || 'https://images.unsplash.com/photo-1633057715757-531218911b47?w=300&q=80',
    logoUrl: pharmacy.logoUrl || 'https://images.unsplash.com/photo-1633057715757-531218911b47?w=300&q=80',
    rating: typeof pharmacy.rating === 'number' ? pharmacy.rating : 4.5,
    services: Array.isArray(pharmacy.services) ? pharmacy.services : ['Atendimento normal'],
    phone: pharmacy.phone || '+244-000-000-000',
    hours: pharmacy.hours || pharmacy.openingHours || 'Horário indisponível',
    latitude: validLat,
    longitude: validLng,
    lat: validLat,
    lng: validLng,
    email: pharmacy.email || '',
    description: pharmacy.description || '',
  };
};

// Helper to check if pharmacy is active
const isPharmacyActive = (status?: string) => {
  return status === 'active' || status === 'open';
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("explore");
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(mockPharmacies);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogPharmacyFilterId, setCatalogPharmacyFilterId] = useState<number | null>(null);
  const [catalogPharmacyFilterName, setCatalogPharmacyFilterName] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<number, { product: Product; quantity: number }>>({});
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<"cash" | "multicaixa_express" | "transferencia">("cash");
  const [checkoutAddressSuggestions, setCheckoutAddressSuggestions] = useState<LocationSuggestion[]>([]);
  const [showCheckoutAddressSuggestions, setShowCheckoutAddressSuggestions] = useState(false);
  const [checkoutAddressLoading, setCheckoutAddressLoading] = useState(false);
  const [checkoutPoint, setCheckoutPoint] = useState<LocationPoint | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showExploreFilters, setShowExploreFilters] = useState(false);
  const [onlyOpenPharmacies, setOnlyOpenPharmacies] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationPoint>({ lat: -8.85, lng: 13.25 });
  const [locationLabel, setLocationLabel] = useState("Localização atual");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [mapFocusPoint, setMapFocusPoint] = useState<LocationPoint | null>(null);
  const [pickedMapPoint, setPickedMapPoint] = useState<LocationPoint | null>(null);
  const [smartSuggestionIndex, setSmartSuggestionIndex] = useState(0);
  const [referenceLocationName, setReferenceLocationName] = useState("A obter localização...");
  const [showNotifications, setShowNotifications] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState<UserOrderNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [knownOrderSignatures, setKnownOrderSignatures] = useState<Record<number, string>>({});
  const [favoriteProductIds, setFavoriteProductIds] = useState<number[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const pharmacySheetRef = useRef<HTMLDivElement | null>(null);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const showNotificationsRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "profile" || tab === "explore" || tab === "catalog" || tab === "pharmacies") {
      setActiveTab(tab);
    }
  }, []);

  const getDistanceKm = (from: LocationPoint, to: LocationPoint) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(to.lat - from.lat);
    const dLng = toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  const orderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      accepted: "Aceite",
      awaiting_proof: "Aguardando Pagamento",
      proof_submitted: "Comprovativo Enviado",
      preparing: "Em Preparação",
      ready: "Pronto",
      out_for_delivery: "Em Entrega",
      delivered: "Entregue",
      rejected: "Rejeitado",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const fetchOrderNotifications = async () => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) return;
      const parsed = JSON.parse(rawUser);
      if (!parsed?.id) return;

      const response = await fetch(`/api/user/orders?userId=${parsed.id}`);
      if (!response.ok) return;

      const data = await response.json();
      const notifications: UserOrderNotification[] = (Array.isArray(data) ? data : []).map((order: any) => ({
        id: Number(order.id),
        status: String(order.status || "pending"),
        paymentStatus: String(order.paymentStatus || "pending"),
        createdAt: String(order.createdAt || new Date().toISOString()),
        total: String(order.total || "0"),
        reviewRating: order.reviewRating ?? null,
      }));

      const sorted = notifications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setOrderNotifications(sorted);
      setKnownOrderSignatures((prev) => {
        const next: Record<number, string> = {};
        let changes = 0;

        for (const item of sorted) {
          const signature = `${item.status}|${item.paymentStatus}|${item.reviewRating ?? "none"}`;
          next[item.id] = signature;
          if (!prev[item.id] || prev[item.id] !== signature) changes += 1;
        }

        if (!showNotificationsRef.current && Object.keys(prev).length > 0 && changes > 0) {
          setUnreadNotifications((current) => current + changes);
        }

        return next;
      });
    } catch (error) {
      console.warn("Falha ao carregar notificações de pedidos:", error);
    }
  };

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(nextLocation);
        setLocationLabel("Minha localização atual");
      },
      () => {
        setLocationLabel("Localização padrão (Luanda)");
      }
    );
  };

  const applyLocationSuggestion = (suggestion: LocationSuggestion) => {
    setUserLocation({ lat: suggestion.lat, lng: suggestion.lng });
    setLocationLabel(suggestion.label);
    setLocationQuery(suggestion.label);
    setShowLocationSuggestions(false);
    setMapFocusPoint({ lat: suggestion.lat, lng: suggestion.lng });
    setPickedMapPoint({ lat: suggestion.lat, lng: suggestion.lng });
    setActiveSuggestionIndex(-1);
  };

  const highlightMatch = (text: string, query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return text;

    const normalizedText = text.toLowerCase();
    const normalizedQuery = trimmedQuery.toLowerCase();
    const matchIndex = normalizedText.indexOf(normalizedQuery);

    if (matchIndex === -1) return text;

    const start = text.slice(0, matchIndex);
    const match = text.slice(matchIndex, matchIndex + trimmedQuery.length);
    const end = text.slice(matchIndex + trimmedQuery.length);

    return (
      <>
        {start}
        <span className="font-semibold" style={{ color: "#072a1c" }}>{match}</span>
        {end}
      </>
    );
  };

  useEffect(() => {
    requestCurrentLocation();
  }, []);

  useEffect(() => {
    fetchOrderNotifications();
    const intervalId = window.setInterval(fetchOrderNotifications, 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!showNotifications) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!notificationPanelRef.current) return;
      if (!notificationPanelRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifications]);

  useEffect(() => {
    showNotificationsRef.current = showNotifications;
    if (showNotifications) {
      setUnreadNotifications(0);
    }
  }, [showNotifications]);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) return;
      const parsedUser = JSON.parse(rawUser);
      if (parsedUser?.name) setCheckoutName(parsedUser.name);
      if (parsedUser?.phone) setCheckoutPhone(parsedUser.phone);
      if (parsedUser?.address) setCheckoutAddress(parsedUser.address);
    } catch (error) {
      console.warn("Falha ao carregar dados locais do utilizador:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("favoriteProducts");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setFavoriteProductIds(parsed.map((id) => Number(id)).filter((id) => !Number.isNaN(id)));
      }
    } catch (error) {
      console.warn("Falha ao carregar favoritos:", error);
    }
  }, []);

  useEffect(() => {
    const query = checkoutAddress.trim();
    if (query.length < 3) {
      setCheckoutAddressSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setCheckoutAddressLoading(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=ao&bounded=1&viewbox=13.05,-8.65,13.45,-9.10&q=${encodeURIComponent(`${query}, Luanda`)}`,
        );
        if (!response.ok) {
          setCheckoutAddressSuggestions([]);
          return;
        }
        const data = await response.json();
        const suggestions = (Array.isArray(data) ? data : [])
          .map((item: any) => {
            const rawLabel = String(item.display_name || "Endereço");
            const labelParts = rawLabel.split(",").map((part: string) => part.trim()).filter(Boolean);
            const mainText = labelParts[0] || "Endereço";
            const secondaryText = labelParts.slice(1).join(", ");
            return {
              id: String(item.place_id),
              mainText,
              secondaryText,
              label: rawLabel,
              lat: Number.parseFloat(String(item.lat)),
              lng: Number.parseFloat(String(item.lon)),
            } as LocationSuggestion;
          })
          .filter((item: LocationSuggestion) => !Number.isNaN(item.lat) && !Number.isNaN(item.lng));
        setCheckoutAddressSuggestions(suggestions);
      } catch (error) {
        console.error("Erro ao buscar endereço para checkout:", error);
        setCheckoutAddressSuggestions([]);
      } finally {
        setCheckoutAddressLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [checkoutAddress]);

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
            String(userLocation.lat)
          )}&lon=${encodeURIComponent(String(userLocation.lng))}`
        );
        if (!response.ok) {
          setReferenceLocationName(pickedMapPoint ? "Ponto escolhido no mapa" : "Localização atual");
          return;
        }

        const data = await response.json();
        const displayName = String(data?.display_name || "").trim();
        setReferenceLocationName(displayName || (pickedMapPoint ? "Ponto escolhido no mapa" : "Localização atual"));
      } catch (error) {
        console.error("Erro ao traduzir coordenadas para nome:", error);
        setReferenceLocationName(pickedMapPoint ? "Ponto escolhido no mapa" : "Localização atual");
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [userLocation, pickedMapPoint]);

  useEffect(() => {
    const query = locationQuery.trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingLocationSuggestions(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=ao&bounded=1&viewbox=13.05,-8.65,13.45,-9.10&q=${encodeURIComponent(`${query}, Luanda`)}`,
        );
        if (!response.ok) {
          setLocationSuggestions([]);
          return;
        }

        const data = await response.json();
        const suggestions = (Array.isArray(data) ? data : [])
          .map((item: any) => {
            const rawLabel = String(item.display_name || "Local sem nome");
            const labelParts = rawLabel.split(",").map((part: string) => part.trim()).filter(Boolean);
            const mainText = labelParts[0] || "Local sem nome";
            const secondaryText = labelParts.slice(1).join(", ") || "Luanda, Angola";

            return {
              id: String(item.place_id),
              mainText,
              secondaryText,
              label: rawLabel,
              lat: Number.parseFloat(String(item.lat)),
              lng: Number.parseFloat(String(item.lon)),
            };
          })
          .filter((item: LocationSuggestion) => !Number.isNaN(item.lat) && !Number.isNaN(item.lng));

        setLocationSuggestions(suggestions);
        setActiveSuggestionIndex(suggestions.length > 0 ? 0 : -1);
      } catch (error) {
        console.error("Erro ao buscar sugestões de localização:", error);
        setLocationSuggestions([]);
        setActiveSuggestionIndex(-1);
      } finally {
        setLoadingLocationSuggestions(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [locationQuery]);

  const mapPharmacies = useMemo(
    () => pharmacies.filter((pharmacy) => !onlyOpenPharmacies || isPharmacyActive(pharmacy.status)),
    [pharmacies, onlyOpenPharmacies]
  );

  const explorePharmacies = mapPharmacies.map((pharmacy) => {
      const lat = parseFloat(String(pharmacy.latitude ?? pharmacy.lat ?? -8.85));
      const lng = parseFloat(String(pharmacy.longitude ?? pharmacy.lng ?? 13.25));
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return pharmacy;
      }

      const distanceKm = getDistanceKm(userLocation, { lat, lng });
      return {
        ...pharmacy,
        distance: `${distanceKm.toFixed(1)} km`,
      };
    });

  const filteredExplorePharmacies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return explorePharmacies;

    const pharmacyIdsByProduct = new Set(
      products
        .filter((product) => {
          const productName = String(product.name || "").toLowerCase();
          const productBrand = String(product.brand || "").toLowerCase();
          const productIngredient = String(product.activeIngredient || "").toLowerCase();
          return (
            productName.includes(query) ||
            productBrand.includes(query) ||
            productIngredient.includes(query)
          );
        })
        .map((product) => Number(product.pharmacyId))
        .filter((id) => !Number.isNaN(id) && id > 0),
    );

    return explorePharmacies.filter((pharmacy) => {
      const pharmacyName = String(pharmacy.name || "").toLowerCase();
      const pharmacyAddress = String(pharmacy.address || "").toLowerCase();
      const pharmacyDescription = String(pharmacy.description || "").toLowerCase();
      const pharmacyId = Number(pharmacy.id);

      const matchesPharmacyText =
        pharmacyName.includes(query) ||
        pharmacyAddress.includes(query) ||
        pharmacyDescription.includes(query);
      const matchesProduct = pharmacyIdsByProduct.has(pharmacyId);

      return matchesPharmacyText || matchesProduct;
    });
  }, [explorePharmacies, products, searchQuery]);

  const selectedPharmacyDistance = useMemo(() => {
    if (!selectedPharmacy) return null;
    const lat = Number(selectedPharmacy.latitude ?? selectedPharmacy.lat);
    const lng = Number(selectedPharmacy.longitude ?? selectedPharmacy.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return selectedPharmacy.distance || null;
    return `${getDistanceKm(userLocation, { lat, lng }).toFixed(1)} km`;
  }, [selectedPharmacy, userLocation]);

  const bestRatedPharmacy = useMemo(() => {
    if (pharmacies.length === 0) return null;
    return [...pharmacies].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || null;
  }, [pharmacies]);

  const nearbyPharmaciesCount = useMemo(() => {
    return explorePharmacies.filter((pharmacy) => {
      const distance = parseFloat(String(pharmacy.distance || "").replace(" km", ""));
      return !Number.isNaN(distance) && distance <= 3;
    }).length;
  }, [explorePharmacies]);

  const trendingProductsText = useMemo(() => {
    const names = products
      .slice(0, 3)
      .map((product) => product.name)
      .filter(Boolean);
    if (names.length === 0) return "Paracetamol, Vitamina C e Ibuprofeno";
    return names.join(", ");
  }, [products]);

  const weatherSuggestion = useMemo(() => {
    const weatherOptions = [
      "Céu limpo em Luanda, 29°C",
      "Parcialmente nublado, 27°C",
      "Possibilidade de chuva leve, 26°C",
    ];
    const dayIndex = new Date().getDate() % weatherOptions.length;
    return weatherOptions[dayIndex];
  }, []);

  const smartSuggestions = useMemo<SmartSuggestion[]>(() => {
    return [
      {
        id: "nearby",
        emoji: "📍",
        title: "Farmácias perto de mim",
        description:
          nearbyPharmaciesCount > 0
            ? `${nearbyPharmaciesCount} farmácia(s) até 3 km da sua referência.`
            : "Sem farmácias até 3 km neste momento.",
      },
      {
        id: "trending-products",
        emoji: "🔥",
        title: "Produtos mais procurados",
        description: trendingProductsText,
      },
      {
        id: "weather",
        emoji: "🌤️",
        title: "Tempo e clima",
        description: weatherSuggestion,
      },
      {
        id: "best-rated",
        emoji: "⭐",
        title: "Farmácia mais bem avaliada",
        description: bestRatedPharmacy
          ? `${bestRatedPharmacy.name} (${(bestRatedPharmacy.rating || 0).toFixed(1)} estrelas)`
          : "Sem avaliação disponível no momento.",
      },
    ];
  }, [nearbyPharmaciesCount, trendingProductsText, weatherSuggestion, bestRatedPharmacy]);

  useEffect(() => {
    if (smartSuggestions.length <= 1) return;
    const timer = window.setInterval(() => {
      setSmartSuggestionIndex((prev) => (prev + 1) % smartSuggestions.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [smartSuggestions]);

  const activeSmartSuggestion = smartSuggestions[smartSuggestionIndex] || smartSuggestions[0];

  useEffect(() => {
    if (!selectedPharmacy) return;

    const handleOutsideTouch = (event: PointerEvent) => {
      const sheet = pharmacySheetRef.current;
      if (!sheet) return;
      const target = event.target as Node | null;
      if (target && !sheet.contains(target)) {
        setSelectedPharmacy(null);
        setSheetExpanded(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideTouch);
    return () => document.removeEventListener("pointerdown", handleOutsideTouch);
  }, [selectedPharmacy]);

  const handleSmartSuggestionClick = () => {
    if (!activeSmartSuggestion) return;

    if (activeSmartSuggestion.id === "trending-products") {
      setActiveTab("catalog");
      return;
    }

    if (activeSmartSuggestion.id === "best-rated" && bestRatedPharmacy) {
      setActiveTab("explore");
      setSelectedPharmacy(bestRatedPharmacy);
      setMapFocusPoint({
        lat: bestRatedPharmacy.latitude ?? bestRatedPharmacy.lat ?? -8.85,
        lng: bestRatedPharmacy.longitude ?? bestRatedPharmacy.lng ?? 13.25,
      });
      return;
    }

    setActiveTab("explore");
    setShowExploreFilters(true);
  };

  // Load pharmacies from API on mount
  useEffect(() => {
    const loadPharmacies = async () => {
      try {
        setLoading(true);
        
        const response = await fetch("/api/pharmacy/list");
        if (response.ok) {
          const data = await response.json();
          console.log("Pharmacies loaded from API:", data);
          
          // Normalize all pharmacies to ensure they have required fields
          const normalizedData = (Array.isArray(data) ? data : []).map(normalizePharmacy);
          
          if (normalizedData.length > 0) {
            console.log(`Loaded ${normalizedData.length} pharmacies from database`);
            setPharmacies(normalizedData);
          } else {
            console.log("No active pharmacies in database, using mock data");
            setPharmacies(mockPharmacies);
          }
        } else {
          console.error("API response not ok:", response.status);
          setPharmacies(mockPharmacies);
        }
      } catch (error) {
        console.log("Error loading pharmacies from API, using mock data:", error);
        setPharmacies(mockPharmacies);
      } finally {
        setLoading(false);
      }
    };

    loadPharmacies();
  }, []);

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      // Ajustado para bater com o endpoint definido em server/routes/pharmacy.ts
      const response = await fetch("/api/pharmacy/products");
      if (response.ok) {
        const data = await response.json();
        console.log("Products loaded from API:", data);
        setProducts(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to load products:", response.status);
        setProducts([]);
        setProductsError("Não foi possível carregar os produtos agora.");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
      setProductsError("Erro de conexão ao carregar produtos.");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleOpenFavorites = () => {
    setActiveTab("catalog");
    setSearchQuery("");
    setSelectedCategory("");
    setCatalogPharmacyFilterId(null);
    setCatalogPharmacyFilterName(null);
    setOnlyFavorites(true);
  };

  const handleOpenSupport = () => {
    const message = encodeURIComponent("Olá! Preciso de ajuda com a app Farmacis.");
    window.open(`https://wa.me/244923000000?text=${message}`, "_blank");
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem("favoriteProducts");
    window.location.reload();
  };

  const toggleFavoriteProduct = (productId: number) => {
    setFavoriteProductIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      localStorage.setItem("favoriteProducts", JSON.stringify(next));
      return next;
    });
  };

  // Load products from API
  useEffect(() => {
    loadProducts();
  }, []);

  // Cart functions
  const addToCart = (product: Product) => {
    if (!product.pharmacyId) {
      return;
    }

    setCart(prevCart => {
      const newCart = { ...prevCart };
      const existing = newCart[product.id];
      
      if (existing) {
        if (existing.quantity < (product.stock || 1)) {
          existing.quantity += 1;
        }
      } else {
        newCart[product.id] = { product, quantity: 1 };
      }
      
      return newCart;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => {
      const newCart = { ...prevCart };
      const item = newCart[productId];
      
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          delete newCart[productId];
        }
      }
      
      return newCart;
    });
  };

  const cartTotal = Object.values(cart).reduce((total, item) => {
    return total + (parseFloat(String(item.product.price)) * item.quantity);
  }, 0);

  const cartGroups = useMemo(() => {
    const groups = new Map<number, { pharmacyId: number; pharmacyName: string; items: Array<{ product: Product; quantity: number }>; subtotal: number }>();

    Object.values(cart).forEach((entry) => {
      const pharmacyId = Number(entry.product.pharmacyId || 0);
      if (!pharmacyId) return;
      if (!groups.has(pharmacyId)) {
        groups.set(pharmacyId, {
          pharmacyId,
          pharmacyName: entry.product.pharmacyName || "Farmácia sem nome",
          items: [],
          subtotal: 0,
        });
      }
      const group = groups.get(pharmacyId)!;
      group.items.push(entry);
      group.subtotal += parseFloat(String(entry.product.price)) * entry.quantity;
    });

    return Array.from(groups.values());
  }, [cart]);

  const handleCheckout = async () => {
    if (cartGroups.length === 0) {
      setCheckoutError("O carrinho não tem itens válidos por farmácia.");
      return;
    }
    if (!checkoutName.trim() || !checkoutPhone.trim() || !checkoutAddress.trim()) {
      setCheckoutError("Preencha nome, telefone e endereço para finalizar.");
      return;
    }

    try {
      setCheckoutLoading(true);
      setCheckoutError(null);
      setCheckoutSuccess(null);
      setCheckoutSummary(null);
      const currentUser = (() => {
        try {
          const raw = localStorage.getItem("user");
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();

      const createdOrders: Array<{ pharmacyId: number; pharmacyName: string; orderId: number }> = [];

      for (const group of cartGroups) {
        const payload = {
          pharmacyId: group.pharmacyId,
          userId: currentUser?.id || null,
          customerName: checkoutName.trim(),
          customerPhone: checkoutPhone.trim(),
          customerAddress: checkoutAddress.trim(),
          customerLat: checkoutPoint?.lat ? String(checkoutPoint.lat) : undefined,
          customerLng: checkoutPoint?.lng ? String(checkoutPoint.lng) : undefined,
          paymentMethod: checkoutPaymentMethod,
          deliveryFee: "0",
          total: String(group.subtotal.toFixed(2)),
          items: group.items.map(({ product, quantity }) => ({
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: product.price,
            prescriptionRequired: Boolean(product.prescriptionRequired),
          })),
        };
        let response: Response | null = null;
        let lastNetworkError: any = null;

        // Retry once for transient proxy/backend disconnects (ERR_EMPTY_RESPONSE)
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            response = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            break;
          } catch (networkError: any) {
            lastNetworkError = networkError;
            if (attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              continue;
            }
          }
        }

        if (!response) {
          throw new Error(
            `Sem resposta do servidor ao criar pedido para ${group.pharmacyName}. Verifique se o backend está ativo.`
          );
        }

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(
            errorBody?.message ||
              lastNetworkError?.message ||
              `Falha ao criar pedido para ${group.pharmacyName}`
          );
        }

        const createdOrder = await response.json().catch(() => null);
        createdOrders.push({
          pharmacyId: group.pharmacyId,
          pharmacyName: group.pharmacyName,
          orderId: Number(createdOrder?.id || 0),
        });
      }

      const summary: CheckoutSummary = {
        pharmacyCount: cartGroups.length,
        pharmacyNames: cartGroups.map((group) => group.pharmacyName),
        createdOrders,
      };

      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const parsedUser = JSON.parse(rawUser);
          if (parsedUser?.id) {
            await fetch("/api/auth/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: parsedUser.id,
                name: checkoutName.trim(),
                phone: checkoutPhone.trim(),
                address: checkoutAddress.trim(),
              }),
            });

            localStorage.setItem(
              "user",
              JSON.stringify({
                ...parsedUser,
                name: checkoutName.trim(),
                phone: checkoutPhone.trim(),
                address: checkoutAddress.trim(),
              })
            );
          }
        }
      } catch (profileError) {
        console.warn("Não foi possível atualizar perfil após checkout:", profileError);
      }

      setCart({});
      setCheckoutSummary(summary);
      setCheckoutSuccess("Pedidos criados com sucesso por farmácia.");
    } catch (error: any) {
      setCheckoutError(error?.message || "Falha ao finalizar checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Tab Components
  const ExploreTab = () => {
    return (
      <div className="h-full flex flex-col w-full relative">
        {/* Liquid Glass Header - Minimal */}
        <div 
          className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between"
          style={{
            background: 'transparent',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          <div className="flex-1 flex items-center justify-center px-4">
            {/* Search Bar - Pill shaped */}
            <div 
              className="w-full max-w-md h-11 relative flex items-center gap-3 px-4 rounded-full shadow-lg"
              style={{
                background: '#ffffff',
                border: '1px solid #e0e0e0',
              }}
            >
              <button style={{ color: '#b5f176' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Ex: Coartem, Paracetamol..."
                className="flex-1 bg-transparent border-0 text-sm outline-none"
                style={{
                  color: '#072a1c',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => setShowExploreFilters((prev) => !prev)}
                aria-label="Abrir filtros do mapa"
                className="w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-105"
                style={{ color: '#072a1c', background: 'rgba(181, 241, 118, 0.4)' }}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification/Filter Icon */}
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ml-3 shadow-lg"
            style={{
              background: "rgba(181, 241, 118, 0.3)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(181, 241, 118, 0.5)",
            }}
            aria-label="Abrir central de notificações"
          >
            <span style={{ color: "#b5f176" }} className="text-lg">🔔</span>
            {unreadNotifications > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: "#ef4444", color: "#ffffff" }}
              >
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>
        </div>

        {showNotifications && (
          <div
            ref={notificationPanelRef}
            className="absolute top-16 right-4 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: "#ffffff", borderColor: "#dce4d7", zIndex: 10000 }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#dce4d7" }}>
              <p className="text-sm font-bold" style={{ color: "#072a1c" }}>Central de Notificações</p>
              <button
                type="button"
                onClick={() => setUnreadNotifications(0)}
                className="text-xs px-2 py-1 rounded-full"
                style={{ backgroundColor: "#f7faf5", color: "#607369" }}
              >
                Marcar como lidas
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {orderNotifications.length === 0 ? (
                <p className="px-4 py-5 text-sm" style={{ color: "#607369" }}>
                  Sem notificações por enquanto.
                </p>
              ) : (
                orderNotifications.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 border-b last:border-b-0"
                    style={{ borderColor: "#eef3ec" }}
                  >
                    {item.status === "delivered" && (item.reviewRating === null || item.reviewRating === undefined) && (
                      <p
                        className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest mb-2"
                        style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#b45309" }}
                      >
                        Falta sua avaliação
                      </p>
                    )}
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#607369" }}>
                      Pedido #{item.id}
                    </p>
                    <p className="text-sm font-semibold mt-1" style={{ color: "#072a1c" }}>
                      Status: {orderStatusLabel(item.status)}
                    </p>
                    {item.status === "delivered" && (item.reviewRating === null || item.reviewRating === undefined) && (
                      <p className="text-xs mt-1" style={{ color: "#b45309" }}>
                        Deixe sua nota e comentário para ajudar outros utilizadores.
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "#607369" }}>
                      Pagamento: {item.paymentStatus === "paid" ? "Pago" : "Pendente"}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "#8a9a92" }}>
                      {new Date(item.createdAt).toLocaleString("pt-AO")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {showExploreFilters && (
          <div
            className="absolute top-16 left-4 right-4 md:left-auto md:right-6 md:w-[360px] rounded-2xl p-4 shadow-xl"
            style={{ background: "#ffffff", border: "1px solid #e0e0e0", zIndex: 9999 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm" style={{ color: "#072a1c" }}>Filtros do mapa</p>
              <button
                className="text-xs px-2 py-1 rounded-full"
                style={{ background: "#f5f5f5", color: "#607369" }}
                onClick={() => setShowExploreFilters(false)}
              >
                Fechar
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm mb-4" style={{ color: "#072a1c" }}>
              <input
                type="checkbox"
                checked={onlyOpenPharmacies}
                onChange={(e) => setOnlyOpenPharmacies(e.target.checked)}
              />
              Mostrar apenas farmácias abertas
            </label>

            <div className="mb-2 flex items-center gap-2">
              <LocateFixed size={16} style={{ color: "#8bc14a" }} />
              <p className="text-xs" style={{ color: "#607369" }}>
                Referência atual: {locationLabel}
              </p>
            </div>

            <button
              className="w-full h-10 rounded-xl text-sm font-semibold mb-3"
              style={{ background: "#b5f176", color: "#072a1c" }}
              onClick={requestCurrentLocation}
            >
              Usar minha localização atual
            </button>

            <div className="mb-3 relative">
              <input
                type="text"
                placeholder="Digite um local (ex: Rangel, CTT)"
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setShowLocationSuggestions(true);
                  setActiveSuggestionIndex(-1);
                }}
                onFocus={() => setShowLocationSuggestions(true)}
                onBlur={() => {
                  window.setTimeout(() => setShowLocationSuggestions(false), 150);
                }}
                onKeyDown={(event) => {
                  if (!showLocationSuggestions || locationSuggestions.length === 0) return;

                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveSuggestionIndex((prev) => (prev + 1) % locationSuggestions.length);
                    return;
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveSuggestionIndex((prev) =>
                      prev <= 0 ? locationSuggestions.length - 1 : prev - 1
                    );
                    return;
                  }

                  if (event.key === "Enter") {
                    event.preventDefault();
                    const index = activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0;
                    const selectedSuggestion = locationSuggestions[index];
                    if (selectedSuggestion) {
                      applyLocationSuggestion(selectedSuggestion);
                    }
                    return;
                  }

                  if (event.key === "Escape") {
                    setShowLocationSuggestions(false);
                    setActiveSuggestionIndex(-1);
                  }
                }}
                className="w-full h-10 px-3 rounded-xl text-sm border"
                style={{ borderColor: "#e0e0e0" }}
              />

              {showLocationSuggestions && locationQuery.trim().length > 0 && (
                <div
                  className="absolute left-0 right-0 mt-2 rounded-xl border max-h-44 overflow-y-auto"
                  style={{ background: "#ffffff", borderColor: "#e0e0e0", zIndex: 10000 }}
                >
                  {loadingLocationSuggestions ? (
                    <p className="px-3 py-2 text-xs" style={{ color: "#607369" }}>
                      Buscando locais em Luanda...
                    </p>
                  ) : locationSuggestions.length > 0 ? (
                    locationSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                        style={{ color: "#072a1c" }}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                        onClick={() => {
                          applyLocationSuggestion(suggestion);
                        }}
                        aria-selected={activeSuggestionIndex === index}
                        role="option"
                      >
                        <div
                          className="flex items-start gap-2 rounded-lg px-2 py-1"
                          style={{ background: activeSuggestionIndex === index ? "rgba(181, 241, 118, 0.25)" : "transparent" }}
                        >
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#8bc14a" }} />
                          <div className="min-w-0">
                            <p className="text-sm truncate" style={{ color: "#072a1c" }}>
                              {highlightMatch(suggestion.mainText, locationQuery)}
                            </p>
                            <p className="text-xs truncate" style={{ color: "#607369" }}>
                              {highlightMatch(suggestion.secondaryText, locationQuery)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs" style={{ color: "#607369" }}>
                      Sem sugestões para esse termo em Luanda.
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              className="w-full h-10 rounded-xl text-sm font-semibold"
              style={{ background: "#072a1c", color: "#ffffff" }}
              onClick={() => {
                const exactMatch = locationSuggestions.find(
                  (suggestion) => suggestion.label.toLowerCase() === locationQuery.toLowerCase().trim()
                );
                if (!exactMatch) return;
                applyLocationSuggestion(exactMatch);
              }}
            >
              Aplicar localização selecionada
            </button>

            <p className="mt-3 text-xs" style={{ color: "#607369" }}>
              Dica: toque em qualquer ponto do mapa para marcar um pin e calcular distâncias desde esse ponto.
            </p>
          </div>
        )}

        {/* Map Container - Full screen */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50" style={{ zIndex: 9998 }}>
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-4 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p style={{ color: '#072a1c' }} className="font-semibold">Carregando farmácias...</p>
              </div>
            </div>
          )}

          {/* Interactive Leaflet Map */}
          <MapContainer center={[-8.85, 13.25]} zoom={12} className="w-full h-full" style={{ zIndex: 1 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapAutoZoom pharmacies={filteredExplorePharmacies} />
            <MapInteractionController
              focusPoint={mapFocusPoint}
              pickedPoint={pickedMapPoint}
              onPickPoint={(point) => {
                setPickedMapPoint(point);
                setUserLocation(point);
                setLocationLabel(`Ponto no mapa (${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})`);
                setLocationQuery(`Lat ${point.lat.toFixed(5)}, Lng ${point.lng.toFixed(5)}`);
                setMapFocusPoint(point);
              }}
            />
            
            {/* Pharmacy Markers */}
            {filteredExplorePharmacies.map((pharmacy) => {
              const lat = parseFloat(String(pharmacy.latitude || pharmacy.lat || -8.85));
              const lng = parseFloat(String(pharmacy.longitude || pharmacy.lng || 13.25));
              
              return (
                <Marker 
                  key={pharmacy.id} 
                  position={[lat, lng]}
                  icon={pharmacyMarkerIcon}
                  eventHandlers={{
                    click: () => setSelectedPharmacy(pharmacy)
                  }}
                >
                  <Popup className="pharmacy-popup">
                    <div className="text-xs p-2 min-w-52">
                      <p className="font-bold text-sm mb-2" style={{ color: '#072a1c' }}>
                        {pharmacy.name}
                      </p>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <Phone className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#8bc14a' }} />
                          <p style={{ color: '#607369' }}>{pharmacy.phone}</p>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#8bc14a' }} />
                          <p style={{ color: '#607369' }} className="line-clamp-2">{pharmacy.address}</p>
                        </div>

                        {pharmacy.hours && (
                          <div className="flex items-start gap-2">
                            <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#8bc14a' }} />
                            <p style={{ color: '#607369' }}>{pharmacy.hours}</p>
                          </div>
                        )}
                      </div>
                      
                      {isPharmacyActive(pharmacy.status) && (
                        <div className="mt-3 px-2 py-1 rounded bg-green-100 text-center">
                          <p className="text-xs font-bold" style={{ color: '#8bc14a' }}>✓ Ativa</p>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Pharmacy Card - Bottom Area */}
          <AnimatePresence>
            {selectedPharmacy && !true && ( // Will not show with full sheet below
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="absolute bottom-24 left-4 right-4 z-35 rounded-2xl shadow-xl overflow-hidden"
                style={{ backgroundColor: '#fof5ee' }}
              >
                <div className="flex gap-3 p-3">
                  <img
                    src={selectedPharmacy.logoUrl || selectedPharmacy.logo}
                    alt={selectedPharmacy.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs opacity-60" style={{ color: '#607369' }}>OPEN</p>
                      <h3 className="font-bold text-sm" style={{ color: '#072a1c' }}>{selectedPharmacy.name}</h3>
                      <p className="text-xs mt-1" style={{ color: '#607369' }}>{selectedPharmacy.distance}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: '#072a1c' }}>⭐ {(selectedPharmacy.rating || 4.5).toFixed(1)}</span>
                    </div>
                  </div>
                  <button 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition"
                    style={{ backgroundColor: '#b5f176', color: '#072a1c' }}
                  >
                    💚
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pharmacy Details Bottom Sheet - Only visible when selected */}
          <AnimatePresence>
            {selectedPharmacy && (
              <>
                {/* Backdrop - Click to close */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setSelectedPharmacy(null);
                    setSheetExpanded(false);
                  }}
                  className="absolute inset-0"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: 9998, pointerEvents: 'auto' }}
                />
                
                {/* Bottom Sheet with Drag */}
                <motion.div
                  ref={pharmacySheetRef}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: sheetExpanded ? 0 : "calc(100% - 400px)", opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  drag="y"
                  dragElastic={0.15}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 60) {
                      // Dragged down more than 100px
                      setSelectedPharmacy(null);
                      setSheetExpanded(false);
                    } else if (info.offset.y < -40) {
                      // Dragged up more than 100px
                      setSheetExpanded(true);
                    }
                  }}
                  className="absolute bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl overflow-hidden"
                  style={{
                    backgroundColor: '#ffffff',
                    zIndex: 9999,
                    pointerEvents: 'auto',
                    maxHeight: sheetExpanded ? '90vh' : '400px',
                    height: 'auto'
                  }}
                >
                  {/* Drag Handle */}
                  <div 
                    className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                    onClick={() => setSheetExpanded((prev) => !prev)}
                  >
                    <div
                      className="w-12 h-1 rounded-full"
                      style={{ backgroundColor: '#607369', opacity: 0.3 }}
                    />
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 50px)' }}>
                    <div className="px-6 pb-8 pt-2">
                      {/* Minimal Pharmacy Card (style like mockup) */}
                      <div className="mb-6">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-2xl font-black leading-tight" style={{ color: '#072a1c' }}>
                            {selectedPharmacy.name}
                          </h3>
                          <span
                            className="px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap"
                            style={{ backgroundColor: '#b5f176', color: '#072a1c' }}
                          >
                            VERIFIED
                          </span>
                        </div>

                        <p className="text-base mt-2" style={{ color: '#607369' }}>
                          {selectedPharmacy.address}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mt-5 mb-5">
                          <div className="p-4 rounded-3xl" style={{ backgroundColor: '#eef2ec' }}>
                            <p className="text-[11px] font-black tracking-wide" style={{ color: '#607369' }}>STATUS</p>
                            <p className="text-2xl mt-1">🟢</p>
                            <p className="text-xl font-black leading-tight" style={{ color: '#072a1c' }}>
                              {selectedPharmacy.hours || 'Aberta agora'}
                            </p>
                          </div>
                          <div className="p-4 rounded-3xl" style={{ backgroundColor: '#eef2ec' }}>
                            <p className="text-[11px] font-black tracking-wide" style={{ color: '#607369' }}>DISTÂNCIA</p>
                            <p className="text-2xl mt-1">📍</p>
                            <p className="text-xl font-black leading-tight" style={{ color: '#072a1c' }}>
                              {selectedPharmacyDistance || 'Distância indisponível'}
                            </p>
                            <p className="text-[11px] mt-1" style={{ color: '#607369' }}>
                              Referência: {pickedMapPoint ? "Ponto escolhido no mapa" : "Localização atual"}
                            </p>
                            <p className="text-[11px]" style={{ color: '#607369' }}>
                              {referenceLocationName}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap mb-4">
                          {(selectedPharmacy.services || ['Atendimento normal']).slice(0, 3).map((service: string) => (
                            <span
                              key={service}
                              className="text-sm px-4 py-2 rounded-full border"
                              style={{ backgroundColor: '#f5f7f4', borderColor: '#dce4d7', color: '#072a1c' }}
                            >
                              {service}
                            </span>
                          ))}
                        </div>

                        <p className="text-sm font-semibold" style={{ color: '#607369' }}>
                          ⭐ {(selectedPharmacy.rating || 4.5).toFixed(1)} (120 avaliações)
                        </p>

                        {!sheetExpanded && (
                          <button
                            onClick={() => setSheetExpanded(true)}
                            className="mt-3 w-full h-10 rounded-xl text-sm font-bold"
                            style={{ backgroundColor: '#f0f4ee', color: '#072a1c' }}
                          >
                            ⬆️ Deslize para cima para ver comentários e avaliações
                          </button>
                        )}
                      </div>

                      {/* Events List - Expanded */}
                      {sheetExpanded && (
                        <div className="mb-6">
                          <p className="text-xs font-bold mb-3" style={{ color: '#607369' }}>🗓️ EVENTOS & ATIVIDADES</p>
                          <div className="space-y-3">
                            {[
                              { time: '09:00 - 12:00', title: 'Plantão de Vacinação', desc: 'Vacinas contra Gripe' },
                              { time: '14:00 - 17:00', title: 'Consultoria Farmacêutica', desc: 'Atendimento ao cliente' },
                              { time: '18:00 - 22:00', title: 'Horário Estendido', desc: 'Atendimento especial' }
                            ].map((event, idx) => (
                              <div key={idx} className="p-3 rounded-2xl" style={{ backgroundColor: '#f7f7f7' }}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs font-bold" style={{ color: '#072a1c' }}>{event.title}</p>
                                    <p className="text-xs mt-1" style={{ color: '#607369' }}>{event.desc}</p>
                                  </div>
                                  <span className="text-xs font-bold whitespace-nowrap ml-2" style={{ color: '#8bc14a' }}>{event.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reviews/Comments - Expanded */}
                      {sheetExpanded && (
                        <div className="mb-6">
                          <p className="text-xs font-bold mb-3" style={{ color: '#607369' }}>💬 COMENTÁRIOS & AVALIAÇÕES</p>
                          <div className="space-y-3">
                            {[
                              { name: 'João Silva', rating: 5, text: 'Excelente atendimento! Medicamentos de qualidade.', date: 'Há 2 dias' },
                              { name: 'Maria Santos', rating: 4, text: 'Ótimo local, preço justo. Recomendo!', date: 'Há 5 dias' },
                              { name: 'Pedro Costa', rating: 5, text: 'Farmacêutico muito atencioso e prestativo.', date: 'Há 1 semana' }
                            ].map((review, idx) => (
                              <div key={idx} className="p-4 rounded-2xl border" style={{ backgroundColor: '#f7f7f7', borderColor: '#e0e0e0' }}>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-xs font-bold" style={{ color: '#072a1c' }}>{review.name}</p>
                                    <p className="text-xs" style={{ color: '#607369' }}>{review.date}</p>
                                  </div>
                                  <span style={{ color: '#8bc14a' }}>{'⭐'.repeat(review.rating)}</span>
                                </div>
                                <p className="text-xs" style={{ color: '#607369' }}>{review.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contact base */}
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl border" style={{ borderColor: '#dce4d7', backgroundColor: '#f7faf5' }}>
                          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#607369' }}>Contacto</p>
                          <p className="mt-1 text-lg font-black" style={{ color: '#072a1c' }}>
                            {selectedPharmacy.phone}
                          </p>
                          <a
                            href={`https://wa.me/${String(selectedPharmacy.phone || "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 w-full h-11 flex items-center justify-center gap-2 font-black rounded-full transition hover:shadow-lg"
                            style={{ backgroundColor: '#25D366', color: '#ffffff' }}
                          >
                            <span>💬</span>
                            <span>Falar no WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {sheetExpanded && (
                        <div className="grid grid-cols-1 gap-3 mt-4 mb-2">
                          <button
                            onClick={() => {
                              setActiveTab("catalog");
                              setSearchQuery(selectedPharmacy.name);
                            }}
                            className="w-full h-12 flex items-center justify-center gap-2 font-black rounded-full transition hover:shadow-lg"
                            style={{ backgroundColor: '#a4e86a', color: '#072a1c' }}
                          >
                            <Package size={18} />
                            <span>Ver Catálogo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const CatalogTab = () => {
    // Get unique categories
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    // Filter products
    let filteredProducts = products.filter(product => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.activeIngredient?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesPharmacy = !catalogPharmacyFilterId || Number(product.pharmacyId) === catalogPharmacyFilterId;
      
      return matchesSearch && matchesCategory && matchesPharmacy;
    });

    if (onlyFavorites) {
      filteredProducts = filteredProducts.filter((product) => favoriteProductIds.includes(product.id));
    }

    const cartSize = Object.keys(cart).length;

    return (
      <div className="h-full w-full pb-24 md:pb-6 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20" style={{ backgroundColor: '#072a1c' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black" style={{ color: '#b5f176' }}>Medicamentos</h2>
              <div className="relative">
                <button 
                  onClick={() => {
                    setCheckoutError(null);
                    setCheckoutSuccess(null);
                    setShowCartDrawer(true);
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition hover:scale-110"
                  style={{ backgroundColor: '#b5f176', color: '#072a1c' }}
                >
                  <ShoppingCart size={18} />
                  {cartSize > 0 && (
                    <span 
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: '#8bc14a', color: '#072a1c' }}
                    >
                      {cartSize}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <input
              type="text"
              placeholder="Procurar medicamentos..."
              className="w-full h-11 px-4 rounded-full border-0 mb-3"
              style={{ backgroundColor: '#f7f7f7', color: '#072a1c' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Filters */}
            <div className="space-y-3">
              {/* Category Filter */}
              {categories.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: '#b5f176' }}>Categoria</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                      onClick={() => setSelectedCategory("")}
                      className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition"
                      style={{
                        backgroundColor: selectedCategory === "" ? '#b5f176' : 'rgba(181, 241, 118, 0.2)',
                        color: selectedCategory === "" ? '#072a1c' : '#b5f176'
                      }}
                    >
                      Todas
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat || "")}
                        className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition"
                        style={{
                          backgroundColor: selectedCategory === cat ? '#b5f176' : 'rgba(181, 241, 118, 0.2)',
                          color: selectedCategory === cat ? '#072a1c' : '#b5f176'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Counter */}
              <p className="text-xs" style={{ color: '#8bc14a' }}>
                {filteredProducts.length} medicamento{filteredProducts.length !== 1 ? 's' : ''}
              </p>

              {onlyFavorites && (
                <div className="px-4 py-2 rounded-xl flex items-center justify-between" style={{ backgroundColor: "rgba(181, 241, 118, 0.22)" }}>
                  <p className="text-xs font-semibold" style={{ color: "#072a1c" }}>
                    A mostrar apenas favoritos
                  </p>
                  <button
                    onClick={() => setOnlyFavorites(false)}
                    className="text-xs font-bold"
                    style={{ color: "#607369" }}
                  >
                    Ver todos
                  </button>
                </div>
              )}

              {catalogPharmacyFilterId && (
                <div className="px-4 py-2 rounded-xl flex items-center justify-between" style={{ backgroundColor: "rgba(181, 241, 118, 0.22)" }}>
                  <p className="text-xs font-semibold" style={{ color: "#072a1c" }}>
                    Catálogo filtrado: {catalogPharmacyFilterName || `Farmácia #${catalogPharmacyFilterId}`}
                  </p>
                  <button
                    onClick={() => {
                      setCatalogPharmacyFilterId(null);
                      setCatalogPharmacyFilterName(null);
                    }}
                    className="text-xs font-bold"
                    style={{ color: "#607369" }}
                  >
                    Limpar filtro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsLoading ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold" style={{ color: "#072a1c" }}>A carregar produtos...</p>
              </div>
            ) : productsError ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold" style={{ color: "#072a1c" }}>{productsError}</p>
                <p className="text-xs mt-1" style={{ color: "#607369" }}>
                  Tenta novamente dentro de alguns segundos.
                </p>
                <button
                  onClick={loadProducts}
                  className="mt-4 h-10 px-5 rounded-full text-sm font-bold"
                  style={{ backgroundColor: "#b5f176", color: "#072a1c" }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const cartItem = cart[product.id];
                const isFavorite = favoriteProductIds.includes(product.id);
                return (
                  <div 
                    key={product.id} 
                    className="rounded-2xl overflow-hidden transition hover:shadow-xl"
                    style={{ backgroundColor: '#fof5ee', border: '1px solid #e8e8e8' }}
                  >
                    {/* Product Image */}
                    <div className="h-32 flex items-center justify-center text-4xl overflow-hidden" style={{ backgroundColor: '#f0f0f0' }}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Pill size={36} style={{ color: "#8bc14a" }} />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Name and Brand */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-sm line-clamp-2" style={{ color: '#072a1c' }}>
                          {product.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => toggleFavoriteProduct(product.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border shrink-0"
                          style={{ borderColor: "#dce4d7", backgroundColor: "#ffffff" }}
                          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          <Heart
                            size={15}
                            className={isFavorite ? "fill-current" : ""}
                            style={{ color: isFavorite ? "#ef4444" : "#607369" }}
                          />
                        </button>
                      </div>
                      {product.brand && (
                        <p className="text-xs font-semibold mb-2" style={{ color: '#8bc14a' }}>
                          <span className="inline-flex items-center gap-1">
                            <Store size={12} />
                            {product.brand}
                          </span>
                        </p>
                      )}

                      {/* Dosage and Category */}
                      <div className="flex items-center gap-2 mb-3">
                        {product.dosage && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(139, 193, 74, 0.1)', color: '#8bc14a' }}>
                            {product.dosage}
                          </span>
                        )}
                        {product.category && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(7, 42, 28, 0.1)', color: '#072a1c' }}>
                            {product.category}
                          </span>
                        )}
                      </div>

                      {/* Seller Pharmacy */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold" style={{ color: '#607369' }}>
                          🏥 Vendido por {product.pharmacyName || 'Farmácia sem nome'}
                        </p>
                      </div>

                      {/* Price and Buttons */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-black" style={{ color: '#8bc14a' }}>
                            {product.price} Kz
                          </p>
                        </div>
                        
                        {/* Cart Controls */}
                        {cartItem ? (
                          <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1" style={{ border: '1px solid #8bc14a' }}>
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="w-5 h-5 flex items-center justify-center font-bold text-sm transition hover:bg-gray-100 rounded"
                              style={{ color: '#8bc14a' }}
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-xs font-bold" style={{ color: '#072a1c' }}>
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(product)}
                              disabled={!product.stock || product.stock <= 0 || !product.pharmacyId}
                              className="w-5 h-5 flex items-center justify-center font-bold text-sm transition hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ color: '#8bc14a' }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            disabled={!product.stock || product.stock <= 0 || !product.pharmacyId}
                            className="px-4 py-2 rounded-lg font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: (product.stock && product.stock > 0 && product.pharmacyId) ? '#b5f176' : '#ccc',
                              color: '#072a1c'
                            }}
                          >
                            {product.pharmacyId ? ((product.stock && product.stock > 0) ? 'Adicionar' : 'Indisponível') : 'Sem farmácia'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full flex items-center justify-center py-16 text-center">
                <div>
                  <p className="text-5xl mb-3">💊</p>
                  <p className="text-lg font-bold" style={{ color: '#072a1c' }}>Nenhum medicamento encontrado</p>
                  <p className="text-sm mt-2" style={{ color: '#607369' }}>Tente outra busca ou categoria</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Summary - Shows when cart has items */}
        {cartSize > 0 && (
          <div 
            className="sticky bottom-24 md:bottom-6 left-0 right-0 mx-4 mb-4 p-4 rounded-2xl shadow-lg"
            style={{ backgroundColor: '#b5f176' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold" style={{ color: '#072a1c' }}>
                  {cartSize} item{cartSize !== 1 ? 's' : ''} no carrinho
                </p>
                <p className="text-lg font-black">
                  Total: {cartTotal.toFixed(2)} Kz
                </p>
              </div>
              <button 
                onClick={() => {
                  setCheckoutError(null);
                  setCheckoutSuccess(null);
                  setShowCartDrawer(true);
                }}
                className="px-6 py-2 rounded-full font-bold transition hover:scale-105"
                style={{ backgroundColor: '#072a1c', color: '#b5f176' }}
              >
                Ver Carrinho
              </button>
            </div>
          </div>
        )}

        {showCartDrawer && (
          <div className="fixed inset-0 z-[10000]">
            <div
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              onClick={() => setShowCartDrawer(false)}
            />
            <div
              className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto"
              style={{ borderLeft: "1px solid #e0e0e0" }}
            >
              <div className="p-5 border-b" style={{ borderColor: "#e0e0e0" }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black" style={{ color: "#072a1c" }}>Carrinho e Checkout</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCart({})}
                      className="text-xs font-bold"
                      style={{ color: "#d32f2f" }}
                    >
                      Limpar
                    </button>
                    <button onClick={() => setShowCartDrawer(false)} className="text-sm font-bold" style={{ color: "#607369" }}>
                      Fechar
                    </button>
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: "#607369" }}>
                  Pedidos são separados por farmácia automaticamente.
                </p>
              </div>

              <div className="p-5 space-y-4">
                {checkoutSuccess ? (
                  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-2">
                    <div className="w-40 h-40 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: "rgba(181, 241, 118, 0.25)" }}>
                      <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: "#ffffff", border: "8px solid rgba(181, 241, 118, 0.15)" }}>
                        <span className="text-5xl" style={{ color: "#2e7d32" }}>✓</span>
                      </div>
                    </div>
                    <h4 className="text-3xl font-black mb-3" style={{ color: "#072a1c" }}>Pedido Enviado!</h4>
                    <p className="text-sm leading-6 max-w-sm" style={{ color: "#607369" }}>
                      O seu pedido foi criado e enviado para a(s) farmácia(s). Assim que houver atualização, você será notificado.
                    </p>
                    <div className="mt-5 w-full rounded-2xl border p-4 text-left" style={{ borderColor: "#e0e0e0", backgroundColor: "#f7faf5" }}>
                      <p className="text-xs uppercase font-black tracking-wide" style={{ color: "#607369" }}>Entrega para</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: "#072a1c" }}>{checkoutAddress || "Endereço selecionado"}</p>
                      <p className="text-xs mt-2" style={{ color: "#607369" }}>
                        Farmácias no pedido: {checkoutSummary?.pharmacyCount ?? 0}
                      </p>
                      {(checkoutSummary?.pharmacyNames?.length ?? 0) > 0 && (
                        <p className="text-xs mt-1" style={{ color: "#607369" }}>
                          {checkoutSummary?.pharmacyNames.join(" • ")}
                        </p>
                      )}
                      {(checkoutSummary?.createdOrders?.length ?? 0) > 0 && (
                        <div className="mt-2 space-y-1">
                          {checkoutSummary?.createdOrders.map((order) => (
                            <p key={`${order.pharmacyId}-${order.orderId}`} className="text-xs" style={{ color: "#607369" }}>
                              {order.pharmacyName}: Pedido #{order.orderId}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setCheckoutSuccess(null);
                        setShowCartDrawer(false);
                        setActiveTab("explore");
                      }}
                      className="mt-6 h-12 px-8 rounded-full font-black"
                      style={{ backgroundColor: "#072a1c", color: "#b5f176" }}
                    >
                      Voltar ao início
                    </button>
                    <button
                      onClick={() => {
                        window.location.assign("/pedidos");
                      }}
                      className="mt-3 h-11 px-8 rounded-full font-black border"
                      style={{ borderColor: "#dce4d7", color: "#072a1c", backgroundColor: "#ffffff" }}
                    >
                      Ver Meus Pedidos
                    </button>
                  </div>
                ) : (
                  <>
                    {cartGroups.map((group) => (
                      <div key={group.pharmacyId} className="rounded-2xl p-4 border" style={{ borderColor: "#e0e0e0" }}>
                        <p className="text-sm font-black" style={{ color: "#072a1c" }}>{group.pharmacyName}</p>
                        <div className="mt-2 space-y-2">
                          {group.items.map(({ product, quantity }) => (
                            <div key={product.id} className="flex items-center justify-between gap-2 text-sm">
                              <div className="min-w-0">
                                <p className="truncate" style={{ color: "#072a1c" }}>{product.name}</p>
                                <p className="text-xs" style={{ color: "#607369" }}>
                                  {(parseFloat(String(product.price)) * quantity).toFixed(2)} Kz
                                </p>
                              </div>
                              <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1" style={{ border: "1px solid #dce4d7" }}>
                                <button
                                  onClick={() => removeFromCart(product.id)}
                                  className="w-5 h-5 rounded text-sm font-bold"
                                  style={{ color: "#8bc14a" }}
                                >
                                  −
                                </button>
                                <span className="w-5 text-center text-xs font-bold" style={{ color: "#072a1c" }}>
                                  {quantity}
                                </span>
                                <button
                                  onClick={() => addToCart(product)}
                                  className="w-5 h-5 rounded text-sm font-bold"
                                  style={{ color: "#8bc14a" }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm font-bold mt-3" style={{ color: "#8bc14a" }}>
                          Subtotal: {group.subtotal.toFixed(2)} Kz
                        </p>
                      </div>
                    ))}

                    <div className="rounded-2xl p-4 border" style={{ borderColor: "#e0e0e0", backgroundColor: "#f7faf5" }}>
                      <p className="text-sm font-black mb-3" style={{ color: "#072a1c" }}>Dados para entrega</p>
                      <div className="space-y-2">
                        <input value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} placeholder="Seu nome" className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: "#dce4d7" }} />
                        <input value={checkoutPhone} onChange={(e) => setCheckoutPhone(e.target.value)} placeholder="Telefone" className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: "#dce4d7" }} />
                        <div className="relative">
                          <input
                            value={checkoutAddress}
                            onChange={(e) => {
                              setCheckoutAddress(e.target.value);
                              setShowCheckoutAddressSuggestions(true);
                            }}
                            onFocus={() => setShowCheckoutAddressSuggestions(true)}
                            onBlur={() => {
                              window.setTimeout(() => setShowCheckoutAddressSuggestions(false), 120);
                            }}
                            placeholder="Endereço de entrega"
                            className="w-full h-10 px-3 rounded-xl border text-sm"
                            style={{ borderColor: "#dce4d7" }}
                          />

                          {showCheckoutAddressSuggestions && checkoutAddress.trim().length > 0 && (
                            <div
                              className="absolute z-20 left-0 right-0 mt-1 rounded-xl border max-h-44 overflow-y-auto"
                              style={{ background: "#fff", borderColor: "#dce4d7" }}
                            >
                              {checkoutAddressLoading ? (
                                <p className="px-3 py-2 text-xs" style={{ color: "#607369" }}>A procurar endereço...</p>
                              ) : checkoutAddressSuggestions.length > 0 ? (
                                checkoutAddressSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                      setCheckoutAddress(suggestion.label);
                                      setCheckoutPoint({ lat: suggestion.lat, lng: suggestion.lng });
                                      setShowCheckoutAddressSuggestions(false);
                                    }}
                                  >
                                    <p className="text-sm font-semibold" style={{ color: "#072a1c" }}>{suggestion.mainText}</p>
                                    <p className="text-xs" style={{ color: "#607369" }}>{suggestion.secondaryText}</p>
                                  </button>
                                ))
                              ) : (
                                <p className="px-3 py-2 text-xs" style={{ color: "#607369" }}>Sem sugestões para esse endereço.</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#dce4d7" }}>
                          <MapContainer
                            center={[checkoutPoint?.lat ?? userLocation.lat, checkoutPoint?.lng ?? userLocation.lng]}
                            zoom={13}
                            className="w-full"
                            style={{ height: 170 }}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <CheckoutMapPicker
                              point={{ lat: checkoutPoint?.lat ?? userLocation.lat, lng: checkoutPoint?.lng ?? userLocation.lng }}
                              onPickPoint={async (point) => {
                                setCheckoutPoint(point);
                                try {
                                  const response = await fetch(
                                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
                                      String(point.lat)
                                    )}&lon=${encodeURIComponent(String(point.lng))}`
                                  );
                                  if (response.ok) {
                                    const data = await response.json();
                                    const displayName = String(data?.display_name || "").trim();
                                    if (displayName) {
                                      setCheckoutAddress(displayName);
                                    }
                                  }
                                } catch (error) {
                                  console.warn("Falha ao obter endereço por ponto no mapa:", error);
                                }
                              }}
                            />
                          </MapContainer>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl p-4 border" style={{ borderColor: "#e0e0e0", backgroundColor: "#ffffff" }}>
                      <p className="text-sm font-black mb-3" style={{ color: "#072a1c" }}>Método de pagamento</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setCheckoutPaymentMethod("cash")}
                          className="h-10 rounded-xl text-sm font-bold border transition"
                          style={{
                            borderColor: checkoutPaymentMethod === "cash" ? "#8bc14a" : "#dce4d7",
                            backgroundColor: checkoutPaymentMethod === "cash" ? "rgba(181, 241, 118, 0.22)" : "#f7faf5",
                            color: "#072a1c",
                          }}
                        >
                          Dinheiro
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutPaymentMethod("multicaixa_express")}
                          className="h-10 rounded-xl text-sm font-bold border transition"
                          style={{
                            borderColor: checkoutPaymentMethod === "multicaixa_express" ? "#8bc14a" : "#dce4d7",
                            backgroundColor: checkoutPaymentMethod === "multicaixa_express" ? "rgba(181, 241, 118, 0.22)" : "#f7faf5",
                            color: "#072a1c",
                          }}
                        >
                          Multicaixa Express
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutPaymentMethod("transferencia")}
                          className="h-10 rounded-xl text-sm font-bold border transition"
                          style={{
                            borderColor: checkoutPaymentMethod === "transferencia" ? "#8bc14a" : "#dce4d7",
                            backgroundColor: checkoutPaymentMethod === "transferencia" ? "rgba(181, 241, 118, 0.22)" : "#f7faf5",
                            color: "#072a1c",
                          }}
                        >
                          Transferência
                        </button>
                      </div>
                    </div>

                    {checkoutError && <p className="text-sm font-semibold" style={{ color: "#d32f2f" }}>{checkoutError}</p>}
                    <p className="text-sm font-black" style={{ color: "#072a1c" }}>
                      Total geral: {cartTotal.toFixed(2)} Kz
                    </p>

                    <button
                      onClick={handleCheckout}
                      disabled={checkoutLoading || cartGroups.length === 0}
                      className="w-full h-12 rounded-full font-black disabled:opacity-50"
                      style={{ backgroundColor: "#072a1c", color: "#b5f176" }}
                    >
                      {checkoutLoading ? "A finalizar..." : `Finalizar pedidos (${cartGroups.length} farmácia${cartGroups.length !== 1 ? "s" : ""})`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PharmaciesTab = () => (
    <div className="h-full w-full pb-24 md:pb-6 overflow-y-auto">
      <div className="p-4 sticky top-0 z-20" style={{ backgroundColor: '#072a1c' }}>
        <h2 className="text-2xl font-black mb-4" style={{ color: '#b5f176' }}>Farmácias</h2>
        <p className="text-xs mb-4" style={{ color: '#8bc14a' }}>📍 {pharmacies.length} farmácia{pharmacies.length !== 1 ? 's' : ''} registada{pharmacies.length !== 1 ? 's' : ''}</p>
        <input
          type="text"
          placeholder="Procurar farmácias..."
          className="w-full h-11 px-4 rounded-full border-0"
          style={{ backgroundColor: '#f7f7f7', color: '#072a1c' }}
        />
      </div>

      <div className="p-4 space-y-3">
        {pharmacies.length > 0 ? (
          pharmacies.map((pharmacy) => (
            <div key={pharmacy.id} className="rounded-2xl overflow-hidden transition hover:shadow-lg" style={{ backgroundColor: '#fof5ee' }}>
              <img src={pharmacy.logoUrl || pharmacy.logo} alt={pharmacy.name} className="w-full h-28 object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm" style={{ color: '#072a1c' }}>{pharmacy.name}</h3>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: '#607369' }}>{pharmacy.address}</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ml-2" style={{ backgroundColor: '#b5f176', color: '#072a1c' }}>
                    ⭐ {(pharmacy.rating || 4.5).toFixed(1)}
                  </span>
                </div>
                <div className="text-xs mb-3 flex items-center gap-1" style={{ color: '#607369' }}>
                  <Phone className="w-3 h-3" />
                  <a href={`tel:${pharmacy.phone}`} style={{ color: '#8bc14a' }} className="hover:underline">
                    {pharmacy.phone}
                  </a>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedPharmacy(pharmacy);
                      setSheetExpanded(false);
                      setMapFocusPoint({
                        lat: pharmacy.latitude ?? pharmacy.lat ?? -8.85,
                        lng: pharmacy.longitude ?? pharmacy.lng ?? 13.25,
                      });
                      setActiveTab("explore");
                    }}
                    className="flex-1 h-9 text-xs font-bold rounded-lg transition" 
                    style={{ backgroundColor: '#072a1c', color: '#b5f176' }}
                  >
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("catalog");
                      setCatalogPharmacyFilterId(pharmacy.id);
                      setCatalogPharmacyFilterName(pharmacy.name);
                      setSearchQuery("");
                      setSelectedCategory("");
                    }}
                    className="flex-1 h-9 text-xs font-bold rounded-lg transition"
                    style={{ backgroundColor: '#b5f176', color: '#072a1c' }}
                  >
                    Ver Catálogo
                  </button>
                  <a 
                    href={`https://www.google.com/maps/search/${pharmacy.latitude},${pharmacy.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
                    style={{ backgroundColor: '#f0f4ee', color: '#072a1c' }}
                  >
                    <MapPin className="w-3 h-3" />
                    Mapa
                  </a>
                </div>
              </div>
            </div>

          ))
        ) : (
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <p className="text-4xl mb-2">📍</p>
              <p style={{ color: '#072a1c' }} className="font-semibold">Nenhuma farmácia ativa</p>
              <p style={{ color: '#607369' }} className="text-xs mt-1">Volte mais tarde para descobrir farmácias</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ProfileTab = () => (
    <div className="h-full w-full pb-24 md:pb-6 overflow-y-auto md:p-6 p-4 max-w-2xl">
      <h2 className="text-2xl font-black mb-6 flex items-center gap-2" style={{ color: '#072a1c' }}>
        <UserRound size={24} />
        Meu Perfil
      </h2>
      <div className="space-y-3">
        {/* Account */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fof5ee' }}>
          <button
            onClick={() => window.location.assign("/configuracoes")}
            className="w-full text-left px-4 py-4 flex items-center justify-between hover:bg-opacity-80 transition"
            style={{ backgroundColor: '#fof5ee' }}>
            <div className="flex items-center gap-3">
              <UserRound size={20} style={{ color: '#072a1c' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#072a1c' }}>Dados Pessoais</p>
                <p className="text-xs" style={{ color: '#607369' }}>Email, telefone, etc</p>
              </div>
            </div>
            <span style={{ color: '#8bc14a' }}>→</span>
          </button>
        </div>

        {/* Medical Data */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fof5ee' }}>
          <button
            onClick={() => window.location.assign("/info-medica")}
            className="w-full text-left px-4 py-4 flex items-center justify-between hover:bg-opacity-80 transition"
            style={{ backgroundColor: '#fof5ee' }}
          >
            <div className="flex items-center gap-3">
              <Stethoscope size={20} style={{ color: '#072a1c' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#072a1c' }}>Dados Médicos</p>
                <p className="text-xs" style={{ color: '#607369' }}>Alergias, medicação, histórico e observações</p>
              </div>
            </div>
            <span style={{ color: '#8bc14a' }}>→</span>
          </button>
        </div>

        {/* Orders */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fof5ee' }}>
          <button
            onClick={() => window.location.assign("/pedidos")}
            className="w-full text-left px-4 py-4 flex items-center justify-between hover:bg-opacity-80 transition"
            style={{ backgroundColor: '#fof5ee' }}>
            <div className="flex items-center gap-3">
              <ClipboardList size={20} style={{ color: '#072a1c' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#072a1c' }}>Meus Pedidos</p>
                <p className="text-xs" style={{ color: '#607369' }}>Histórico de compras</p>
              </div>
            </div>
            <span style={{ color: '#8bc14a' }}>→</span>
          </button>
        </div>

        {/* Favorites */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fof5ee' }}>
          <button
            onClick={handleOpenFavorites}
            className="w-full text-left px-4 py-4 flex items-center justify-between hover:bg-opacity-80 transition"
            style={{ backgroundColor: '#fof5ee' }}>
            <div className="flex items-center gap-3">
              <Heart size={20} style={{ color: '#072a1c' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#072a1c' }}>Favoritos</p>
                <p className="text-xs" style={{ color: '#607369' }}>Medicamentos salvos</p>
              </div>
            </div>
            <span style={{ color: '#8bc14a' }}>→</span>
          </button>
        </div>

        {/* Support */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fof5ee' }}>
          <button
            onClick={handleOpenSupport}
            className="w-full text-left px-4 py-4 flex items-center justify-between hover:bg-opacity-80 transition"
            style={{ backgroundColor: '#fof5ee' }}>
            <div className="flex items-center gap-3">
              <MessageCircle size={20} style={{ color: '#072a1c' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#072a1c' }}>Suporte</p>
                <p className="text-xs" style={{ color: '#607369' }}>Fale conosco</p>
              </div>
            </div>
            <span style={{ color: '#8bc14a' }}>→</span>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 px-4 py-3 rounded-full font-bold transition flex items-center justify-center gap-2"
          style={{ backgroundColor: '#072a1c', color: '#b5f176' }}
        >
          <LogOut size={18} />
          Sair da Conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col md:flex-row" style={{ backgroundColor: '#f7f7f7' }}>
      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex md:w-64 flex-col border-r border-slate-200 sticky top-0 h-screen" style={{ backgroundColor: '#fof5ee' }}>
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold" style={{ color: '#072a1c' }}>🏥 Brócolis</h1>
          <p className="text-xs mt-1" style={{ color: '#607369' }}>Saúde e Vida</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("explore")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition"
            style={{
              backgroundColor: activeTab === "explore" ? '#b5f176' : 'transparent',
              color: activeTab === "explore" ? '#8bc14a' : '#072a1c'
            }}
          >
            <MapIcon size={20} />
            <span>Explorar</span>
          </button>
          
          <button
            onClick={() => setActiveTab("catalog")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition"
            style={{
              backgroundColor: activeTab === "catalog" ? '#b5f176' : 'transparent',
              color: activeTab === "catalog" ? '#8bc14a' : '#072a1c'
            }}
          >
            <Package size={20} />
            <span>Catálogo</span>
          </button>
          
          <button
            onClick={() => setActiveTab("pharmacies")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition"
            style={{
              backgroundColor: activeTab === "pharmacies" ? '#b5f176' : 'transparent',
              color: activeTab === "pharmacies" ? '#8bc14a' : '#072a1c'
            }}
          >
            <Building2 size={20} />
            <span>Farmácias</span>
          </button>
          
          <button
            onClick={() => setActiveTab("profile")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition"
            style={{
              backgroundColor: activeTab === "profile" ? '#b5f176' : 'transparent',
              color: activeTab === "profile" ? '#8bc14a' : '#072a1c'
            }}
          >
            <User size={20} />
            <span>Perfil</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "explore" && ExploreTab()}
            {activeTab === "catalog" && CatalogTab()}
            {activeTab === "pharmacies" && PharmaciesTab()}
            {activeTab === "profile" && ProfileTab()}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Smart Suggestions (Explore only) */}
      {activeTab === "explore" && (
        <button
          type="button"
          onClick={handleSmartSuggestionClick}
          className="md:hidden fixed left-4 right-4 rounded-2xl p-3 shadow-xl text-left transition-all duration-500 ease-out hover:-translate-y-0.5"
          style={{
            bottom: "calc(5rem + 0.5cm)",
            zIndex: 9998,
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e0e0e0",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: "#072a1c" }}>
                {activeSmartSuggestion?.title}
              </p>
              <p className="text-xs mt-1 line-clamp-2" style={{ color: "#607369" }}>
                {activeSmartSuggestion?.description}
              </p>
            </div>
            <button
              className="w-7 h-7 rounded-full text-xs font-bold"
              style={{ background: "#b5f176", color: "#072a1c" }}
              onClick={(event) => {
                event.stopPropagation();
                setSmartSuggestionIndex((prev) => (prev + 1) % smartSuggestions.length);
              }}
              aria-label="Ver próxima sugestão"
            >
              →
            </button>
          </div>
        </button>
      )}

      {/* Mobile Bottom Navigation - Fixed across all tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl rounded-t-2xl" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
        <div className="flex justify-around items-center h-20 px-4">
          <button
            onClick={() => setActiveTab("explore")}
            className="flex flex-col items-center gap-1 py-2 flex-1 rounded-lg transition"
            style={{
              backgroundColor: activeTab === "explore" ? '#b5f176' : 'transparent',
              color: activeTab === "explore" ? '#8bc14a' : '#607369'
            }}
          >
            <MapIcon size={24} />
            <span className="text-xs font-bold">Explorar</span>
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className="flex flex-col items-center gap-1 py-2 flex-1 rounded-lg transition"
            style={{
              backgroundColor: activeTab === "catalog" ? '#b5f176' : 'transparent',
              color: activeTab === "catalog" ? '#8bc14a' : '#607369'
            }}
          >
            <Package size={24} />
            <span className="text-xs font-bold">Catálogo</span>
          </button>

          <button
            onClick={() => setActiveTab("pharmacies")}
            className="flex flex-col items-center gap-1 py-2 flex-1 rounded-lg transition"
            style={{
              backgroundColor: activeTab === "pharmacies" ? '#b5f176' : 'transparent',
              color: activeTab === "pharmacies" ? '#8bc14a' : '#607369'
            }}
          >
            <Building2 size={24} />
            <span className="text-xs font-bold">Farmácias</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className="flex flex-col items-center gap-1 py-2 flex-1 rounded-lg transition"
            style={{
              backgroundColor: activeTab === "profile" ? '#b5f176' : 'transparent',
              color: activeTab === "profile" ? '#8bc14a' : '#607369'
            }}
          >
            <User size={24} />
            <span className="text-xs font-bold">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );}
