import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Phone, Clock, Star, Loader2, AlertCircle } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">Carregando farmácias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-5xl mx-auto py-8">
        <Link href="/">
          <Button variant="ghost" className="text-white mb-8">
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
          <div className="text-center text-white space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-4xl font-black">Farmácias da Plataforma</h1>
            </div>
            <p className="text-slate-300 text-lg">
              Explore as {pharmacies.length} farmácia{pharmacies.length !== 1 ? "s" : ""} disponível{pharmacies.length !== 1 ? "s" : ""} na nossa rede
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && pharmacies.length === 0 && !error && (
            <div className="text-center text-slate-300 py-12">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhuma farmácia registada no momento</p>
            </div>
          )}

          {/* Pharmacies Grid */}
          {pharmacies.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pharmacies.map((pharmacy, index) => (
                <motion.div
                  key={pharmacy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all hover:border-blue-400/50 flex flex-col"
                >
                  <div className="space-y-4 flex-1">
                    {/* Header */}
                    <div>
                      <h3 className="text-xl font-bold text-white">{pharmacy.name}</h3>
                      {pharmacy.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-300 font-semibold text-sm">
                            {pharmacy.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm text-slate-300">
                      {pharmacy.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-teal-400 mt-1 flex-shrink-0" />
                          <span>{pharmacy.address}</span>
                        </div>
                      )}

                      {pharmacy.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                          <a 
                            href={`tel:${pharmacy.phone}`}
                            className="hover:text-white transition"
                          >
                            {pharmacy.phone}
                          </a>
                        </div>
                      )}

                      {pharmacy.hours && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-teal-400 mt-1 flex-shrink-0" />
                          <span>{pharmacy.hours}</span>
                        </div>
                      )}
                    </div>

                    {/* Badge */}
                    <div className="pt-2">
                      <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full">
                        ✓ Verificada
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-teal-400/50 text-teal-300 hover:bg-teal-500/20"
                      onClick={() => window.location.href = `tel:${pharmacy.phone}`}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Ligar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setLocation(`/catalogo?farmacia=${pharmacy.id}`)}
                    >
                      Ver Catálogo
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
