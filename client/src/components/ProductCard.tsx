import { ShoppingCart, Plus, X, Store, FileText, MapPin, Globe, Minus, Trash2, Percent, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { type ProductResponse } from "@shared/routes";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface ProductVariant {
  id: number;
  origin: string | null;
  dosage: string | null;
  price: string;
  precoBase: string | null;
  stock: number;
  pharmacyId: number | null;
  pharmacyName: string | null;
  distance?: number | null;
  activeDiscount?: { percentage: string } | null;
}

interface ProductCardProps {
  product: ProductResponse;
  variants?: ProductVariant[];
  index?: number;
  distance?: number | null;
}

export function ProductCard({ product, variants = [], index = 0, distance }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const removeItem = useCart((state) => state.removeItem);
  const items = useCart((state) => state.items);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Consolidar o produto principal com as suas variantes (Português/Indiano)
  const mainVariant: ProductVariant = {
    id: product.id,
    origin: product.origin ?? 'default',
    dosage: product.dosage ?? null,
    price: String(product.price),
    precoBase: product.precoBase ? String(product.precoBase) : String(product.price),
    stock: product.stock,
    pharmacyId: product.pharmacyId ?? null,
    pharmacyName: product.pharmacyName ?? null,
    distance: distance,
    activeDiscount: (product as any).activeDiscount
  };

  // Generate virtual variants from columns if they exist and are > 0
  const virtualVariants: ProductVariant[] = [];

  if (product.precoPortugues && parseFloat(String(product.precoPortugues)) > 0) {
    virtualVariants.push({
      ...mainVariant,
      id: product.id, // Use same ID or handle as needed
      origin: 'portugues',
      price: String(product.precoPortugues),
      precoBase: String(product.precoPortugues),
    });
  }

  if (product.precoIndiano && parseFloat(String(product.precoIndiano)) > 0) {
    virtualVariants.push({
      ...mainVariant,
      id: product.id,
      origin: 'indiano',
      price: String(product.precoIndiano),
      precoBase: String(product.precoIndiano),
    });
  }

  // Combine passed variants with virtual ones, avoiding duplicates if possible
  const allVariants: ProductVariant[] = [
    mainVariant,
    ...virtualVariants,
    ...variants.filter(v => v.origin !== 'portugues' && v.origin !== 'indiano')
  ];

  // Get the currently selected variant or default to first
  const currentVariant = selectedVariant || allVariants[0];

  // Get the active discount from the current variant or the main product
  const activeDiscount = currentVariant.activeDiscount || (product as any).activeDiscount;

  // Get quantity of current item in cart (after currentVariant is defined)
  const cartItem = items.find(item => item.id === currentVariant.id);
  const quantity = cartItem?.quantity || 0;

  // Cálculo do preço com desconto apenas para exibição (sem alterar o valor base)
  const basePriceValue = Number(currentVariant.price || currentVariant.precoBase);
  const discountPercent = activeDiscount ? parseFloat(activeDiscount.percentage) : 0;
  const finalPrice = discountPercent > 0 ? basePriceValue * (1 - discountPercent / 100) : basePriceValue;
  const hasDiscount = discountPercent > 0;

  const getOriginLabel = (origin: string | null) => {
    switch (origin) {
      case 'portugues': return 'Português';
      case 'indiano': return 'Indiano';
      default: return 'Padrão';
    }
  };

  const getOriginFlag = (origin: string | null) => {
    switch (origin) {
      case 'portugues': return '🇵🇹';
      case 'indiano': return '🇮🇳';
      default: return '🏥';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200 hover:border-green-300 transition-all duration-300 flex flex-col h-full"
      >
        {/* Clickable Area for Product Detail */}
        <Link href={`/produto/${product.id}`} className="absolute inset-0 z-10" aria-label={`Ver detalhes de ${product.name}`} />
        <div className="relative h-48 w-full mb-5 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100">
          <img
            src={product.imageUrl ?? undefined}
            alt={product.name}
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          />
          {/* Discount Flag - Top Left */}
          {hasDiscount && (
            <div
              className={`absolute ${product.prescriptionRequired ? 'top-14' : 'top-3'} left-0 bg-red-600 text-white pl-3 pr-4 py-1 rounded-r-full text-xs font-black shadow-lg z-20 flex items-center gap-1 border-y border-r border-white/30`}
              style={{
                boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
                clipPath: 'polygon(0% 0%, 100% 0%, 85% 50%, 100% 100%, 0% 100%)'
              }}
            >
              <Percent size={10} className="text-white" />
              <span>-{activeDiscount.percentage}%</span>
            </div>
          )}

          {currentVariant.origin && currentVariant.origin !== 'default' && (
            <div className={`absolute bottom-3 right-3 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 border-2 ${currentVariant.origin === 'portugues'
              ? 'bg-red-500/90 text-white border-red-300'
              : currentVariant.origin === 'indiano'
                ? 'bg-orange-500/90 text-white border-orange-300'
                : 'bg-green-600/90 text-white border-green-300'
              }`}>
              <span className="text-sm leading-none">{getOriginFlag(currentVariant.origin)}</span>
              {getOriginLabel(currentVariant.origin)}
            </div>
          )}
          {product.prescriptionRequired && (
            <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1.5 border border-red-300">
              <FileText size={12} />
              Receita
            </div>
          )}
          {/* Stock Badge - Bottom Left */}
          <div className={`absolute bottom-3 left-3 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1.5 ${currentVariant.stock > 0
            ? 'bg-green-500/90 text-white border border-green-300'
            : 'bg-gray-500/90 text-white border border-gray-300'
            }`}>
            <div className={`h-1.5 w-1.5 rounded-full ${currentVariant.stock > 0 ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
            {currentVariant.stock > 0 ? 'Em Stock' : 'Esgotado'}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{product.name}</h3>

          {/* Dosage Badge */}
          {currentVariant.dosage && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-800 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 px-3 py-1.5 rounded-xl shadow-sm">
                <span className="text-green-600">●</span>
                {currentVariant.dosage}
              </span>
            </div>
          )}

          <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
            {product.description}
          </p>


          {/* Disease tags - Modern pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(product.diseases ?? []).slice(0, 3).map((disease: string) => (
              <span key={disease} className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors cursor-default">
                {disease}
              </span>
            ))}
            {(product.diseases?.length ?? 0) > 3 && (
              <span className="text-[10px] font-bold px-3 py-1.5 bg-green-100 text-green-700 rounded-full border border-green-200">
                +{(product.diseases?.length ?? 0) - 3}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-green-100">
            <div className="flex flex-col gap-1">
              {/* Price Display - Shows origin selection if variants exist */}
              {allVariants.length > 1 ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Origem:</span>
                  <div className="flex flex-wrap gap-2">
                    {allVariants.map(v => (
                      <button
                        key={`${v.id}-${v.origin ?? 'default'}`}
                        onClick={() => setSelectedVariant(v)}
                        className={`flex flex-col p-1.5 rounded-lg border-2 transition-all ${currentVariant.id === v.id
                          ? 'bg-green-50 border-green-500 scale-105 shadow-sm'
                          : 'bg-white border-transparent hover:border-slate-200'
                          }`}
                      >
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v.origin === 'portugues' ? 'bg-red-100 text-red-700' : v.origin === 'indiano' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {getOriginFlag(v.origin)} {v.origin === 'portugues' ? 'PT' : v.origin === 'indiano' ? 'IN' : 'Base'}
                        </span>
                        {(() => {
                          const vDiscount = v.activeDiscount || (product as any).activeDiscount;
                          const vDiscountPercent = vDiscount ? parseFloat(vDiscount.percentage) : 0;
                          const vPriceValue = Number(v.price);
                          const vFinalPrice = vDiscountPercent > 0 ? vPriceValue * (1 - vDiscountPercent / 100) : vPriceValue;
                          return (
                            <span className={`text-xs font-black ${currentVariant.id === v.id ? 'text-green-600' : 'text-slate-500'
                              }`}>
                              {vFinalPrice.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                            </span>
                          );
                        })()}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Single or Default Price Display - Always show badge for currently selected */
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded border ${currentVariant.origin === 'portugues'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : currentVariant.origin === 'indiano'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                      {getOriginFlag(currentVariant.origin)} {getOriginLabel(currentVariant.origin)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-green-600 leading-none">
                      {finalPrice.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </span>
                    {(Number(currentVariant.precoBase) > finalPrice || hasDiscount) && (
                      <span className="text-xs text-slate-400 line-through font-medium">
                        {basePriceValue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Pharmacy Info - Compact */}
              {currentVariant.pharmacyName && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 py-0.5 px-2 bg-green-50 rounded-md border border-green-100">
                    <Store size={9} className="text-green-600" />
                    <span className="text-[10px] font-bold text-green-700 truncate max-w-[80px]">
                      {currentVariant.pharmacyName}
                    </span>
                  </div>
                  {currentVariant.distance !== undefined && currentVariant.distance !== null && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-green-600">
                      <MapPin size={8} />
                      {currentVariant.distance < 1 ? `${(currentVariant.distance * 1000).toFixed(0)}m` : `${currentVariant.distance.toFixed(1)}km`}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Price and Buy Button Section */}
            <div className="mt-auto pt-4 border-t-2 border-green-100">
              {/* Quantity Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Qtd:</span>
                  <span className="text-sm font-bold text-slate-700">{currentVariant.stock} un.</span>
                </div>
                {quantity > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                    {quantity} no carrinho
                  </Badge>
                )}
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-black text-green-600">
                  {finalPrice.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through">
                    {basePriceValue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                )}
              </div>

              {/* Buy Button */}
              <div className="flex gap-2">
                {quantity > 0 ? (
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex items-center gap-1 bg-green-500 rounded-xl px-2 py-2 shadow-md flex-1 justify-center">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(currentVariant.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
                      >
                        {quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                      </button>
                      <span className="w-8 text-center text-base font-bold text-white">{quantity}</span>
                      <button
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          currentVariant.stock > 0 && addItem({
                            ...product,
                            id: currentVariant.id,
                            price: finalPrice.toString(),
                            origin: currentVariant.origin,
                            dosage: currentVariant.dosage
                          });
                        }}
                        disabled={currentVariant.stock <= 0}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <Link href="/checkout">
                      <Button 
                        className="h-12 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Button
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      if (currentVariant.stock > 0) {
                        addItem({
                          ...product,
                          id: currentVariant.id,
                          price: finalPrice.toString(),
                          origin: currentVariant.origin,
                          dosage: currentVariant.dosage
                        });
                      }
                    }}
                    disabled={currentVariant.stock <= 0}
                    className={`w-full h-12 rounded-xl font-bold text-base transition-all duration-200 shadow-md active:scale-95 ${
                      currentVariant.stock > 0
                        ? "bg-green-600 hover:bg-green-700 text-white hover:shadow-lg"
                        : "bg-gray-300 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {currentVariant.stock > 0 ? "Comprar" : "Esgotado"}
                  </Button>
                )}
              </div>

              {/* View Details Link */}
              <Link href={`/produto/${product.id}`}>
                <button 
                  className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-green-600 flex items-center justify-center gap-1 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="w-4 h-4" />
                  Ver detalhes do produto
                </button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
