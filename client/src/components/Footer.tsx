import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Brócolis" className="w-8 h-8 object-contain" />
              <span className="font-bold text-slate-800">Brócolis</span>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Saúde vitalícia ao alcance de todos. Encontre medicamentos e serviços de saúde perto de si.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Serviços</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="/farmacias" className="hover:text-green-600 transition-colors">Farmácias</a></li>
              <li><a href="/clinicas" className="hover:text-green-600 transition-colors">Clínicas</a></li>
              <li><a href="/profissionais" className="hover:text-green-600 transition-colors">Profissionais</a></li>
              <li><a href="/seguradoras" className="hover:text-green-600 transition-colors">Seguros</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Ajuda</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="/identificar" className="hover:text-green-600 transition-colors">Identificar Medicamento</a></li>
              <li><a href="/emergencia" className="hover:text-green-600 transition-colors">Contactos de Emergência</a></li>
              <li><a href="/configuracoes" className="hover:text-green-600 transition-colors">Configurações</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>suporte@brocolis.ao</li>
              <li>+244 923 000 000</li>
              <li>Luanda, Angola</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-100 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © {currentYear} Brócolis. Todos os direitos reservados.
          </p>
          <p className="text-sm text-slate-400 flex items-center gap-1">
            Feito com <Heart size={14} className="text-red-400 fill-red-400" /> em Angola
          </p>
        </div>
      </div>
    </footer>
  );
}
