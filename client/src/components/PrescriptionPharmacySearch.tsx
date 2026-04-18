import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Star,
  ShoppingCart,
  Store,
  Check,
  AlertCircle,
  CreditCard,
  Wallet,
  ArrowLeft,
  ArrowRight,
  Package,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Medication {
  nome: string;
  dosagem: string;
  quantidade?: string;
  periodo_consumo?: string;
  frequencia?: string;
}

interface PharmacyProduct {
  productId: number;
  productName: string;
  dosage: string;
  price: number;
  stock: number;
  quantity: number;
  totalPrice: number;
}

interface PharmacyResult {
  pharmacyId: number;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyPhone: string;
  pharmacyLat: number;
  pharmacyLng: number;
  pharmacyLogo?: string;
  rating: number;
  ratingCount: number;
  paymentMethods: string[];
  distance?: number;
  products: PharmacyProduct[];
  totalPrice: number;
  hasAllProducts: boolean;
  missingProducts: string[];
}

interface PrescriptionSearchProps {
  medications: Medication[];
  onBack: () => void;
  onOrder: (selectedPharmacies: { pharmacyId: number; products: number[] }[]) => void;
}

export function PrescriptionPharmacySearch({ medications, onBack, onOrder }: PrescriptionSearchProps) {
  const [results, setResults] = useState<PharmacyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');
  const [selectedPharmacies, setSelectedPharmacies] = useState<Map<number, number[]>>(new Map());
  const [expandedPharmacies, setExpandedPharmacies] = useState<Set<number>>(new Set());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          console.log("Location access denied, will search without distance");
        }
      );
    }
  }, []);

  // Search for pharmacies when medications or location changes
  useEffect(() => {
    const searchPharmacies = async () => {
      if (!medications.length) return;

      setLoading(true);
      try {
        const response = await fetch("/api/prescription/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medications,
            userLat: userLocation?.lat,
            userLng: userLocation?.lng,
            sortBy
          })
        });

        if (!response.ok) {
          throw new Error("Erro na busca");
        }

        const data = await response.json();
        setResults(data.pharmacies || []);

        // Auto-select first pharmacy with all products if exists
        const firstComplete = data.pharmacies?.find((p: PharmacyResult) => p.hasAllProducts);
        if (firstComplete) {
          setSelectedPharmacies(new Map([[firstComplete.pharmacyId, firstComplete.products.map(p => p.productId)]]));
        }
      } catch (error) {
        toast({
          title: "Erro na busca",
          description: "Não foi possível buscar farmácias",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    searchPharmacies();
  }, [medications, userLocation, sortBy]);

  // Toggle pharmacy expansion
  const toggleExpand = (pharmacyId: number) => {
    setExpandedPharmacies(prev => {
      const next = new Set(prev);
      if (next.has(pharmacyId)) {
        next.delete(pharmacyId);
      } else {
        next.add(pharmacyId);
      }
      return next;
    });
  };

  // Toggle pharmacy selection
  const togglePharmacySelection = (pharmacy: PharmacyResult) => {
    setSelectedPharmacies(prev => {
      const next = new Map(prev);
      if (next.has(pharmacy.pharmacyId)) {
        next.delete(pharmacy.pharmacyId);
      } else {
        next.set(pharmacy.pharmacyId, pharmacy.products.map(p => p.productId));
      }
      return next;
    });
  };

  // Calculate grand total from selected pharmacies
  const calculateGrandTotal = () => {
    let total = 0;
    selectedPharmacies.forEach((productIds, pharmacyId) => {
      const pharmacy = results.find(p => p.pharmacyId === pharmacyId);
      if (pharmacy) {
        // Only count selected products
        const selectedProducts = pharmacy.products.filter(p => productIds.includes(p.productId));
        total += selectedProducts.reduce((sum, p) => sum + p.totalPrice, 0);
      }
    });
    return total;
  };

  // Check if all medications are covered by selected pharmacies
  const checkAllMedicationsCovered = () => {
    const allSelectedProductIds: number[] = [];
    selectedPharmacies.forEach((productIds) => {
      allSelectedProductIds.push(...productIds);
    });

    // Check if we have at least one product for each medication
    return medications.every(med => {
      return results.some(pharmacy => {
        if (!selectedPharmacies.has(pharmacy.pharmacyId)) return false;
        return pharmacy.products.some(p =>
          p.productName.toLowerCase().includes(med.nome.toLowerCase()) ||
          med.nome.toLowerCase().includes(p.productName.toLowerCase())
        );
      });
    });
  };

  // Get payment method icon
  const getPaymentIcon = (method: string) => {
    if (method === 'transferencia') return <Banknote className="w-4 h-4" />;
    if (method === 'multicaixa_express') return <CreditCard className="w-4 h-4" />;
    return <Wallet className="w-4 h-4" />;
  };

  // Format payment method name
  const formatPaymentMethod = (method: string) => {
    const names: Record<string, string> = {
      'transferencia': 'Transferência',
      'multicaixa_express': 'Multicaixa Express',
      'cash': 'Dinheiro'
    };
    return names[method] || method;
  };

  const handleOrder = () => {
    const orderData: { pharmacyId: number; products: number[] }[] = [];
    selectedPharmacies.forEach((productIds, pharmacyId) => {
      orderData.push({ pharmacyId, products: productIds });
    });
    onOrder(orderData);
  };

  const allMedicationsCovered = checkAllMedicationsCovered();
  const selectedCount = selectedPharmacies.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Farmácias Encontradas</h2>
          <p className="text-sm text-slate-500">
            {medications.length} medicamento(s) na receita
          </p>
        </div>
      </div>

      {/* Medications Summary */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-800">Medicamentos na Receita</span>
        </div>
        <div className="space-y-2">
          {medications.map((med, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {med.nome} <span className="text-slate-500">({med.dosagem})</span>
              </span>
              {med.quantidade && (
                <Badge variant="secondary" className="text-xs">
                  Qtd: {med.quantidade}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Ordenar por:</span>
        <div className="flex gap-1">
          {(['distance', 'price', 'rating'] as const).map((option) => (
            <Button
              key={option}
              variant={sortBy === option ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy(option)}
              className="text-xs"
            >
              {option === 'distance' && <MapPin className="w-3 h-3 mr-1" />}
              {option === 'price' && <Wallet className="w-3 h-3 mr-1" />}
              {option === 'rating' && <Star className="w-3 h-3 mr-1" />}
              {option === 'distance' ? 'Distância' : option === 'price' ? 'Preço' : 'Avaliação'}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-500">Buscando farmácias...</p>
        </div>
      ) : results.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Nenhuma farmácia encontrada
          </h3>
          <p className="text-slate-500">
            Não encontramos farmácias com estes medicamentos no momento.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary Alert */}
          {!allMedicationsCovered && selectedCount > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Atenção: Receita Incompleta</p>
                <p className="text-sm text-amber-700">
                  As farmácias selecionadas não têm todos os medicamentos.
                  Você pode selecionar múltiplas farmácias para completar a receita.
                </p>
              </div>
            </div>
          )}

          {/* Pharmacy Cards */}
          {results.map((pharmacy) => {
            const isSelected = selectedPharmacies.has(pharmacy.pharmacyId);
            const isExpanded = expandedPharmacies.has(pharmacy.pharmacyId);

            return (
              <motion.div
                key={pharmacy.pharmacyId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  isSelected ? 'border-green-500 bg-green-50/50' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    <button
                      onClick={() => togglePharmacySelection(pharmacy)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-300 hover:border-green-400'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>

                    {/* Pharmacy Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800">{pharmacy.pharmacyName}</h3>
                        {pharmacy.hasAllProducts && (
                          <Badge className="bg-green-100 text-green-700">
                            Tem tudo
                          </Badge>
                        )}
                        {!pharmacy.hasAllProducts && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Parcial
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        {pharmacy.distance !== undefined && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {pharmacy.distance} km
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          {pharmacy.rating.toFixed(1)} ({pharmacy.ratingCount})
                        </span>
                        <span className="flex items-center gap-1">
                          <Wallet className="w-4 h-4" />
                          {pharmacy.totalPrice.toLocaleString('pt-AO', {
                            style: 'currency',
                            currency: 'AOA'
                          })}
                        </span>
                      </div>

                      {/* Payment Methods */}
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {pharmacy.paymentMethods.map(method => (
                          <Badge
                            key={method}
                            variant="secondary"
                            className="text-xs flex items-center gap-1"
                          >
                            {getPaymentIcon(method)}
                            {formatPaymentMethod(method)}
                          </Badge>
                        ))}
                      </div>

                      {/* Address */}
                      <p className="text-sm text-slate-500 mt-2 truncate">
                        {pharmacy.pharmacyAddress}
                      </p>

                      {/* Missing Products Warning */}
                      {!pharmacy.hasAllProducts && pharmacy.missingProducts.length > 0 && (
                        <p className="text-xs text-amber-600 mt-2">
                          Não tem: {pharmacy.missingProducts.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => toggleExpand(pharmacy.pharmacyId)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Product List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-slate-200 pt-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">
                          Produtos Disponíveis ({pharmacy.products.length})
                        </h4>
                        <div className="space-y-2">
                          {pharmacy.products.map((product) => (
                            <div
                              key={product.productId}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border"
                            >
                              <div>
                                <p className="font-medium text-sm text-slate-800">
                                  {product.productName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {product.dosage} • Qtd: {product.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-800">
                                  {product.totalPrice.toLocaleString('pt-AO', {
                                    style: 'currency',
                                    currency: 'AOA'
                                  })}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {product.price.toLocaleString('pt-AO', {
                                    style: 'currency',
                                    currency: 'AOA'
                                  })} cada
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bottom Action Bar */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg"
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {selectedCount} farmácia(s) selecionada(s)
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {calculateGrandTotal().toLocaleString('pt-AO', {
                  style: 'currency',
                  currency: 'AOA'
                })}
              </p>
            </div>
            <Button
              onClick={handleOrder}
              disabled={!allMedicationsCovered}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {allMedicationsCovered ? 'Fazer Pedido' : 'Falta Medicamentos'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Spacer for bottom bar */}
      {selectedCount > 0 && <div className="h-24" />}
    </div>
  );
}
