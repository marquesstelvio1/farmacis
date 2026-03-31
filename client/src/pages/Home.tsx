import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, ArrowRight, Building2, ShieldCheck, Clock3 } from "lucide-react";
import { SplitSearch } from "@/components/SplitSearch";
import { QuickServices } from "@/components/QuickServices";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";

const heroImages = [
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1920&q=80",
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1920&q=80",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80",
  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1920&q=80",
  "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1920&q=80",
];

const sponsors = [
  { id: 1, name: "Empresa Saúde A", logo: "https://images.unsplash.com/photo-1563213126-a4273aed2016?w=200&q=80", link: "https://example.com" },
  { id: 2, name: "BioTech", logo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&q=80", link: "https://example.com" },
  { id: 3, name: "MedCare", logo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&q=80", link: "https://example.com" },
  { id: 4, name: "Vida Ativa", logo: "https://images.unsplash.com/photo-1551288049-bbbda536ad0a?w=200&q=80", link: "https://example.com" },
  { id: 5, name: "Laboratórios Unidos", logo: "https://images.unsplash.com/photo-1532187863486-abf9d39d6618?w=200&q=80", link: "https://example.com" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  // Configuração do Carrossel de Patrocinadores
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 });
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (query: string) => {
    if (!query || query.trim() === "") return;
    setLocation(`/catalogo?search=${encodeURIComponent(query.trim())}`);
  };

  const goToCatalog = () => setLocation("/catalogo");
  const goToPharmacies = () => setLocation("/farmacias");

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 pt-8 sm:pt-16 md:pt-20 pb-16 sm:pb-28 md:pb-32">
        {/* Carousel Background - Simplified */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {heroImages.map((src, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImage ? 'opacity-25' : 'opacity-0'}`}
            >
              <img 
                src={src} 
                alt="Medical" 
                className="absolute inset-0 w-full h-full object-cover scale-110"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-800/90 to-blue-900/80" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute top-40 -left-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
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
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-4 sm:mb-6 leading-[1.1]">
                Saúde inteligente <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                  ao seu alcance.
                </span>
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 leading-relaxed font-light max-w-2xl mx-auto">
                Compre seus medicamentos com segurança e utilize nossa nova inteligência artificial para identificar comprimidos perdidos instantaneamente.
              </p>
              
              <SplitSearch
                onSearch={handleSearch}
                onChatOpen={setIsChatOpen}
                className="mb-6 sm:mb-8"
              />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
                <button
                  onClick={goToCatalog}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-900/30 transition"
                >
                  Ver Catálogo
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={goToPharmacies}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold transition"
                >
                  <Building2 size={16} />
                  Escolher Farmácia
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
                <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-blue-300 mb-1">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-bold uppercase tracking-wide">Segurança</span>
                  </div>
                  <p className="text-sm text-slate-200">Farmácias verificadas e compra protegida.</p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-teal-300 mb-1">
                    <Clock3 size={16} />
                    <span className="text-xs font-bold uppercase tracking-wide">Rapidez</span>
                  </div>
                  <p className="text-sm text-slate-200">Busca inteligente e pedido em poucos passos.</p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-indigo-300 mb-1">
                    <Building2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-wide">Cobertura</span>
                  </div>
                  <p className="text-sm text-slate-200">Compare opcoes de varias farmacias perto de si.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Services Section - Outside Hero */}
      {!isChatOpen && (
        <QuickServices />
      )}


      {/* Sponsor Carousel Section */}
      {!isChatOpen && (
        <section className="py-12 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 mb-10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-400 dark:text-gray-300 uppercase tracking-[0.2em]">
              Nossos Patrocinadores & Parceiros
            </h2>
            
            <div className="flex gap-2">
              <button 
                onClick={scrollPrev}
                className="p-2 rounded-full border border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-all text-gray-400 dark:text-gray-500 shadow-sm"
                aria-label="Patrocinadores anteriores"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={scrollNext}
                className="p-2 rounded-full border border-gray-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-all text-gray-400 dark:text-gray-500 shadow-sm"
                aria-label="Próximos patrocinadores"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {sponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_25%] pl-4 first:pl-0">
                  <a 
                    href={sponsor.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl p-6 h-32 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden"
                  >
                    <div className="w-full h-full flex items-center justify-center grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all">
                      <img 
                        src={sponsor.logo} 
                        alt={sponsor.name} 
                        className="max-h-12 w-auto object-contain"
                      />
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 mt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Trabalhamos com parceiros para ampliar disponibilidade de medicamentos e servicos de saude.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
