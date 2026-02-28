import { motion } from "framer-motion";
import { Link } from "wouter";
import { Search, ChevronRight, Activity, ShieldCheck, Clock } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";

export default function Home() {
  const { data: products, isLoading, error } = useProducts();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pt-20 pb-32">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* landing page hero abstract medical clinic blue modern */}
          <img 
            src="https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=2000&auto=format&fit=crop" 
            alt="Medical abstract" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-blue-900/80" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute top-40 -left-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-semibold tracking-wide mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Nova Funcionalidade IA
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1]">
                Saúde inteligente <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                  ao seu alcance.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed font-light">
                Compre seus medicamentos com segurança e utilize nossa nova inteligência artificial para identificar comprimidos perdidos instantaneamente.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/identificar" 
                  className="px-8 py-4 rounded-2xl bg-white text-blue-600 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                >
                  <Search size={20} />
                  Identificar Comprimido
                </Link>
                <a 
                  href="#catalog" 
                  className="px-8 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
                >
                  Ver Catálogo
                  <ChevronRight size={20} className="text-slate-400" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative Wave Divider */}
        <div className="absolute bottom-0 w-full overflow-hidden leading-none z-10">
          <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,123.15,190.15,115.54,235.85,108.6,281.33,78.29,321.39,56.44Z" className="fill-slate-50"></path>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-20 relative z-20">
            {[
              { icon: ShieldCheck, title: "Qualidade Garantida", desc: "Todos os produtos originais e certificados pela ANVISA." },
              { icon: Activity, title: "IA Médica", desc: "Identificação precisa de comprimidos usando tecnologia de ponta." },
              { icon: Clock, title: "Entrega Expressa", desc: "Receba seus medicamentos em casa em até 2 horas." }
            ].map((feature, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                key={i} 
                className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                  <feature.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalog" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                Catálogo de <span className="text-blue-600">Medicamentos</span>
              </h2>
              <p className="text-slate-500 max-w-2xl text-lg">
                Encontre o que você precisa com rapidez. Navegue pela nossa lista completa de medicamentos e produtos de saúde.
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar medicamentos..." 
                className="w-full md:w-80 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-5 h-[400px] border border-slate-100 shadow-sm animate-pulse flex flex-col">
                  <div className="w-full h-48 bg-slate-100 rounded-xl mb-6"></div>
                  <div className="w-3/4 h-6 bg-slate-100 rounded mb-2"></div>
                  <div className="w-full h-4 bg-slate-100 rounded mb-4"></div>
                  <div className="w-1/2 h-4 bg-slate-100 rounded mb-6"></div>
                  <div className="mt-auto flex justify-between">
                    <div className="w-1/3 h-8 bg-slate-100 rounded"></div>
                    <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-center">
              <p className="font-semibold">Erro ao carregar produtos.</p>
              <p className="text-sm mt-1 opacity-80">Por favor, recarregue a página.</p>
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">Nenhum produto encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products?.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
