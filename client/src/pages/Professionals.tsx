import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, UserRound, Award, Briefcase, MapPin, Phone, Star, Calendar, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Professional {
  id: number;
  name: string;
  specialty: string;
  credentials: string;
  experience: string;
  location: string;
  distance: string;
  rating: number;
  phone: string;
}

const professionals: Professional[] = [
  {
    id: 1,
    name: "Dr. José Silva",
    specialty: "Cardiologista",
    credentials: "MD, Especialista em Cardiologia",
    experience: "15 anos de experiência",
    location: "Clínica Central, Luanda",
    distance: "1.2 km",
    rating: 4.9,
    phone: "+244 930 111 111",
  },
  {
    id: 2,
    name: "Dra. Maria Santos",
    specialty: "Pediatra",
    credentials: "MD, Especialista em Pediatria",
    experience: "12 anos de experiência",
    location: "Centro Médico Benilson",
    distance: "2.1 km",
    rating: 4.8,
    phone: "+244 931 222 222",
  },
  {
    id: 3,
    name: "Dr. Roberto Costa",
    specialty: "Oftalmologista",
    credentials: "MD, Mestre em Oftalmologia",
    experience: "18 anos de experiência",
    location: "Clínica de Oftalmologia",
    distance: "2.8 km",
    rating: 4.7,
    phone: "+244 932 333 333",
  },
  {
    id: 4,
    name: "Dra. Ana Mendes",
    specialty: "Dermatologista",
    credentials: "MD, Especialista em Dermatologia",
    experience: "10 anos de experiência",
    location: "Policlínica Central",
    distance: "1.8 km",
    rating: 4.6,
    phone: "+244 933 444 444",
  },
  {
    id: 5,
    name: "Dr. Paulo Oliveira",
    specialty: "Ortopedista",
    credentials: "MD, Especialista em Traumatologia",
    experience: "20 anos de experiência",
    location: "Hospital Agostinho Neto",
    distance: "3.5 km",
    rating: 4.8,
    phone: "+244 934 555 555",
  },
  {
    id: 6,
    name: "Dra. Lucia Ferreira",
    specialty: "Psicóloga Clínica",
    credentials: "Psicóloga, Especialista em Psicoterapia",
    experience: "8 anos de experiência",
    location: "Clínica de Saúde Mental",
    distance: "2.3 km",
    rating: 4.7,
    phone: "+244 935 666 666",
  },
];

export default function Professionals() {
  const { toast } = useToast();
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    notes: ""
  });

  const handleScheduleClick = (prof: Professional) => {
    setSelectedProfessional(prof);
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
      description: `Sua consulta com ${selectedProfessional?.name} está aguardando confirmação.`,
      className: "bg-purple-600 text-white border-none",
    });

    setIsSubmitting(false);
    setIsScheduleModalOpen(false);
    setFormData({ date: "", time: "", notes: "" });
  };

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
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <UserRound className="w-6 h-6 text-purple-400" />
              </div>
              <h1 className="text-4xl font-black">Especialistas</h1>
            </div>
            <p className="text-slate-300 text-lg">Conecte-se com os melhores médicos credenciados</p>
          </div>

          {/* Professionals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map((professional, index) => (
              <motion.div
                key={professional.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all hover:border-purple-400/50"
              >
                <div className="space-y-4">
                  {/* Avatar & Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-3">
                        <UserRound className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white">{professional.name}</h3>
                      <p className="text-purple-300 text-sm font-semibold">{professional.specialty}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-300 font-bold text-sm">{professional.rating}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>{professional.credentials}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>{professional.experience}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>{professional.location}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-teal-300">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {professional.distance}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 border-teal-400/50 text-teal-300 hover:bg-teal-500/20"
                      onClick={() => window.location.href = `tel:${professional.phone}`}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Ligar
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => handleScheduleClick(professional)}
                    >
                      Consultar
                    </Button>
                  </div>
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
              <Calendar className="text-purple-600 dark:text-purple-400" />
              Agendar Consulta
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Solicite um horário com <strong>{selectedProfessional?.name}</strong>.
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

            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800 flex items-start gap-2">
              <Clock size={16} className="text-purple-600 dark:text-purple-400 mt-0.5" />
              <p className="text-[11px] text-purple-700 dark:text-purple-300 leading-tight">
                O especialista confirmará o agendamento através do seu contacto registado em até 24 horas.
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
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex-1 font-bold"
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
