import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, PillBottle, MapPin } from "lucide-react";
import { useIdentifyPill } from "@/hooks/use-ai";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";

export default function Identify() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const { mutate: identifyPill, isPending, data: result, error, reset } = useIdentifyPill();
  const { data: allProducts, isLoading: isProductsLoading } = useProducts();

  // Verifica se há uma foto vinda do SplitSearch e inicia a análise automaticamente
  useEffect(() => {
    const savedPhoto = sessionStorage.getItem("uploadedPhoto");
    if (savedPhoto) {
      setImagePreview(savedPhoto);
      // Remove o prefixo data:image/...;base64,
      const base64Str = savedPhoto.split(',')[1];
      setImageBase64(base64Str);
      
      identifyPill({ imageBase64: base64Str });
      sessionStorage.removeItem("uploadedPhoto");
    }
  }, [identifyPill]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    // Convert to base64 and strip prefix as required by API
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Str = result.split(',')[1];
      setImageBase64(base64Str);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxFiles: 1,
    multiple: false
  });

  // Corrige conflito de tipos entre o rootProps do dropzone e o motion.div
  const { onDrag: _onDrag, ...rootProps } = getRootProps();

  const handleIdentify = () => {
    if (imageBase64) {
      identifyPill({ imageBase64 });
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageBase64(null);
    reset();
  };

  // Filter products based on recommendedProductIds from AI
  const recommendedProducts = allProducts?.filter(p =>
    result?.recommendedProductIds.includes(p.id)
  ) || [];

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-sm mb-4">
            Inteligência Artificial
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Identifique seu <span className="text-blue-600 dark:text-blue-400">Comprimido</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Tirou a pílula da cartela e esqueceu qual é? Envie uma foto e nossa IA identificará o medicamento e suas indicações para você.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Left Side: Upload Area */}
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm">1</span>
                Envie a foto
              </h2>

              <AnimatePresence mode="wait">
                {!imagePreview ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <div
                      {...rootProps}
                      className={`
                        relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
                        ${isDragActive ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}
                      `}
                    >
                      <input {...getInputProps()} />
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
                        <UploadCloud size={32} />
                      </div>
                      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {isDragActive ? 'Solte a imagem aqui...' : 'Arraste a foto ou clique'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Formatos suportados: JPEG, PNG, WEBP
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-600 bg-black aspect-square flex items-center justify-center"
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover opacity-80"
                    />

                    {isPending && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-900/40 backdrop-blur-sm z-10">
                        <div className="scan-line"></div>
                        <div className="flex flex-col items-center">
                          <RefreshCw className="text-white animate-spin mb-3" size={32} />
                          <p className="text-white font-semibold tracking-wider uppercase text-sm">Analisando imagem...</p>
                        </div>
                      </div>
                    )}

                    {!isPending && !result && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReset(); }}
                          className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl shadow-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          Trocar Foto
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleIdentify(); }}
                          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
                        >
                          Identificar
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-800">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm">{error.message}</p>
                </div>
              )}
            </div>

            {/* Right Side: Results */}
            <div className="p-8 md:p-12 bg-white dark:bg-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${result ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                  2
                </span>
                Resultado da Análise
              </h2>

              {!result ? (
                <div className="h-[300px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
                    <PillBottle size={32} />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum comprimido analisado ainda.</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-xs">Faça o upload e clique em identificar para ver os resultados aqui.</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Pílula Identificada</p>
                        <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{result.identifiedPill}</h3>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Descrição</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      {result.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Indicações Terapêuticas</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.diseases.map(d => (
                        <span key={d} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium border border-blue-100 dark:border-blue-800">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-red-500 dark:text-red-400" />
                      Farmácias Próximas com Stock
                    </h4>
                    <div className="space-y-3">
                      {[
                        { name: "Farmácia de Luanda", distance: "0.8 km", status: "Em stock" },
                        { name: "Farmácia Popular", distance: "1.5 km", status: "Poucas unidades" },
                        { name: "Farmácia Central", distance: "2.3 km", status: "Em stock" }
                      ].map((pharmacy, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{pharmacy.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{pharmacy.distance}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${pharmacy.status === 'Em stock' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                            {pharmacy.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="w-full py-3 mt-4 text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Analisar outro comprimido
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Products Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">Produtos Recomendados</h2>
                <p className="text-slate-500 dark:text-slate-400">Baseado no comprimido identificado, aqui estão opções disponíveis para compra.</p>
              </div>
            </div>

            {isProductsLoading ? (
              <div className="flex justify-center p-12">
                <RefreshCw className="animate-spin text-blue-500" size={32} />
              </div>
            ) : recommendedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedProducts.map((product, idx) => (
                  <ProductCard key={product.id} product={product} index={idx} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center border border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400 text-lg">Infelizmente, não encontramos este produto específico em nosso catálogo no momento.</p>
                <button onClick={() => window.location.href = "/"} className="mt-4 text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Ver todo o catálogo
                </button>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
