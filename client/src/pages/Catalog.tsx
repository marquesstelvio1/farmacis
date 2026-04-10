import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Grid, List, X, Package, ShoppingCart, Star, MapPin, Navigation, ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { useCart } from '@/hooks/use-cart'
import { type ProductResponse } from "@shared/routes";
import { useLocation, Link } from "wouter";
import { DeliveryLocationPicker } from "@/components/DeliveryLocationPicker";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const categories = [
  { id: 'all', name: 'Todos', icon: Package },
  { id: 'medicamento', name: 'Medicamentos', icon: Package },
  { id: 'vitamina', name: 'Vitaminas', icon: Star },
  { id: 'suplemento', name: 'Suplementos', icon: Star },
  { id: 'cosmetico', name: 'Cosméticos', icon: Star },
  { id: 'higiene', name: 'Higiene', icon: Star },
]

const sortOptions = [
  { id: 'name', name: 'Nome' },
  { id: 'price-low', name: 'Menor Preço' },
  { id: 'price-high', name: 'Maior Preço' },
  { id: 'rating', name: 'Avaliação' },
]

export default function Catalog() {
  const [pathname, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get('search') || '';
  const pharmacyId = searchParams.get('farmacia') || null;
  
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSort, setSelectedSort] = useState('name')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [pharmacyInfo, setPharmacyInfo] = useState<any>(null)
  
  // Localização e Ordenação
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<{lat: string, lng: string, address: string} | null>(null);
  const { calculateDistance } = useGeolocation();

  const { addItem, totalItems, toggleCart } = useCart()

  const hasActiveFilters =
    Boolean(search.trim()) ||
    selectedCategory !== 'all' ||
    selectedSort !== 'name' ||
    Boolean(priceRange.min) ||
    Boolean(priceRange.max);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  // Fetch pharmacy info if pharmacyId exists
  useEffect(() => {
    if (pharmacyId) {
      const fetchPharmacyInfo = async () => {
        try {
          const response = await fetch('/api/pharmacies');
          const pharmacies = await response.json();
          const pharmacy = pharmacies.find((p: any) => p.id === parseInt(pharmacyId));
          if (pharmacy) {
            setPharmacyInfo(pharmacy);
          }
        } catch (error) {
          console.error("Error fetching pharmacy info:", error);
        }
      };
      fetchPharmacyInfo();
    } else {
      setPharmacyInfo(null);
    }
  }, [pharmacyId]);

  const { data: products = [], isLoading, error } = useQuery<ProductResponse[]>({
    queryKey: ['products', debouncedSearch, selectedCategory, selectedSort, priceRange, pharmacyId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedSort) params.append('sort', selectedSort)
      if (priceRange.min) params.append('minPrice', priceRange.min)
      if (priceRange.max) params.append('maxPrice', priceRange.max)
      if (pharmacyId) params.append('pharmacyId', pharmacyId)
      
      const url = `/api/products?${params}`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    }
  })

  // Carregar localização salva no arranque
  useEffect(() => {
    const saved = sessionStorage.getItem("deliveryLocation");
    if (saved) setDeliveryLocation(JSON.parse(saved));
  }, []);

  // Lógica de Ordenação e Cálculo de Distância
  const sortedProducts = [...products]
    // Filtro rigoroso: Se houver uma farmácia selecionada na URL, removemos qualquer produto de outra origem
    .filter(p => !pharmacyId || p.pharmacyId === parseInt(pharmacyId))
    .map(p => {
      if (!deliveryLocation) return { ...p, distance: null };
      
      const dist = calculateDistance(
        parseFloat(deliveryLocation.lat),
        parseFloat(deliveryLocation.lng),
        parseFloat((p as any).pharmacyLat || "0"),
        parseFloat((p as any).pharmacyLng || "0")
      );
      return { ...p, distance: dist };
    })
    .sort((a, b) => {
      // Aplicar ordenação selecionada (Preço, Nome, etc)
      if (selectedSort === 'price-low') return parseFloat(a.price) - parseFloat(b.price);
      if (selectedSort === 'price-high') return parseFloat(b.price) - parseFloat(a.price);
      if (selectedSort === 'name') return a.name.localeCompare(b.name);
      // Ordenação padrão por distância se disponível e nenhum filtro acima for selecionado
      if (a.distance === null || b.distance === null) return 0;
      return a.distance - b.distance;
    });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(parseFloat(value))
  }

  const handleAddToCart = (product: ProductResponse) => {
    addItem(product)
  }

  const clearAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory('all');
    setSelectedSort('name');
    setPriceRange({ min: '', max: '' });
  };

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = [];
    if (search.trim()) badges.push(`Busca: "${search.trim()}"`);
    if (selectedCategory !== 'all') {
      badges.push(`Categoria: ${categories.find((c) => c.id === selectedCategory)?.name ?? selectedCategory}`);
    }
    if (selectedSort !== 'name') {
      badges.push(`Ordenar: ${sortOptions.find((s) => s.id === selectedSort)?.name ?? selectedSort}`);
    }
    if (priceRange.min || priceRange.max) {
      badges.push(`Preço: ${priceRange.min || '0'} - ${priceRange.max || 'max'}`);
    }
    if (deliveryLocation) badges.push('Proximidade ativa');
    return badges;
  }, [search, selectedCategory, selectedSort, priceRange.min, priceRange.max, deliveryLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-red-800 mb-2">Erro ao carregar catálogo</h1>
          <p className="text-red-600">Por favor, tente novamente mais tarde.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Unified Sticky Header with Glassmorphism */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col py-3 gap-3">
            {/* Row 1: Nav, Context & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={pharmacyId ? "/farmacias" : "/"}>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                
                {pharmacyInfo ? (
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-black text-white leading-none truncate max-w-[200px]">
                      {pharmacyInfo.name}
                    </h1>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none">Loja Selecionada</span>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center text-white">
                    <Package className="w-6 h-6 text-blue-400" />
                    <span className="ml-2 text-lg font-bold">Catálogo</span>
                  </div>
                )}
              </div>

              {/* Search (Desktop) */}
              <div className="hidden md:block flex-1 max-w-xl mx-8">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    placeholder={pharmacyInfo ? `Buscar em ${pharmacyInfo.name}...` : "O que você procura hoje?"}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      const extra = pharmacyId ? `&farmacia=${pharmacyId}` : '';
                      window.history.replaceState(null, '', `/catalogo?search=${encodeURIComponent(e.target.value)}${extra}`);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-white hover:bg-white/10"
                  aria-label="Abrir filtros"
                >
                  <Filter className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="hidden sm:flex text-white hover:bg-white/10"
                  aria-label="Alternar visualizacao"
                >
                  {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                </Button>

                <Button 
                  onClick={toggleCart}
                  variant="ghost"
                  size="icon"
                  className="relative text-white hover:bg-white/10 group"
                >
                  <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {totalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg ring-2 ring-slate-900">
                      {totalItems()}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Row 2: Search (Mobile) & Location */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-white/5 pt-2">
              <div className="md:hidden w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <button 
                onClick={() => setShowLocationPicker(true)}
                className="flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-blue-400 transition-colors truncate max-w-[70%]"
              >
                <MapPin size={14} className="text-blue-500" />
                <span className="truncate">
                  {deliveryLocation ? `Entrega em: ${deliveryLocation.address}` : 'Definir local de entrega'}
                </span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {sortedProducts.length} Resultados
                </span>
                {deliveryLocation && (
                  <Badge variant="outline" className="h-5 text-[9px] border-blue-500/30 text-blue-400 bg-blue-500/5 px-1.5 uppercase tracking-tighter">
                    <Navigation size={8} className="mr-1" /> Proximidade Ativa
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/10 transition"
              >
                <SlidersHorizontal size={12} />
                Filtros
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition ${
                    selectedCategory === category.id
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                      : "border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      
      {/* Filters Sidebar */}
      {showFilters && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowFilters(false)} />
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            className="absolute right-0 top-0 h-full w-80 bg-slate-800 border-l border-white/10 shadow-2xl overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Filtros</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Categoria</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded transition">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={selectedCategory === category.id}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-blue-500"
                      />
                      <category.icon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-200">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Ordenar por</h3>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <label key={option.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded transition">
                      <input
                        type="radio"
                        name="sort"
                        value={option.id}
                        checked={selectedSort === option.id}
                        onChange={(e) => setSelectedSort(e.target.value)}
                        className="text-blue-500"
                      />
                      <span className="text-sm text-slate-200">{option.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Faixa de Preço</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">De</label>
                    <input
                      type="number"
                      placeholder="Mínimo"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-full px-3 py-2 border border-white/20 bg-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Até</label>
                    <input
                      type="number"
                      placeholder="Máximo"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full px-3 py-2 border border-white/20 bg-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">Filtros Ativos</h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    Limpar tudo
                  </button>
                </div>
                <div className="space-y-2 text-sm text-slate-400">
                  {search && <div>• Busca: <span className="text-slate-200">"{search}"</span></div>}
                  {selectedCategory !== 'all' && <div>• Categoria: <span className="text-slate-200">{categories.find(c => c.id === selectedCategory)?.name}</span></div>}
                  {priceRange.min && <div>• Preço: <span className="text-slate-200">{formatCurrency(priceRange.min)}+</span></div>}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-black text-white">
            {pharmacyInfo ? 'Catálogo da Loja' : 'Todos os Produtos'}
          </h2>
          <p className="text-slate-400 text-sm">
            {search ? `Resultados para "${search}"` : 'Explore nossa seleção de medicamentos e cuidados'}
          </p>
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeFilterBadges.map((badge) => (
                <span
                  key={badge}
                  className="px-2.5 py-1 text-xs rounded-full bg-white/10 text-slate-200 border border-white/10"
                >
                  {badge}
                </span>
              ))}
              <Button
                onClick={clearAllFilters}
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-spin" />
              <p className="text-slate-300">Carregando produtos...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h2 className="text-xl font-semibold text-white mb-2">Nenhum produto encontrado</h2>
            <p className="text-slate-400 mb-6">
              {search ? 'Tente buscar com outros termos.' : 'Navegue pelas categorias para encontrar o que precisa.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="mr-3 border-white/20 text-white hover:bg-white/10"
              >
                Limpar filtros
              </Button>
            )}
            {pharmacyId && (
              <Link href="/farmacias">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar às Farmácias
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={viewMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }
          >
            {sortedProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <ProductCard
                  product={product as any}
                  variants={(product as any).variants}
                  distance={product.distance}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <DeliveryLocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(lat, lng, address) => {
          const loc = { lat: lat.toString(), lng: lng.toString(), address };
          setDeliveryLocation(loc);
          sessionStorage.setItem("deliveryLocation", JSON.stringify(loc));
        }}
        initialLat={deliveryLocation ? parseFloat(deliveryLocation.lat) : undefined}
        initialLng={deliveryLocation ? parseFloat(deliveryLocation.lng) : undefined}
      />
    </div>
  )
}
