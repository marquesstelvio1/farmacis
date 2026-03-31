import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, TrendingUp, Users, Heart, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface Insurance {
  id: number;
  name: string;
  plan: string;
  coverage: string[];
  price: string;
  members: number;
  rating: number;
  contact: string;
  location: string;
}

const insurances: Insurance[] = [
  {
    id: 1,
    name: "Seguros Ínsula",
    plan: "Plano Gold",
    coverage: ["Consultas", "Cirurgias", "Internação", "Medicamentos"],
    price: "25,000 AOA/mês",
    members: 45000,
    rating: 4.8,
    contact: "+244 930 111 000",
    location: "Avenida 4 de Fevereiro, Luanda",
  },
  {
    id: 2,
    name: "MAGSEGURO",
    plan: "Plano Prata",
    coverage: ["Consultas", "Internação", "Medicamentos"],
    price: "18,000 AOA/mês",
    members: 52000,
    rating: 4.7,
    contact: "+244 931 222 000",
    location: "Miramar, Luanda",
  },
  {
    id: 3,
    name: "Saúde Total",
    plan: "Plano Premium",
    coverage: ["Consultas", "Cirurgias", "Internação", "Medicamentos", "Odontologia"],
    price: "35,000 AOA/mês",
    members: 32000,
    rating: 4.9,
    contact: "+244 932 333 000",
    location: "Bairro Operário, Luanda",
  },
  {
    id: 4,
    name: "Seguros Angola",
    plan: "Plano Básico",
    coverage: ["Consultas", "Medicamentos"],
    price: "12,000 AOA/mês",
    members: 68000,
    rating: 4.5,
    contact: "+244 933 444 000",
    location: "Zona Económica, Luanda",
  },
  {
    id: 5,
    name: "Proteção Saúde",
    plan: "Plano Familiar",
    coverage: ["Consultas", "Internação", "Medicamentos", "Pediatria"],
    price: "30,000 AOA/mês",
    members: 38000,
    rating: 4.6,
    contact: "+244 934 555 000",
    location: "Benilson, Luanda",
  },
  {
    id: 6,
    name: "Vida Segura",
    plan: "Plano Executivo",
    coverage: ["Todas as coberturas", "Atendimento 24/7", "Telemedicina"],
    price: "40,000 AOA/mês",
    members: 25000,
    rating: 4.8,
    contact: "+244 935 666 000",
    location: "Talatona, Luanda",
  },
];

export default function Insurance() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-5xl mx-auto py-8">
        <Link href="/">
          <Button variant="ghost" className="text-white mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center text-white space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-4xl font-black">Planos de Saúde</h1>
            </div>
            <p className="text-slate-300 text-lg">Escolha o melhor plano para você e sua família</p>
          </div>

          {/* Insurance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insurances.map((insurance, index) => (
              <motion.div
                key={insurance.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all hover:border-emerald-400/50 flex flex-col"
              >
                <div className="space-y-4 flex-1">
                  {/* Header */}
                  <div>
                    <h3 className="text-xl font-bold text-white">{insurance.name}</h3>
                    <p className="text-emerald-300 text-sm font-semibold">{insurance.plan}</p>
                    <p className="text-2xl font-black text-emerald-400 mt-2">{insurance.price}</p>
                  </div>

                  {/* Coverage */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Cobertura inclusa:</p>
                    <ul className="space-y-1">
                      {insurance.coverage.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                          <Heart className="w-3 h-3 text-emerald-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/5 rounded-lg p-3">
                    <div>
                      <p className="text-slate-400">Rating</p>
                      <p className="text-white font-bold flex items-center gap-1">
                        ⭐ {insurance.rating}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Membros</p>
                      <p className="text-white font-bold">{(insurance.members / 1000).toFixed(0)}k</p>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <Phone className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" />
                      <a href={`tel:${insurance.contact}`} className="hover:text-white">
                        {insurance.contact}
                      </a>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>{insurance.location}</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Button className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition">
                  Solicitar Informações
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
