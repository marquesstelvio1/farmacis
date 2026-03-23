/**
 * DeliveryLocationPage
 *
 * Step 2 of checkout: user picks their delivery point on a map.
 * The chosen location (lat, lng, address) is stored in sessionStorage and
 * the user is taken back to Checkout.
 */
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import DeliveryMap from "@/components/DeliveryMap";
import type { DeliveryLocation } from "@/components/DeliveryMap";

export default function DeliveryLocationPage() {
    const [, setLocation] = useLocation();

    const [selected, setSelected] = useState<DeliveryLocation | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState("");
    const [initialCoords, setInitialCoords] = useState<{ lat: number; lng: number } | null>(null);

    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Called by the map component whenever the user moves the pin
    const handleLocationChange = useCallback((loc: DeliveryLocation) => {
        setSelected(loc);
    }, []);

    // GPS button – updates map centre and places pin
    const handleGPS = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsError("GPS não suportado pelo seu browser.");
            return;
        }
        setGpsLoading(true);
        setGpsError("");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsLoading(false);
                setInitialCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });

                // Also call flyToGPS if the map is already mounted
                const el = document.getElementById("delivery-map");
                if (el && (el as any).__flyToGPS) {
                    (el as any).__flyToGPS();
                }
            },
            (err) => {
                setGpsLoading(false);
                switch (err.code) {
                    case 1: setGpsError("Permissão negada. Active o GPS nas definições."); break;
                    case 2: setGpsError("Sinal GPS indisponível. Tente novamente."); break;
                    case 3: setGpsError("Tempo limite excedido. Tente novamente."); break;
                    default: setGpsError("Erro ao obter localização.");
                }
            },
            { timeout: 12000, enableHighAccuracy: true }
        );
    }, []);

    // Confirm: save to sessionStorage and go to checkout
    const handleConfirm = () => {
        if (!selected) return;
        sessionStorage.setItem("deliveryLocation", JSON.stringify(selected));
        setLocation("/checkout");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">

            {/* ── Header ── */}
            <header className="px-4 py-4 flex items-center gap-3">
                <Button
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                    onClick={() => history.back()}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </Button>
                <div>
                    <h1 className="text-white font-bold text-lg">Escolher Local de Entrega</h1>
                    <p className="text-blue-200 text-xs">Toque no mapa ou use o GPS para definir o ponto</p>
                </div>
            </header>

            {/* ── Map ── */}
            <div className="flex-1 px-4 pb-4 flex flex-col gap-4">

                {/* Instructions banner */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 text-white"
                >
                    <MapPin className="w-5 h-5 text-blue-300 shrink-0" />
                    <p className="text-sm">
                        <strong>Toque no mapa</strong> para colocar o pin de entrega, ou arraste-o depois de colocado.
                    </p>
                </motion.div>

                {/* GPS button */}
                <Button
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2 w-full"
                    onClick={handleGPS}
                    disabled={gpsLoading}
                >
                    {gpsLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> A obter localização GPS...</>
                        : <><Navigation className="w-4 h-4" /> Usar a minha localização actual</>
                    }
                </Button>

                {gpsError && (
                    <div className="bg-amber-500/20 border border-amber-400/40 rounded-lg p-3 flex items-start gap-2 text-amber-200">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-sm">{gpsError}</p>
                    </div>
                )}

                {/* Map */}
                <div
                    ref={mapContainerRef}
                    className="flex-1 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
                    style={{ minHeight: "380px" }}
                >
                    <DeliveryMap
                        initialLat={initialCoords?.lat}
                        initialLng={initialCoords?.lng}
                        onChange={handleLocationChange}
                        className="w-full h-full"
                    />
                </div>

                {/* Selected location info */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: selected ? 1 : 0.4, y: 0 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                >
                    {selected ? (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm">Local seleccionado</p>
                                <p className="text-blue-200 text-xs mt-1 break-words">{selected.address}</p>
                                <p className="text-blue-300/70 text-xs font-mono mt-1">
                                    {parseFloat(selected.lat).toFixed(5)}, {parseFloat(selected.lng).toFixed(5)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-blue-200">
                            <MapPin className="w-5 h-5 shrink-0" />
                            <p className="text-sm">Nenhum local seleccionado. Toque no mapa.</p>
                        </div>
                    )}
                </motion.div>

                {/* Confirm button */}
                <Button
                    onClick={handleConfirm}
                    disabled={!selected}
                    className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Confirmar Local de Entrega
                </Button>

            </div>
        </div>
    );
}
