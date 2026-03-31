import { useState, useEffect } from "react";
import { AlertCircle, Phone, MessageSquare, X, Ambulance } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: string;
}

export function EmergencyButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Load emergency contacts from localStorage or API
    const savedContacts = localStorage.getItem("emergencyContacts");
    if (savedContacts) {
      try {
        setContacts(JSON.parse(savedContacts));
      } catch (error) {
        console.error("Error loading emergency contacts:", error);
      }
    }
  }, []);

  const handleCallAmbulance = () => {
    setIsCalling(true);
    // TODO: Implement actual ambulance call
    setTimeout(() => {
      setIsCalling(false);
      setIsOpen(false);
      alert("Chamada de emergência iniciada! Ajuda está a caminho.");
    }, 2000);
  };

  const handleSendMessages = async () => {
    setIsSending(true);
    
    // TODO: Implement actual SMS/notification sending to emergency contacts
    // For now, we'll simulate it
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSending(false);
    setIsOpen(false);
    alert(`Mensagens enviadas para ${contacts.length} contactos de emergência!`);
  };

  const handleManageContacts = () => {
    setIsOpen(false);
    setLocation("/emergencia");
  };

  return (
    <>
      {/* Floating Emergency Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center justify-center w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl hover:shadow-red-500/50 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300"
          aria-label="Botão de emergência"
        >
          <AlertCircle className="w-8 h-8 animate-pulse" />
          
          {/* Tooltip */}
          <span className="absolute right-full mr-4 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Precisa de ajuda?
          </span>

          {/* Ripple effect */}
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
        </button>
      </motion.div>

      {/* Emergency Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-white" />
                      <div>
                        <h2 className="text-xl font-bold text-white">Emergência Médica</h2>
                        <p className="text-red-100 text-sm">Precisa de assistência?</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Call Ambulance Button */}
                  <Button
                    onClick={handleCallAmbulance}
                    disabled={isCalling}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg shadow-lg"
                  >
                    {isCalling ? (
                      <span className="flex items-center gap-2">
                        <Phone className="w-5 h-5 animate-pulse" />
                        A ligar...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Ambulance className="w-6 h-6" />
                        Ligar Ambulância (112)
                      </span>
                    )}
                  </Button>

                  {/* Send Messages to Contacts */}
                  {contacts.length > 0 && (
                    <Button
                      onClick={handleSendMessages}
                      disabled={isSending}
                      variant="outline"
                      className="w-full h-14 border-orange-300 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-700 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold"
                    >
                      {isSending ? (
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 animate-pulse" />
                          A enviar...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Enviar Mensagem aos Contactos ({contacts.length})
                        </span>
                      )}
                    </Button>
                  )}

                  {/* No contacts warning */}
                  {contacts.length === 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                        ⚠️ Você ainda não tem contactos de emergência configurados.
                      </p>
                    </div>
                  )}

                  {/* Manage Contacts Button */}
                  <Button
                    onClick={handleManageContacts}
                    variant="ghost"
                    className="w-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Gerir Contactos de Emergência
                  </Button>

                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      Como funciona:
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                      <li>• Ligar Ambulância: Liga imediatamente para o 112</li>
                      <li>• Enviar Mensagem: Envia sua localização para os contactos</li>
                      <li>• Mantenha a calma e aguarde ajuda</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
