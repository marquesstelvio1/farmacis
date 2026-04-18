import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Stethoscope, MapPin, Clock, Phone, Star, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    notes: ""
  });

  const handleScheduleClick = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setIsScheduleModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const today = new Date().toISOString().split('T')[0];
    if (formData.date < today) {
      toast({
        title: "Data Inválida",
        description: "Não é possível agendar consultas em datas que já passaram.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulando chamada de API para salvar o agendamento
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Solicitação de Agendamento Enviada!",
      description: `Sua consulta na ${selectedClinic?.name} está aguardando confirmação.`,
      className: "bg-green-600 text-white border-none",
    });

    setIsSubmitting(false);
    setIsScheduleModalOpen(false);
    setFormData({ date: "", time: "", notes: "" });
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Link href="/">
          <Button variant="ghost" className="text-black mb-8 hover:bg-green-50">
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
          <div className="text-center text-black space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-4xl font-black">Marcar Consultas</h1>
            </div>
            <p className="text-gray-600 text-lg">Encontre os centros médicos mais próximos de você</p>
          </div>

          {/* Clinics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clinics.map((clinic, index) => (
              <motion.div
                key={clinic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-green-400 hover:shadow-lg transition-all"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-black">{clinic.name}</h3>
                      <p className="text-green-600 text-sm font-semibold">{clinic.specialty}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                      <span className="text-yellow-700 font-bold text-sm">{clinic.rating}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span>{clinic.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span>{clinic.hours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500" />
                      <a href={`tel:${clinic.phone}`} className="hover:text-green-600 transition">
                        {clinic.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-green-600">{clinic.distance}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition">
                    Marcar Consulta
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modal de Agendamento */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="text-blue-600 dark:text-blue-400" />
              Agendar Consulta
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Solicite um horário na <strong>{selectedClinic?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-700 dark:text-slate-300">Data</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-slate-700 dark:text-slate-300">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300">Sintomas ou Motivo (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Descreva brevemente o que está sentindo..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[100px]"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-2">
              <Clock size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-tight">
                A clínica confirmará o agendamento através do seu contacto registado em até 24 horas.
              </p>
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-xl flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex-1 font-bold"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Solicitação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
