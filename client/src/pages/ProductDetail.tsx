import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  ArrowLeft,
  MapPin,
  Store,
  FileText,
  Package,
  Phone,
  Star,
  Heart,
  Share2,
  AlertCircle,
  Plus,
  Minus,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  precoBase?: number;
  precoPortugues?: number;
  precoIndiano?: number;
  dosage?: string;
  imageUrl?: string;
  stock: number;
  category?: string;
  brand?: string;
  prescriptionRequired: boolean;
  activeIngredient?: string;
  diseases?: string[];
  origin?: string | null;
  pharmacyId?: number;
  pharmacyName?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  pharmacyLat?: number;
  pharmacyLng?: number;
  rating?: number;
  ratingCount?: number;
}

interface RelatedProduct {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  pharmacyName?: string;
}

interface DiscountedProduct {
  id: number;
  name: string;
  price: number;
  discountPercentage: number;
  imageUrl?: string;
  pharmacyName?: string;
}

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedOrigin, setSelectedOrigin] = useState<string>("default");
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [discountedProducts, setDiscountedProducts] = useState<DiscountedProduct[]>([]);

  const addItem = useCart((state) => state.addItem);
  const cartItems = useCart((state) => state.items);
  const { toast } = useToast();

  // Get cart quantity for this product
  const cartQuantity = cartItems.find(item => (item as any).id === productId)?.quantity || 0;

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchDiscountedProducts();
    }
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        const defaultOrigin = data.precoPortugues ? "portugues" : data.precoIndiano ? "indiano" : "default";
        setSelectedOrigin(defaultOrigin);
        // Fetch related products from same category
        fetchRelatedProducts(data.category, data.id);
      } else {
        toast({
          title: "Erro",
          description: "Produto não encontrado",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o produto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (category?: string, excludeId?: number) => {
    try {
      const response = await fetch(`/api/products?category=${category}&limit=4`);
      if (response.ok) {
        const data = await response.json();
        setRelatedProducts(data.filter((p: Product) => p.id !== excludeId).slice(0, 4));
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const fetchDiscountedProducts = async () => {
    try {
      const response = await fetch("/api/products?discount=true&limit=4");
      if (response.ok) {
        const data = await response.json();
        setDiscountedProducts(data.slice(0, 4));
      }
    } catch (error) {
      console.error("Error fetching discounted products:", error);
    }
  };

const getCurrentPrice = () => {
  if (!product) return 0;
  switch (selectedOrigin) {
    case "portugues": 
      return product.precoPortugues !== null && product.precoPortugues !== undefined 
        ? product.precoPortugues 
        : product.price || 0;
    case "indiano": 
      return product.precoIndiano !== null && product.precoIndiano !== undefined 
        ? product.precoIndiano 
        : product.price || 0;
    default: 
      return product.price || 0;
  }
};

  const getOriginLabel = (origin: string) => {
    switch (origin) {
      case "portugues": return { label: "Português", flag: "🇵🇹", color: "bg-blue-100 text-blue-700 border-blue-300" };
      case "indiano": return { label: "Indiano", flag: "🇮🇳", color: "bg-orange-100 text-orange-700 border-orange-300" };
      default: return { label: "", flag: "", color: "bg-green-100 text-green-700 border-green-300" };
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.prescriptionRequired && cartQuantity === 0) {
      toast({
        title: "⚕️ Requer Receita Médica",
        description: "Este medicamento requer receita médica. Podes adicionar ao carrinho, mas precisarás de fazer upload da receita no checkout.",
      });
    }

    const price = getCurrentPrice();
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        ...product,
        price: price.toString(),
        origin: selectedOrigin,
      });
    }

    toast({
      title: "✅ Adicionado ao carrinho",
      description: `${quantity}x ${product.name} (${getOriginLabel(selectedOrigin).label})`,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Confira ${product?.name} na Farmácis!`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado para a área de transferência.",
      });
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: product?.name,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Produto não encontrado</h1>
        <p className="text-slate-500 mb-6">O produto que procuras não existe ou foi removido.</p>
        <Link href="/">
          <Button className="bg-green-600 hover:bg-green-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à Home
          </Button>
        </Link>
      </div>
    );
  }

  const currentPrice = getCurrentPrice();
  const hasMultipleOrigins = product.precoPortugues || product.precoIndiano;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
<Link href="/catalogo">
  <Button variant="ghost" size="icon">
    <ArrowLeft className="w-4 h-4" />
  </Button>
</Link>
          <h1 className="font-semibold text-slate-800 text-sm truncate max-w-[200px]">{product.name}</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleWishlist}>
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="aspect-square bg-white rounded-xl overflow-hidden border border-slate-200">
              <img
                src={product.imageUrl || "/placeholder-product.png"}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
            </div>
            
             {/* Badges */}
             <div className="absolute top-4 left-4 flex flex-col gap-2">
               {product.prescriptionRequired && (
                 <Badge className="bg-red-500 text-white px-3 py-1">
                   <FileText className="w-3 h-3 mr-1" />
                   Receita
                 </Badge>
               )}
             </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Title & Category */}
            <div>
              <Badge variant="outline" className="mb-1 text-[10px] h-5">
                {product.category || "Medicamento"}
              </Badge>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">
                {product.name}
              </h1>
              {product.dosage && (
                <p className="text-base text-green-600 font-semibold">{product.dosage}</p>
              )}
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating!)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-slate-600">
                  {product.rating.toFixed(1)} ({product.ratingCount} avaliações)
                </span>
              </div>
            )}

            {/* Description - Moved here */}
            <div className="py-2 border-y border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 mb-1">Descrição</h2>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">{product.description}</p>
              
              {product.diseases && product.diseases.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {product.diseases.map((disease) => (
                    <Badge key={disease} variant="secondary" className="text-[10px] px-2 py-0">
                      {disease}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="bg-green-50 rounded-xl p-3 border border-green-200">
              {/* Origin Selection */}
              {hasMultipleOrigins && (
                <div className="mb-3">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Selecione a origem:
                  </label>
                  <div className="flex gap-2 flex-wrap">
                      {product.precoPortugues && (
                      <button
                        onClick={() => setSelectedOrigin("portugues")}
                        className={`px-3 py-1 rounded-lg border-2 font-semibold text-xs transition-all ${
                          selectedOrigin === "portugues"
                            ? "bg-blue-100 border-blue-500 text-blue-700"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        🇵🇹 Português
                      </button>
                    )}
                    {product.precoIndiano && (
                      <button
                        onClick={() => setSelectedOrigin("indiano")}
                        className={`px-3 py-1 rounded-lg border-2 font-semibold text-xs transition-all ${
                          selectedOrigin === "indiano"
                            ? "bg-orange-100 border-orange-500 text-orange-700"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        🇮🇳 Indiano
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-2xl font-black text-green-600">
                  {currentPrice.toLocaleString("pt-AO", {
                    style: "currency",
                    currency: "AOA",
                  })}
                </span>
              </div>

               {/* Quantity Selector */}
               <div className="flex items-center gap-4 mb-3">
                 <span className="text-sm font-semibold text-slate-700">Quantidade:</span>
                 <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                   <button
                     onClick={() => setQuantity(Math.max(1, quantity - 1))}
                     className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                   >
                     <Minus className="w-4 h-4" />
                   </button>
                   <span className="w-8 text-center font-bold text-base">{quantity}</span>
                   <button
                     onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                     disabled={quantity >= product.stock}
                     className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                   >
                     <Plus className="w-4 h-4" />
                   </button>
                 </div>
               </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-green-200">
                <span className="text-sm font-semibold text-slate-700">Total:</span>
                <span className="text-xl font-black text-green-700">
                  {(currentPrice * quantity).toLocaleString("pt-AO", {
                    style: "currency",
                    currency: "AOA",
                  })}
                </span>
              </div>
            </div>

            {/* Pharmacy Info */}
            {product.pharmacyName && (
              <Card className="p-3 border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-800">{product.pharmacyName}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {product.pharmacyAddress}
                    </p>
                    {product.pharmacyPhone && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Phone className="w-4 h-4" />
                        {product.pharmacyPhone}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base font-bold rounded-xl shadow-lg shadow-green-500/30"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {product.stock > 0 ? "Adicionar" : "Esgotado"}
            </Button>

            {/* Cart Status */}
            {cartQuantity > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">Já no carrinho</p>
                    <p className="text-sm text-blue-600">{cartQuantity} unidade(s)</p>
                  </div>
                </div>
                <Link href="/checkout">
                  <Button variant="outline" className="border-blue-300 text-blue-700">
                    Ver Carrinho
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Related Products */}
        <div className="mt-8">
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Produtos Relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/produto/${relatedProduct.id}`}>
                  <Card className="p-4 border-slate-200 hover:border-green-300 hover:shadow-lg transition-all cursor-pointer">
                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-slate-50">
                      <img
                        src={relatedProduct.imageUrl || "/placeholder-product.png"}
                        alt={relatedProduct.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-1">
                      {relatedProduct.name}
                    </h3>
      <p className="text-green-600 font-bold">
        {relatedProduct.price !== null ? relatedProduct.price.toLocaleString("pt-AO", {
          style: "currency",
          currency: "AOA",
        }) : "Preço indisponível"}
      </p>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Discounted Products / Produtos em Promoção */}
        {discountedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Percent className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-slate-800">Produtos em Promoção</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {discountedProducts.map((discountedProduct) => (
                <Link key={discountedProduct.id} href={`/produto/${discountedProduct.id}`}>
                  <Card className="p-4 border-slate-200 hover:border-red-300 hover:shadow-lg transition-all cursor-pointer relative">
                    {/* Discount Badge */}
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold">
                      -{discountedProduct.discountPercentage}%
                    </Badge>
                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-slate-50">
                      <img
                        src={discountedProduct.imageUrl || "/placeholder-product.png"}
                        alt={discountedProduct.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-1">
                      {discountedProduct.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-red-600 font-bold text-lg">
                        {discountedProduct.price !== null ? discountedProduct.price.toLocaleString("pt-AO", {
                          style: "currency",
                          currency: "AOA",
                        }) : "Preço indisponível"}
                      </p>
                    </div>
                    {discountedProduct.pharmacyName && (
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {discountedProduct.pharmacyName}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
}
