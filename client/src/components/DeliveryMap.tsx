/**
 * DeliveryMap – interactive Leaflet map for selecting a delivery point.
 *
 * Features:
 *  • Click anywhere on the map to place/move the delivery pin.
 *  • "Use my location" button that zooms to GPS coordinates.
 *  • Reverse geocoding via OpenStreetMap Nominatim (free, no API key).
 *  • Reports { lat, lng, address } back to the parent via onChange.
 */
import { useEffect, useRef, useCallback } from "react";
import type { Map as LMap } from "leaflet";
import "leaflet/dist/leaflet.css";


export interface DeliveryLocation {
    lat: string;
    lng: string;
    address: string;
}

interface Props {
    initialLat?: number;
    initialLng?: number;
    onChange: (loc: DeliveryLocation) => void;
    className?: string;
}

// Default centre: Luanda, Angola
const DEFAULT_LAT = -8.8368;
const DEFAULT_LNG = 13.2343;
const DEFAULT_ZOOM = 13;

// ── Nominatim reverse geocoding ──
async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt`;
        const res = await fetch(url, {
            headers: { "User-Agent": "Farmacis-App/1.0" },
        });
        const data = await res.json();
        if (data.display_name) {
            // Shorten the address: take up to the first 3 parts
            const parts: string[] = data.display_name.split(",").slice(0, 4);
            return parts.map((p: string) => p.trim()).join(", ");
        }
    } catch {/* silent */ }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export default function DeliveryMap({
    initialLat,
    initialLng,
    onChange,
    className = "",
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<LMap | null>(null);
    const markerRef = useRef<any>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const placePin = useCallback(async (lat: number, lng: number) => {
        if (!mapRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            // Custom icon (red pin)
            const icon = L.divIcon({
                html: `
          <div style="
            width:32px;height:42px;position:relative;
          ">
            <svg viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.16 0 0 7.16 0 16c0 10.97 14.21 24.56 15.33 25.62a.99.99 0 0 0 1.34 0C17.79 40.56 32 26.97 32 16 32 7.16 24.84 0 16 0z" fill="#2563eb"/>
              <circle cx="16" cy="16" r="7" fill="white"/>
            </svg>
          </div>`,
                className: "",
                iconSize: [32, 42],
                iconAnchor: [16, 42],
                popupAnchor: [0, -42],
            });
            markerRef.current = L.marker([lat, lng], {
                icon,
                draggable: true,
            }).addTo(mapRef.current);

            markerRef.current.on("dragend", async () => {
                const pos = markerRef.current.getLatLng();
                const address = await reverseGeocode(pos.lat, pos.lng);
                onChangeRef.current({
                    lat: pos.lat.toFixed(7),
                    lng: pos.lng.toFixed(7),
                    address,
                });
            });
        }

        const address = await reverseGeocode(lat, lng);
        onChangeRef.current({
            lat: lat.toFixed(7),
            lng: lng.toFixed(7),
            address,
        });
    }, []);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Dynamic import of Leaflet so Vite doesn't SSR-break
        import("leaflet").then((L) => {
            // Expose globally so icon fix works
            (window as any).L = L.default ?? L;
            const Lf = (window as any).L;

            // Fix default marker icons broken by Webpack/Vite
            delete (Lf.Icon.Default.prototype as any)._getIconUrl;
            Lf.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const startLat = initialLat ?? DEFAULT_LAT;
            const startLng = initialLng ?? DEFAULT_LNG;

            const map = Lf.map(containerRef.current!, {
                center: [startLat, startLng],
                zoom: DEFAULT_ZOOM,
                zoomControl: true,
            });

            Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            // Click to place pin
            map.on("click", (e: any) => {
                placePin(e.latlng.lat, e.latlng.lng);
                map.panTo([e.latlng.lat, e.latlng.lng]);
            });

            mapRef.current = map;

            // If initial coordinates provided (e.g. from GPS), place pin immediately
            if (initialLat && initialLng) {
                placePin(initialLat, initialLng);
            }
        });

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // "Use my location" button handler – exposed via data attribute
    const flyToGPS = useCallback(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                mapRef.current?.flyTo([latitude, longitude], 16, { duration: 1.5 });
                placePin(latitude, longitude);
            },
            () => alert("Não foi possível obter a sua localização. Verifique as permissões do browser."),
            { timeout: 10000, enableHighAccuracy: true }
        );
    }, [placePin]);

    // Expose flyToGPS on the container element so Checkout can call it
    useEffect(() => {
        if (containerRef.current) {
            (containerRef.current as any).__flyToGPS = flyToGPS;
        }
    }, [flyToGPS]);

    return (
        <div
            ref={containerRef}
            id="delivery-map"
            className={className}
            style={{ minHeight: "320px", borderRadius: "12px", overflow: "hidden" }}
        />
    );
}
