import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Star, User, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";

interface Comment {
  id: number;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface Pharmacy {
  id: number;
  name: string;
}

export function PharmacyComments() {
  const { pharmacyId } = useParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch pharmacy details
        const pharmacyRes = await fetch(`/api/pharmacies/${pharmacyId}`);
        if (pharmacyRes.ok) {
          const pharmacyData = await pharmacyRes.json();
          setPharmacy(pharmacyData);
        }

        // Fetch comments
        const commentsRes = await fetch(`/api/pharmacies/${pharmacyId}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(Array.isArray(commentsData) ? commentsData : []);
        } else {
          setComments([]);
        }
      } catch (err: any) {
        setError(err.message || "Erro ao carregar comentários");
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    if (pharmacyId) {
      fetchData();
    }
  }, [pharmacyId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faf6" }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "#8bc14a" }} />
          <p className="font-semibold" style={{ color: "#072a1c" }}>Carregando comentários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ background: "#f8faf6" }}>
      <div className="max-w-3xl mx-auto py-8">
        <Link href="/menu-de-configuracoes">
          <Button
            variant="ghost"
            className="mb-8 hover:scale-105 transition"
            style={{ color: "#072a1c", background: "rgba(181, 241, 118, 0.4)" }}
          >
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
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(139, 193, 74, 0.2)" }}>
                <MessageCircle className="w-6 h-6" style={{ color: "#8bc14a" }} />
              </div>
              <h1 className="text-4xl font-black" style={{ color: "#072a1c" }}>
                Comentários
              </h1>
            </div>
            {pharmacy && (
              <p className="text-lg" style={{ color: "#607369" }}>
                {pharmacy.name}
              </p>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
              <p style={{ color: "#ef4444" }}>{error}</p>
            </div>
          )}

          {/* Empty State - Nenhum comentário ainda */}
          {!loading && comments.length === 0 && !error && (
            <div className="text-center py-12" style={{ color: "#607369" }}>
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-xl font-semibold mb-2">Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a avaliar esta farmácia!</p>
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 && (
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl p-6"
                  style={{ background: "#ffffff", border: "1px solid #dce4d7" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139, 193, 74, 0.2)" }}>
                      <User className="w-5 h-5" style={{ color: "#8bc14a" }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold" style={{ color: "#072a1c" }}>{comment.userName}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400" style={{ color: "#fbbf24" }} />
                          <span className="font-semibold text-sm" style={{ color: "#fbbf24" }}>
                            {comment.rating}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm mb-3" style={{ color: "#607369" }}>{comment.text}</p>
                      <p className="text-xs" style={{ color: "#607369", opacity: 0.7 }}>
                        {new Date(comment.createdAt).toLocaleDateString('pt-AO')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
