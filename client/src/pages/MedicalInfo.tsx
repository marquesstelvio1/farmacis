import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Heart, Phone, AlertCircle, Droplets, Save, User, Shield, Activity, UserCheck, Loader2, Plus, Trash2, Clock, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface EmergencyContact {
  name: string;
  phone: string;
}

interface MedicalInfo {
  idNumber: string;
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
  medications: string;
  emergencyContacts: EmergencyContact[];
  insuranceProvider: string;
  insuranceNumber: string;
  isOrganDonor: boolean;
  observations: string;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não sei"];

export default function MedicalInfo() {
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({
    idNumber: "",
    bloodType: "",
    allergies: "",
    chronicDiseases: "",
    medications: "",
    emergencyContacts: [{ name: "", phone: "" }],
    insuranceProvider: "",
    insuranceNumber: "",
    isOrganDonor: false,
    observations: ""
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const { toast } = useToast();
  
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    const fetchMedicalInfo = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/user/${user.id}/medical-info`);
        if (res.ok) {
          const data = await res.json();
          if (data.id) {
            setMedicalInfo({
              ...data,
              emergencyContacts: data.emergencyContacts ? JSON.parse(data.emergencyContacts) : [{ name: "", phone: "" }]
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMedicalInfo();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/user/${user.id}/medical-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...medicalInfo,
          emergencyContacts: JSON.stringify(medicalInfo.emergencyContacts)
        }),
      });
      if (res.ok) {
        toast({ title: "Sucesso", description: "Dados médicos atualizados com segurança." });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof MedicalInfo, value: string | boolean) => {
    setMedicalInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...medicalInfo.emergencyContacts];
    newContacts[index][field] = value;

    // Auto-expand logic: if last contact is being typed and we have < 5
    const lastContact = newContacts[newContacts.length - 1];
    if (lastContact.name && lastContact.phone && newContacts.length < 5) {
      newContacts.push({ name: "", phone: "" });
    }

    setMedicalInfo(prev => ({ ...prev, emergencyContacts: newContacts }));
  };

  const removeContact = (index: number) => {
    if (medicalInfo.emergencyContacts.length <= 1) {
      setMedicalInfo(prev => ({ ...prev, emergencyContacts: [{ name: "", phone: "" }] }));
      return;
    }
    const newContacts = medicalInfo.emergencyContacts.filter((_, i) => i !== index);
    setMedicalInfo(prev => ({ ...prev, emergencyContacts: newContacts }));
  };

  const bmiData = useMemo(() => {
    const numericWeight = Number(weight);
    const numericHeightCm = Number(height);
    const numericHeightM = numericHeightCm / 100;

    if (!numericWeight || !numericHeightCm || numericHeightM <= 0) {
      return { value: null as number | null, label: "Preencha peso e altura", gaugeValue: 0 };
    }

    const bmi = numericWeight / (numericHeightM * numericHeightM);
    const rounded = Number(bmi.toFixed(1));

    let label = "Normal";
    if (rounded < 18.5) label = "Abaixo do peso";
    else if (rounded < 25) label = "Normal";
    else if (rounded < 30) label = "Sobrepeso";
    else label = "Obesidade";

    const min = 10;
    const max = 40;
    const normalized = Math.max(0, Math.min(1, (rounded - min) / (max - min)));
    return { value: rounded, label, gaugeValue: normalized };
  }, [weight, height]);

  const gaugeAngle = -90 + bmiData.gaugeValue * 180;
  const needleLength = 52;
  const centerX = 100;
  const centerY = 100;
  const needleX = centerX + needleLength * Math.cos((gaugeAngle * Math.PI) / 180);
  const needleY = centerY + needleLength * Math.sin((gaugeAngle * Math.PI) / 180);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f7faf5" }}>
      <Loader2 className="animate-spin w-10 h-10" style={{ color: "#8bc14a" }} />
    </div>
  );

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "#f7faf5" }}>
      <div className="max-w-3xl mx-auto px-4">
        <button
          type="button"
          onClick={() => window.location.assign("/menu-de-configuracoes")}
          className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 border transition"
          style={{ borderColor: "#dce4d7", color: "#072a1c", backgroundColor: "#ffffff" }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        {/* Digital Medical ID Card Preview */}
        <div className="mb-10 relative group">
          <div className="absolute -inset-1 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000" style={{ background: "linear-gradient(90deg, #8bc14a, #2f80ed)" }}></div>
          <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border" style={{ borderColor: "#dce4d7" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#072a1c" }}>
              <div className="flex items-center gap-3 text-white">
                <Heart className="fill-white animate-pulse" />
                <span className="font-black tracking-tighter text-xl">MEDICAL ID</span>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                Emergência
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nome</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{user?.name || '---'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tipo Sanguíneo</p>
                <p className="font-black text-xl" style={{ color: "#8bc14a" }}>{medicalInfo.bloodType || '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contacto SOS</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{medicalInfo.emergencyContacts[0]?.phone || '---'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doador</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{medicalInfo.isOrganDonor ? 'SIM' : 'NÃO'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#072a1c" }}>Informações Médicas</h1>
          <p style={{ color: "#607369" }}>
            Mantenha suas informações médicas atualizadas para um atendimento mais seguro.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border" style={{ borderColor: "#dce4d7", backgroundColor: "#ffffff" }}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Droplets className="w-5 h-5" style={{ color: "#8bc14a" }} />
                Dados Médicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#072a1c" }}>
                    Idade
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="130"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ex: 30"
                    className="w-full px-4 py-3 border rounded-xl outline-none"
                    style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#072a1c" }}>
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Ex: 72.5"
                    className="w-full px-4 py-3 border rounded-xl outline-none"
                    style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#072a1c" }}>
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Ex: 175"
                    className="w-full px-4 py-3 border rounded-xl outline-none"
                    style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border p-4" style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "#072a1c" }}>IMC</p>
                  <p className="text-sm font-bold" style={{ color: "#2f80ed" }}>
                    {bmiData.value ? `${bmiData.value} • ${bmiData.label}` : "—"}
                  </p>
                </div>
                <div className="mt-3 flex justify-center">
                  <svg width="220" height="130" viewBox="0 0 200 120" role="img" aria-label="Velocímetro de IMC">
                    <defs>
                      <linearGradient id="imcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2f80ed" />
                        <stop offset="100%" stopColor="#8bc14a" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#dce4d7"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="url(#imcGradient)"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={`${bmiData.gaugeValue * 252} 252`}
                    />
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={needleX}
                      y2={needleY}
                      stroke="#072a1c"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx={centerX} cy={centerY} r="5" fill="#072a1c" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#072a1c" }}>
                  Número do Bilhete (ID)
                </label>
                <input
                  type="text"
                  value={medicalInfo.idNumber}
                  onChange={(e) => updateField("idNumber", e.target.value)}
                  placeholder="000000000LA000"
                  className="w-full px-4 py-3 border rounded-xl outline-none"
                  style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#072a1c" }}>
                  Tipo Sanguíneo
                </label>
                <select
                  value={medicalInfo.bloodType}
                  onChange={(e) => updateField("bloodType", e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl outline-none"
                  style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                >
                  <option value="">Selecione seu tipo sanguíneo</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#072a1c" }}>
                  Alergias
                </label>
                <textarea
                  value={medicalInfo.allergies}
                  onChange={(e) => updateField("allergies", e.target.value)}
                  placeholder="Liste suas alergias (medicamentos, alimentos, etc.)"
                  className="w-full px-4 py-3 border rounded-xl h-24 resize-none"
                  style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#072a1c" }}>
                  Doenças Crônicas
                </label>
                <textarea
                  value={medicalInfo.chronicDiseases}
                  onChange={(e) => updateField("chronicDiseases", e.target.value)}
                  placeholder="Liste doenças crônicas (diabetes, hipertensão, etc.)"
                  className="w-full px-4 py-3 border rounded-xl h-24 resize-none"
                  style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#072a1c" }}>
                  Medicamentos em Uso
                </label>
                <textarea
                  value={medicalInfo.medications}
                  onChange={(e) => updateField("medications", e.target.value)}
                  placeholder="Liste medicamentos que você usa atualmente"
                  className="w-full px-4 py-3 border rounded-xl h-24 resize-none"
                  style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border" style={{ borderColor: "#dce4d7", backgroundColor: "#ffffff" }}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="w-5 h-5" style={{ color: "#8bc14a" }} />
                Contactos de Emergência (Máx. 5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {medicalInfo.emergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex gap-3 items-end p-3 rounded-2xl border relative group/contact"
                  style={{ backgroundColor: "#f7faf5", borderColor: "#dce4d7" }}
                >
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold uppercase" style={{ color: "#607369" }}>Nome</label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContact(index, "name", e.target.value)}
                      placeholder="Ex: Maria (Mãe)"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      style={{ backgroundColor: "#ffffff", borderColor: "#dce4d7", color: "#072a1c" }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold uppercase" style={{ color: "#607369" }}>Telefone</label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContact(index, "phone", e.target.value)}
                      placeholder="9XXXXXXXX"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      style={{ backgroundColor: "#ffffff", borderColor: "#dce4d7", color: "#072a1c" }}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeContact(index)}
                    className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 mb-1"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#072a1c" }}>
                  Observações Adicionais
                </label>
                <textarea
                  value={medicalInfo.observations}
                  onChange={(e) => updateField("observations", e.target.value)}
                  placeholder="Outras informações importantes para emergências"
                  className="w-full px-4 py-3 border rounded-xl h-24 resize-none"
                  style={{ borderColor: "#dce4d7", backgroundColor: "#f7faf5", color: "#072a1c" }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 font-semibold py-3 rounded-xl"
              style={{ backgroundColor: "#072a1c", color: "#b5f176" }}
            >
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? "A guardar..." : "Guardar Informações"}
            </Button>
          </div>

          <div className="border rounded-xl p-4" style={{ backgroundColor: "#eef7e8", borderColor: "#dce4d7" }}>
            <p className="text-sm flex items-start gap-2" style={{ color: "#607369" }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              Estas informações serão usadas apenas para fornecer um atendimento mais seguro e personalizado. 
              Os dados são armazenados localmente no seu dispositivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
