import { useState, useRef } from "react";
import { Upload, X, CheckCircle2, Image as ImageIcon, Receipt } from "lucide-react";

interface PaymentProofProps {
  onUpload: (base64: string) => void;
  onRemove: () => void;
  currentProof?: string;
  isRequired?: boolean;
}

export function PaymentProofUpload({ onUpload, onRemove, currentProof, isRequired }: PaymentProofProps) {
  const [preview, setPreview] = useState<string | null>(currentProof || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem (JPG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onUpload(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (preview) {
    return (
      <div className="relative">
        <img
          src={preview}
          alt="Comprovativo"
          className="w-full h-48 object-contain rounded-xl border border-green-200 bg-green-50"
        />
        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <CheckCircle2 size={12} />
          Comprovativo carregado
        </div>
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-6 border-2 border-dashed border-amber-300 rounded-xl text-center hover:bg-amber-50 hover:border-amber-400 transition-colors"
      >
        <Receipt className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-amber-700">Carregar Comprovativo</p>
        <p className="text-xs text-amber-500 mt-1">JPG, PNG (máx. 5MB)</p>
      </button>
      {isRequired && (
        <p className="text-xs text-amber-600 text-center">
          Comprovativo obrigatório para confirmar pagamento
        </p>
      )}
    </div>
  );
}
