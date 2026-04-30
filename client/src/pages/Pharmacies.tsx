import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Phone, Clock, Star, Loader2, AlertCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  hours: string;
  latitude?: string;
  longitude?: string;
  rating?: number;
  createdAt?: string;
}

export default function Pharmacies() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/pharmacies");
        
        if (!response.ok) {
          throw new Error("Erro ao carregar farmácias");
        }

        const data = await response.json();
        setPharmacies(Array.isArray(data) ? data : data.pharmacies || []);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar farmácias");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faf6" }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "#8bc14a" }} />
          <p className="font-semibold" style={{ color: "#072a1c" }}>Carregando farmácias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ background: "#f8faf6" }}>
      <div className="max-w-5xl mx-auto py-8">
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-8 hover:scale-105 transition"
            style={{ color: "#072a1c", background: "rgba(181, 241, 118, 0.4)" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-black" style={{ color: "#072a1c" }}>Farmácias da Plataforma</h1>
            <p className="text-lg" style={{ color: "#607369" }}>
              Explore as {pharmacies.length} farmácia{pharmacies.length !== 1 ? "s" : ""} disponível{pharmacies.length !== 1 ? "s" : ""} na nossa rede
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
              <p style={{ color: "#ef4444" }}>{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && pharmacies.length === 0 && !error && (
            <div className="text-center py-12" style={{ color: "#607369" }}>
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhuma farmácia registada no momento</p>
            </div>
          )}

          {/* Pharmacies Grid */}
          {pharmacies.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {pharmacies.map((pharmacy, index) => (
                <motion.div
                  key={pharmacy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-lg hover:-translate-y-1"
                  style={{ background: "#ffffff", border: "1px solid #dce4d7" }}
                >
                  {/* Pharmacy Image Placeholder */}
                  <div 
                    className="w-full h-48 bg-gray-200 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)" }}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mx-auto mb-2">
                        <MapPin className="w-8 h-8" style={{ color: "#8bc14a" }} />
                      </div>
                      <span className="text-sm" style={{ color: "#607369" }}>Imagem da Farmácia</span>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xl font-bold leading-tight" style={{ color: "#000000" }}>{pharmacy.name}</h3>
                      {pharmacy.rating ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-100">
                          <Star className="w-3.5 h-3.5 fill-yellow-400" style={{ color: "#fbbf24" }} />
                          <span className="font-semibold text-xs" style={{ color: "#d97706" }}>
                            {pharmacy.rating.toFixed(1)}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm" style={{ color: "#607369" }}>
                      {pharmacy.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: "#8bc14a" }} />
                          <span>{pharmacy.address}</span>
                        </div>
                      )}

                      {pharmacy.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" style={{ color: "#8bc14a" }} />
                          <a 
                            href={`tel:${pharmacy.phone}`}
                            className="transition hover:opacity-80"
                            style={{ color: "#607369" }}
                          >
                            {pharmacy.phone}
                          </a>
                        </div>
                      )}

                      {pharmacy.hours && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: "#8bc14a" }} />
                          <span>{pharmacy.hours}</span>
                        </div>
                      )}
                    </div>

                    {/* Badge */}
                    <div className="pt-1">
                      <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-green-100" style={{ color: "#8bc14a" }}>
                        ✓ Verificada
                      </span>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="px-6 pb-5 pt-4 border-t" style={{ borderColor: "#dce4d7" }}>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:scale-[1.02] transition"
                        style={{ borderColor: "#8bc14a", color: "#8bc14a" }}
                        onClick={() => window.location.href = `tel:${pharmacy.phone}`}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Ligar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 hover:scale-[1.02] transition text-white"
                        style={{ background: "#072a1c" }}
                        onClick={() => setLocation(`/catalogo?farmacia=${pharmacy.id}`)}
                      >
                        Ver Catálogo
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 transition hover:bg-slate-50"
                      style={{ color: "#607369" }}
                      onClick={() => setLocation(`/farmacia/${pharmacy.id}/comentarios`)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Ver Comentários
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
