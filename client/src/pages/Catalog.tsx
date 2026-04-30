import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Grid, List, X, Package, ShoppingCart, Star, MapPin, Navigation, ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { useCart } from '@/hooks/use-cart'
import { type ProductResponse } from "@shared/routes";
import { Link } from "wouter";
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

const origins = [
  { id: 'all', name: 'Todas as Origens' },
  { id: 'portugues', name: 'Portuguesa' },
  { id: 'indiano', name: 'Indiana' },
  { id: 'default', name: 'Nacional' },
]

const sortOptions = [
  { id: 'name', name: 'Nome' },
  { id: 'price-low', name: 'Menor Preço' },
  { id: 'price-high', name: 'Maior Preço' },
  { id: 'rating', name: 'Avaliação' },
]

export default function Catalog() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get('search') || '';
  const pharmacyId = searchParams.get('farmacia') || null;

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedOrigin, setSelectedOrigin] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedSort, setSelectedSort] = useState('name')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [pharmacyInfo, setPharmacyInfo] = useState<any>(null)

  // Localização e Ordenação
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: string, lng: string, address: string } | null>(null);
  const { calculateDistance } = useGeolocation();

  const { addItem, totalItems, toggleCart } = useCart()

  const hasActiveFilters =
    Boolean(search.trim()) ||
    selectedCategory !== 'all' ||
    selectedOrigin !== 'all' ||
    selectedBrand !== 'all' ||
    selectedSort !== 'name' ||
    Boolean(priceRange.min) ||
    Boolean(priceRange.max);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  // Fetch suggestions while typing
  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/suggestions?q=${encodeURIComponent(search.trim())}`);
        if (res.ok) setSuggestions(await res.json());
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 200);
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

  // Fetch unique brands from products
  const { data: brands = [] } = useQuery<string[]>({
    queryKey: ['brands', pharmacyId],
    queryFn: async () => {
      const response = await fetch(`/api/products?pharmacyId=${pharmacyId || ''}`);
      if (!response.ok) return [];
      const products = await response.json();
      const brandSet = new Set<string>();
      products.forEach((p: any) => {
        if (p.brand) brandSet.add(p.brand);
      });
      return Array.from(brandSet).sort();
    }
  });

  const { data: products = [], isLoading, error } = useQuery<ProductResponse[]>({
    queryKey: ['products', debouncedSearch, selectedCategory, selectedOrigin, selectedBrand, selectedSort, priceRange, pharmacyId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedOrigin !== 'all') params.append('origin', selectedOrigin)
      if (selectedBrand !== 'all') params.append('brand', selectedBrand)
      if (selectedSort) params.append('sort', selectedSort)
      if (priceRange.min) params.append('minPrice', priceRange.min)
      if (priceRange.max) params.append('maxPrice', priceRange.max)
      if (pharmacyId) params.append('pharmacyId', pharmacyId)

      const url = `/api/products?${params}`

      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(errorData.message || 'Failed to fetch products');
      }
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

  const clearAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory('all');
    setSelectedOrigin('all');
    setSelectedBrand('all');
    setSelectedSort('name');
    setPriceRange({ min: '', max: '' });
  };

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = [];
    if (search.trim()) badges.push(`Busca: "${search.trim()}"`);
    if (selectedCategory !== 'all') {
      badges.push(`Categoria: ${categories.find((c) => c.id === selectedCategory)?.name ?? selectedCategory}`);
    }
    if (selectedOrigin !== 'all') {
      badges.push(`Origem: ${origins.find((o) => o.id === selectedOrigin)?.name ?? selectedOrigin}`);
    }
    if (selectedBrand !== 'all') {
      badges.push(`Marca: ${selectedBrand}`);
    }
    if (selectedSort !== 'name') {
      badges.push(`Ordenar: ${sortOptions.find((s) => s.id === selectedSort)?.name ?? selectedSort}`);
    }
    if (priceRange.min || priceRange.max) {
      badges.push(`Preço: ${priceRange.min || '0'} - ${priceRange.max || 'max'}`);
    }
    if (deliveryLocation) badges.push('Proximidade ativa');
    return badges;
  }, [search, selectedCategory, selectedOrigin, selectedBrand, selectedSort, priceRange.min, priceRange.max, deliveryLocation]);

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
    <div className="min-h-screen bg-transparent">
      {/* Unified Sticky Header with Glassmorphism */}
      <header className="bg-transparent backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-0 gap-3 h-14">
            {/* Row 1: Nav, Context & Actions */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <Link href={pharmacyId ? "/farmacias" : "/"}>
                  <Button variant="ghost" size="icon" className="text-white bg-white/10 hover:bg-white/20 rounded-full border border-white/20 shadow-sm transition">
                    <ArrowLeft className="w-5 h-5 text-slate-300 transition-colors hover:text-slate-100" />
                  </Button>
                </Link>

                {pharmacyInfo ? (
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-black text-white leading-none truncate max-w-[200px]">
                      {pharmacyInfo.name}
                    </h1>
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest leading-none">Loja Selecionada</span>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center text-white">
                    <Package className="w-6 h-6 text-green-400" />
                    <span className="ml-2 text-lg font-bold">Catálogo</span>
                  </div>
                )}
              </div>

              {/* Search (Desktop) */}
              <div className="hidden md:block flex-1 max-w-xl mx-8">
                <div
                  className="relative group"
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-slate-500 transition-colors" />
                  <input
                    type="text"
                    placeholder={pharmacyInfo ? `Buscar em ${pharmacyInfo.name}...` : "O que você procura hoje?"}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(true);
                      const extra = pharmacyId ? `&farmacia=${pharmacyId}` : '';
                      window.history.replaceState(null, '', `/catalogo?search=${encodeURIComponent(e.target.value)}${extra}`);
                    }}
                    className="w-full pl-10 pr-10 h-10 bg-white/15 border border-white/30 rounded-xl focus:ring-2 focus:ring-green-500/60 focus:border-green-400 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFilters(!showFilters);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-green-500/25 text-white hover:bg-green-500 rounded-xl border border-green-400/40 shadow-sm transition-all"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden z-50 shadow-2xl">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearch(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-900 hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-0"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Search (Mobile) */}
              <div className="md:hidden flex-1 mx-2">
                <div
                  className="relative group"
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-slate-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    className="w-full pl-10 pr-10 h-10 bg-white/15 border border-white/30 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-green-500/60 focus:border-green-400 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFilters(!showFilters);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-green-500/25 text-white hover:bg-green-500 rounded-xl border border-green-400/40 shadow-sm transition-all"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/15 rounded-xl overflow-hidden z-50 shadow-2xl">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearch(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-green-500/20 transition-colors border-b border-white/5"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                  className="relative text-white bg-white/10 hover:bg-white/20 rounded-full border border-white/20 shadow-sm transition-all"
                >
                  <ShoppingCart className="w-5 h-5 text-slate-300 transition-colors hover:text-slate-100" />
                  {totalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-green-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg ring-2 ring-slate-900">
                      {totalItems()}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Row 2: Location & Results - Desktop only, Mobile has search in header only */}
            {/* Removed - now using single header line */}
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
                        className="text-green-500"
                      />
                      <category.icon className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-slate-200">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Origins */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Origem</h3>
                <div className="space-y-2">
                  {origins.map((origin) => (
                    <label key={origin.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded transition">
                      <input
                        type="radio"
                        name="origin"
                        value={origin.id}
                        checked={selectedOrigin === origin.id}
                        onChange={(e) => setSelectedOrigin(e.target.value)}
                        className="text-green-500"
                      />
                      <span className="text-sm text-slate-200">{origin.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brands */}
              {brands.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Marca</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <label className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded transition">
                      <input
                        type="radio"
                        name="brand"
                        value="all"
                        checked={selectedBrand === 'all'}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="text-green-500"
                      />
                      <span className="text-sm text-slate-200">Todas as Marcas</span>
                    </label>
                    {brands.map((brand) => (
                      <label key={brand} className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded transition">
                        <input
                          type="radio"
                          name="brand"
                          value={brand}
                          checked={selectedBrand === brand}
                          onChange={(e) => setSelectedBrand(e.target.value)}
                          className="text-green-500"
                        />
                        <span className="text-sm text-slate-200">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                        className="text-green-500"
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
                      className="w-full px-3 py-2 border border-white/20 bg-white/10 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Até</label>
                    <input
                      type="number"
                      placeholder="Máximo"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full px-3 py-2 border border-white/20 bg-white/10 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-slate-400"
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
                    className="text-xs text-green-400 hover:text-green-300 transition"
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
          <h2 className="text-2xl font-black text-slate-900">
            {pharmacyInfo ? 'Catálogo da Loja' : 'Todos os Produtos'}
          </h2>
          <p className="text-slate-500 text-sm">
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
                className="h-7 px-2 text-xs text-green-300 hover:text-green-200 hover:bg-green-500/10"
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
              <Package className="w-12 h-12 mx-auto mb-4 text-green-400 animate-spin" />
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
                <Button className="bg-green-600 hover:bg-green-700 text-white">
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
               ? "grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4"
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
