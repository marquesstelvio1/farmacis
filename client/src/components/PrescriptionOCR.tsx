import { useState, useRef, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { X, Loader2, Pill, Camera, Check, ExternalLink, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PrescriptionPharmacySearch } from "./PrescriptionPharmacySearch";
import { useToast } from "@/hooks/use-toast";

interface Medication {
  nome: string;
  dosagem: string;
  marca?: string;
  quantidade?: string;
  periodo_consumo?: string;
  frequencia?: string;
}

interface OCRResult {
  medications: Medication[];
  formatted: string;
}

type ViewState = 'upload' | 'results' | 'pharmacy-search';

export function PrescriptionOCR() {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('upload');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract unique brands from medications
  const availableBrands = useMemo(() => {
    if (!result?.medications) return [];
    const brands = new Set<string>();
    result.medications.forEach(med => {
      if (med.marca) brands.add(med.marca);
    });
    return Array.from(brands).sort();
  }, [result]);

  // Filter medications by brand
  const filteredMedications = useMemo(() => {
    if (!result?.medications) return [];
    if (!brandFilter) return result.medications;
    return result.medications.filter(med =>
      med.marca?.toLowerCase().includes(brandFilter.toLowerCase()) ||
      med.nome.toLowerCase().includes(brandFilter.toLowerCase())
    );
  }, [result, brandFilter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload and process
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ocr/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao processar imagem");
      }

      const data = await response.json();
      const medications = data.medications || [];
      setResult({
        medications,
        formatted: data.formatted || "",
      });

      // Se encontrou medicamentos, vai automaticamente para busca de farmácias
      if (medications.length > 0) {
        setViewState('pharmacy-search');
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar imagem");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processImage(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const clear = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    setViewState('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSearchPharmacies = () => {
    if (result?.medications.length) {
      console.log('[PrescriptionOCR] Starting pharmacy search with medications:', result.medications);
      setViewState('pharmacy-search');
    } else {
      toast({
        title: "Sem medicamentos",
        description: "Não há medicamentos para pesquisar",
        variant: "destructive"
      });
    }
  };

  const handleBackToResults = () => {
    setViewState('results');
  };

  const handleOrder = (selectedPharmacies: { pharmacyId: number; products: number[] }[]) => {
    // Navigate to checkout with selected pharmacies
    const orderData = {
      pharmacies: selectedPharmacies,
      medications: result?.medications,
      timestamp: new Date().toISOString()
    };
    // Store in sessionStorage for checkout page
    sessionStorage.setItem('prescriptionOrder', JSON.stringify(orderData));
    // Navigate to checkout
    window.location.href = '/checkout?type=prescription';
  };

  // Copy formatted string to clipboard
  const copyToClipboard = () => {
    if (result?.formatted) {
      navigator.clipboard.writeText(result.formatted);
    }
  };

  // Pharmacy Search View
  if (viewState === 'pharmacy-search' && result?.medications) {
    return (
      <PrescriptionPharmacySearch
        medications={result.medications}
        onBack={handleBackToResults}
        onOrder={handleOrder}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Upload Area */}
      {!preview && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <Camera className="w-12 h-12 text-gray-400" />
            <p className="font-medium text-gray-700">
              Arraste uma receita ou clique para carregar
            </p>
            <p className="text-sm text-gray-500">
              JPG, PNG (max 10MB)
            </p>
          </div>
        </div>
      )}

      {/* Preview & Results */}
      {preview && (
        <Card className="p-4 space-y-4">
          <div className="flex items-start gap-4">
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Imagem carregada</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-600 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A extrair medicamentos...</span>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {result && result.medications.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">
                  {filteredMedications.length} de {result.medications.length} medicamento(s) encontrado(s)
                </span>
              </div>

              {/* Brand Filter */}
              {availableBrands.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Filtrar por marca:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setBrandFilter('')}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        brandFilter === ''
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'
                      }`}
                    >
                      Todas
                    </button>
                    {availableBrands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setBrandFilter(brand === brandFilter ? '' : brand)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          brandFilter === brand
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                  {brandFilter && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>Filtrando por: <strong>{brandFilter}</strong></span>
                      <button
                        onClick={() => setBrandFilter('')}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        (limpar)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Medications List - Clickable Links */}
              <div className="space-y-2">
                {filteredMedications.map((med, idx) => (
                  <Link
                    key={idx}
                    to={`/catalogo?search=${encodeURIComponent(`${med.nome} ${med.dosagem} ${med.marca || ''}`)}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors group"
                  >
                    <Pill className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium group-hover:text-blue-700">{med.nome}</p>
                      <p className="text-sm text-gray-600">
                        {med.dosagem}{med.marca ? ` • ${med.marca}` : ''}
                      </p>
                      {med.quantidade && (
                        <p className="text-xs text-gray-500">{med.quantidade}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </Link>
                ))}
              </div>

              {/* Search Pharmacies Button */}
              <Button
                onClick={() => {
                  if (filteredMedications.length) {
                    // Create temporary result with filtered medications
                    setResult({ ...result, medications: filteredMedications });
                    setViewState('pharmacy-search');
                  }
                }}
                disabled={filteredMedications.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar Farmácias com Preços
                {brandFilter && ` (Marca: ${brandFilter})`}
              </Button>

              {/* Search All in Catalog Button */}
              <Link
                to={`/catalogo?search=${encodeURIComponent(filteredMedications.map(m => `${m.nome} ${m.dosagem} ${m.marca || ''}`).join(', '))}`}
                className="block w-full"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Pesquisar no Catálogo
                  {brandFilter && ` (Marca: ${brandFilter})`}
                </Button>
              </Link>

              {/* Formatted String for Catalog */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">
                    Pesquisa multipla (nome, dosagem)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        filteredMedications.map(m => `${m.nome}${m.marca ? ` (${m.marca})` : ''}, ${m.dosagem}`).join('; ')
                      );
                    }}
                    className="h-6 text-blue-600"
                  >
                    Copiar
                  </Button>
                </div>
                <code className="block text-sm bg-white p-2 rounded border">
                  {filteredMedications.map(m => `${m.nome}${m.marca ? ` (${m.marca})` : ''}, ${m.dosagem}`).join('; ')}
                </code>
              </div>
            </div>
          )}

          {result && result.medications.length === 0 && !error && (
            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              Nenhum medicamento encontrado na imagem. Tente uma foto mais nítida.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
