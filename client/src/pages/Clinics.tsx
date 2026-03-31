import { motion } from "framer-motion";
import { ArrowLeft, Stethoscope, MapPin, Clock, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface Clinic {
  id: number;
  name: string;
  specialty: string;
  distance: string;
  rating: number;
  phone: string;
  hours: string;
  address: string;
}

const clinics: Clinic[] = [
  {
    id: 1,
    name: "Clínica Central de Luanda",
    specialty: "Clínica Geral",
    distance: "1.2 km",
    rating: 4.8,
    phone: "+244 930 123 456",
    hours: "08:00 - 18:00",
    address: "Avenida 4 de Fevereiro, Luanda",
  },
  {
    id: 2,
    name: "Centro Médico Benilson",
    specialty: "Cardiologia",
    distance: "2.1 km",
    rating: 4.6,
    phone: "+244 931 234 567",
    hours: "07:00 - 19:00",
    address: "Rua da República, Luanda",
  },
  {
    id: 3,
    name: "Policlínica Agostinho Neto",
    specialty: "Pediatria",
    distance: "3.5 km",
    rating: 4.7,
    phone: "+244 932 345 678",
    hours: "08:00 - 17:00",
    address: "Bairro Operário, Luanda",
  },
  {
    id: 4,
    name: "Clínica de Oftalmologia",
    specialty: "Oftalmologia",
    distance: "2.8 km",
    rating: 4.5,
    phone: "+244 933 456 789",
    hours: "09:00 - 18:00",
    address: "Miramar, Luanda",
  },
];

export default function Clinics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
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
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-4xl font-black">Marcar Consultas</h1>
            </div>
            <p className="text-slate-300 text-lg">Encontre os centros médicos mais próximos de você</p>
          </div>

          {/* Clinics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clinics.map((clinic, index) => (
              <motion.div
                key={clinic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all hover:border-blue-400/50"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{clinic.name}</h3>
                      <p className="text-blue-300 text-sm font-semibold">{clinic.specialty}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-300 font-bold text-sm">{clinic.rating}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      <span>{clinic.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-400" />
                      <span>{clinic.hours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-teal-400" />
                      <a href={`tel:${clinic.phone}`} className="hover:text-white transition">
                        {clinic.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      <span className="font-semibold">{clinic.distance}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition">
                    Marcar Consulta
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
