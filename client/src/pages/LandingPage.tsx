import { motion, AnimatePresence } from "framer-motion";
import { SplitSearch } from "@/components/SplitSearch";
import { QuickServices } from "@/components/QuickServices";
import { Footer } from "@/components/Footer";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

const carouselImages = [
  "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200",
  "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1200",
  "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1200",
  "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=1200"
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setLocation(`/catalogo?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 md:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
             <div className="flex items-center gap-2">
               <img src="/logo.png" alt="Brócolis" className="w-12 h-12 object-contain" />
               <span className="font-bold text-slate-800">Brócolis</span>
             </div>
          </div>
        </div>
      </header>

        {/* Hero Section with SplitSearch */}
        <section className="relative pt-8 pb-4 sm:pt-20 sm:pb-12 px-4 sm:px-6 lg:px-8 min-h-[300px] sm:min-h-[384px]">
         {/* Background Image Carousel */}
         <div className="absolute inset-0 overflow-hidden">
           <AnimatePresence mode="wait">
             <motion.img
               key={currentImage}
               src={carouselImages[currentImage]}
               alt="Background"
               initial={{ opacity: 0, scale: 1.1 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 1 }}
               className="absolute inset-0 w-full h-full object-cover"
             />
           </AnimatePresence>
         </div>

         {/* Background decoration */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
           <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
           <div className="absolute top-40 left-20 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
         </div>

         <div className="relative sm:absolute sm:bottom-[56.69px] left-1/2 -translate-x-1/2 max-w-4xl w-full text-center px-0 sm:px-6 lg:px-8 mt-32 sm:mt-0">
           {/* Split Search Component */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.3 }}
           >
             <SplitSearch onSearch={handleSearch} className="mb-2 sm:mb-8" />
           </motion.div>
         </div>
       </section>

      {/* Quick Services Section */}
      <QuickServices />

      {/* Footer */}
      <Footer />
    </div>
  );
}
