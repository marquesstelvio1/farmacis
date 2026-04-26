import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  User, 
  Pill, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Calendar,
  CheckCircle2,
  UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/UserContext";
import AuthOneHealth from "./AuthOneHealth";

interface MedicationReminder {
  id?: number;
  medicineName: string;
  durationDays: number;
  hours: string[]; // Store as array of strings "HH:MM"
  active: boolean;
}

interface Appointment {
  id: number;
  professionalName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
}

export default function AccountSettings() {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileNeighborhood, setProfileNeighborhood] = useState("");
  const [profileReference, setProfileReference] = useState("");
  const [activeTab, setActiveTab] = useState<'profile' | 'meds' | 'appointments'>('profile');
  
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const subNumber = digits.startsWith("244") ? digits.slice(3) : digits;
    const limited = subNumber.slice(0, 9);
    
    const parts = [];
    if (limited.length > 0) parts.push(limited.slice(0, 3));
    if (limited.length > 3) parts.push(limited.slice(3, 6));
    if (limited.length > 6) parts.push(limited.slice(6, 9));
    
    return limited.length > 0 ? "+244 " + parts.join(" ") : "";
  };

  // New Medicine Form
  const [newMedicine, setNewMedicine] = useState("");
  const [newDuration, setNewDuration] = useState("7");
  const [newHour, setNewHour] = useState("");
  const [tempHours, setNewTempHours] = useState<string[]>([]);

  const { user, setUser: setGlobalUser } = useUser(); // Usa o user e setUser do contexto

  useEffect(() => {
    setProfileName(user?.name || ""); // Usa o user do contexto
    setProfileAddress(user?.address || ""); // Usa o user do contexto
  }, [user?.name, user?.address]);

  useEffect(() => {
    const fetchReminders = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/user/${user.id}/medications`);
        if (res.ok) {
          const data = await res.json();
          // Parse hours from JSON if needed
          const parsed = data.map((r: any) => ({
            ...r,
            hours: typeof r.hours === 'string' ? JSON.parse(r.hours) : r.hours || []
          }));
          setReminders(parsed);
        }
      } finally {
      }
    };

    const fetchAppointments = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/user/${user.id}/appointments`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminders();
    fetchAppointments();
    
    // Request Notification Permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "bom dia";
    if (hour >= 12 && hour < 18) return "boa tarde";
    return "boa noite";
  };

  const handleAddMedicine = async () => {
    if (!newMedicine || tempHours.length === 0) {
      toast({ title: "Dados incompletos", description: "Informe o nome e pelo menos um horário.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/user/${user.id}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineName: newMedicine,
          durationDays: parseInt(newDuration),
          hours: JSON.stringify(tempHours),
          active: true
        }),
      });

      if (res.ok) {
        const added = await res.json();
        setReminders([...reminders, { ...added, hours: tempHours }]);
        setNewMedicine("");
        setNewTempHours([]);
        toast({ 
          title: "Modo Receita Ativado!", 
          description: `Oi ${user.name}, ${getGreeting()}! Lembrete para ${newMedicine} configurado.` 
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    
    try {
      const res = await fetch(`/api/user/${user?.id}/appointments/${appointmentId}/cancel`, {
        method: "POST",
      });

      if (res.ok) {
        setAppointments(appointments.map(a => 
          a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a
        ));
        toast({ title: "Sucesso", description: "Agendamento cancelado com sucesso." });
      } else {
        throw new Error("Falha ao cancelar");
      }
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível cancelar o agendamento.", variant: "destructive" });
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    if (!profileName.trim() && !profileAddress.trim() && !profileNeighborhood.trim() && !profileReference.trim()) {
      toast({ title: "Dados incompletos", description: "Preencha pelo menos um campo para atualizar." });
      return;
    }

    const composedAddress = [profileAddress, profileNeighborhood, profileReference]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");

    setIsSavingProfile(true);
    try {
      const payload: Record<string, any> = { userId: user.id };
      if (profileName.trim()) payload.name = profileName.trim();
      if (composedAddress) payload.address = composedAddress;

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Falha ao atualizar perfil");
      }

      const data = await res.json();
      setGlobalUser(data.user); // Atualiza o user no contexto

      setProfileName(data.user?.name || "");
      setProfileAddress(data.user?.address || composedAddress);
      setProfileNeighborhood("");
      setProfileReference("");

      toast({ title: "Perfil atualizado", description: "Os dados do seu perfil foram guardados." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o perfil agora.", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const addHour = () => {
    if (newHour && !tempHours.includes(newHour)) {
      setNewTempHours([...tempHours, newHour].sort());
      setNewHour("");
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" style={{ color: "#8bc14a" }} /></div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7faf5" }}>
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <button
          type="button"
          onClick={() => window.location.assign("/menu-de-configuracoes")}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border transition"
          style={{ borderColor: "#dce4d7", color: "#072a1c", backgroundColor: "#ffffff" }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: "#072a1c" }}>
            <User size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#072a1c" }}>Configurações da Conta</h1>
            <p style={{ color: "#607369" }}>Gerencie seu perfil e lembretes de saúde</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Tabs (Visual) */}
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('profile')}
              className={`w-full justify-start gap-2 ${activeTab === 'profile' ? 'font-bold border' : 'shadow-sm border'}`}
              style={activeTab === 'profile'
                ? { backgroundColor: "rgba(181, 241, 118, 0.25)", color: "#072a1c", borderColor: "#dce4d7" }
                : { backgroundColor: "#ffffff", color: "#607369", borderColor: "#e0e0e0" }}
            >
              <User size={18} /> Perfil do Usuário
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('meds')}
              className={`w-full justify-start gap-2 ${activeTab === 'meds' ? 'font-bold border' : 'shadow-sm border'}`}
              style={activeTab === 'meds'
                ? { backgroundColor: "rgba(181, 241, 118, 0.25)", color: "#072a1c", borderColor: "#dce4d7" }
                : { backgroundColor: "#ffffff", color: "#607369", borderColor: "#e0e0e0" }}
            >
              <Pill size={18} /> Modo Receita
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('appointments')}
              className={`w-full justify-start gap-2 ${activeTab === 'appointments' ? 'font-bold border' : 'shadow-sm border'}`}
              style={activeTab === 'appointments'
                ? { backgroundColor: "rgba(181, 241, 118, 0.25)", color: "#072a1c", borderColor: "#dce4d7" }
                : { backgroundColor: "#ffffff", color: "#607369", borderColor: "#e0e0e0" }}
            >
              <Calendar size={18} /> Meus Agendamentos
            </Button>
          </div>

          {/* Content Area */}
          <div className="md:col-span-2 space-y-6">
            {activeTab === 'profile' && (
              <Card className="border" style={{ backgroundColor: "#ffffff", borderColor: "#e0e0e0" }}>
                <CardHeader>
                  <CardTitle style={{ color: "#072a1c" }}>Perfil do Usuário</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isChangingPhone ? (
                    <AuthOneHealth 
                      emailToVerify={user?.email}
                      onSuccess={async () => {
                        try {
                          const res = await fetch("/api/auth/profile", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                              userId: user.id, 
                              phone: newPhoneNumber.replace(/\s/g, "") 
                            }),
                          });
                          
                          if (!res.ok) throw new Error("Erro ao atualizar");
                          
                          const data = await res.json();
                          localStorage.setItem("user", JSON.stringify(data.user));
                          setIsChangingPhone(false);
                          toast({ title: "Sucesso", description: "E-mail validado e telemóvel atualizado!" });
                        } catch (err) {
                          toast({ title: "Erro", description: "Não foi possível confirmar a alteração.", variant: "destructive" });
                        }
                      }}
                      onCancel={() => setIsChangingPhone(false)}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Nome completo</Label>
                          <Input
                            placeholder="Ex: Ana Catarina Gomes"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="border"
                            style={{ borderColor: "#dce4d7" }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>E-mail</Label>
                          <Input
                            value={user?.email || ""}
                            disabled
                            className="border opacity-80 cursor-not-allowed"
                            style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5" }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Endereço principal</Label>
                        <Input
                          placeholder="Ex: Rua do Kinaxixi, Luanda"
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          className="border"
                          style={{ borderColor: "#dce4d7" }}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Bairro</Label>
                          <Input
                            placeholder="Ex: Rangel"
                            value={profileNeighborhood}
                            onChange={(e) => setProfileNeighborhood(e.target.value)}
                            className="border"
                            style={{ borderColor: "#dce4d7" }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ponto de referência</Label>
                          <Input
                            placeholder="Ex: Próximo ao CTT"
                            value={profileReference}
                            onChange={(e) => setProfileReference(e.target.value)}
                            className="border"
                            style={{ borderColor: "#dce4d7" }}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="w-full md:w-auto font-bold"
                        style={{ backgroundColor: "#072a1c", color: "#b5f176" }}
                      >
                        {isSavingProfile ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                        Guardar dados do perfil
                      </Button>

                      <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: "#f7faf5", borderColor: "#dce4d7" }}>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#607369" }}>Telefone Atual</p>
                          <p className="text-lg font-bold" style={{ color: "#072a1c" }}>{user?.phone || 'Não definido'}</p>
                        </div>
                        <Badge variant="outline" style={{ color: "#8bc14a", borderColor: "#dce4d7" }}>Validado</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Novo Número de Telemóvel</Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="+244 9XX XXX XXX" 
                            value={newPhoneNumber}
                            onChange={(e) => setNewPhoneNumber(formatPhoneNumber(e.target.value))}
                            className="border"
                            style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                          />
                          <Button 
                            disabled={!newPhoneNumber || newPhoneNumber.length < 9}
                            onClick={() => setIsChangingPhone(true)}
                          >
                            Validar e Alterar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'meds' && (
              <>
                <Card className="border shadow-sm" style={{ borderColor: "#dce4d7", backgroundColor: "#ffffff" }}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock style={{ color: "#8bc14a" }} />
                  Adicionar Novo Medicamento
                </CardTitle>
                <CardDescription style={{ color: "#607369" }}>Configure os horários para receber alertas automáticos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="dark:text-slate-300">Nome do Medicamento</Label>
                  <Input 
                    placeholder="Ex: Paracetamol 500mg" 
                    value={newMedicine}
                    onChange={(e) => setNewMedicine(e.target.value)}
                    className="border"
                    style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="dark:text-slate-300">Duração (Dias)</Label>
                    <Input 
                      type="number" 
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="border"
                      style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-slate-300">Adicionar Horário</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="time" 
                        value={newHour}
                        onChange={(e) => setNewHour(e.target.value)}
                        className="border"
                        style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                      />
                      <Button size="icon" onClick={addHour} type="button">
                        <Plus size={18} />
                      </Button>
                    </div>
                  </div>
                </div>

                {tempHours.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    {tempHours.map(h => (
                      <span key={h} className="px-3 py-1 bg-white dark:bg-slate-700 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold flex items-center gap-2">
                        <Clock size={12} /> {h}
                        <button onClick={() => setNewTempHours(tempHours.filter(x => x !== h))} className="hover:text-red-500 dark:hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={handleAddMedicine} 
                  disabled={isSaving}
                  className="w-full h-12 rounded-xl font-bold"
                  style={{ backgroundColor: "#072a1c", color: "#b5f176" }}
                >
                  {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                  Ativar Lembretes para este Medicamento
                </Button>
              </CardContent>
            </Card>

            {/* Reminders List */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calendar size={18} className="text-slate-400 dark:text-slate-500" />
                Medicamentos Ativos
              </h3>
              
              <AnimatePresence>
                {reminders.map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{reminder.medicineName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">{reminder.durationDays} dias</span>
                          <div className="flex gap-1">
                            {reminder.hours.map(h => (
                              <span key={h} className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md font-bold">{h}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={18} />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {reminders.length === 0 && (
                <div className="text-center py-12 bg-slate-100/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Pill size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">Nenhum lembrete configurado.</p>
                </div>
              )}
                </div>
              </>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2" style={{ color: "#072a1c" }}>
                  <Calendar size={18} style={{ color: "#8bc14a" }} />
                  Consultas Marcadas
                </h3>
                
                <AnimatePresence>
                  {appointments.map((appt) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            appt.status === 'confirmed' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 
                            appt.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 
                            'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                          }`}>
                            <UserRound size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200">{appt.professionalName}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{appt.specialty}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                                <Calendar size={12} /> {new Date(appt.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                                <Clock size={12} /> {appt.time}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                            appt.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                            appt.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 
                            'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}>
                            {appt.status === 'confirmed' ? 'Confirmada' : 
                             appt.status === 'pending' ? 'Pendente' : 'Cancelada'}
                          </span>
                          
                          {appt.status !== 'cancelled' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 p-1"
                              onClick={() => handleCancelAppointment(appt.id)}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {appointments.length === 0 && (
                  <div
                    className="text-center py-12 rounded-3xl border-2 border-dashed"
                    style={{ backgroundColor: "#ffffff", borderColor: "#dce4d7" }}
                  >
                    <Calendar size={40} className="mx-auto mb-3" style={{ color: "#8bc14a" }} />
                    <p style={{ color: "#607369" }}>Nenhuma consulta agendada.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}