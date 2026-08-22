"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Star, MessageSquare, ShoppingBag, Plus, X, Coins, List } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import Image from "next/image";

export default function ReviewsPage() {
  const [selectedTag, setSelectedTag] = useState<'Comunidad' | 'Tienda' | 'Hub Coins' | 'Todas'>('Todas');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    tag: 'Comunidad' as 'Comunidad' | 'Tienda' | 'Hub Coins'
  });
  
  const router = useRouter();
  const { reviews = [], stats, loading, createReview, isAuthenticated } = useReviews(selectedTag);
  const { user } = useDiscordAuth();

  const renderStarsJSX = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < (rating || 0) ? 'text-yellow-400' : 'text-gray-600'}>
        ★
      </span>
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push('/ingresar');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await createReview({
        ...formData,
        tag: formData.tag
      });
      
      setFormData({
        rating: 5,
        comment: '',
        tag: 'Comunidad'
      });
      setShowReviewForm(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear la reseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagChange = (tag: 'Comunidad' | 'Tienda' | 'Hub Coins' | 'Todas') => {
    setSelectedTag(tag);
    if (tag !== 'Todas') {
      setFormData(prev => ({ ...prev, tag: tag as 'Comunidad' | 'Tienda' | 'Hub Coins' }));
    }
  };

  if (loading && (!reviews || reviews.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0a0a12] pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-[#8e00f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando reseñas...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] pt-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            Reseñas de la Comunidad
            {loading && (
              <div className="w-5 h-5 border-2 border-[#8e00f7] border-t-transparent rounded-full animate-spin"></div>
            )}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Comparte tu experiencia y ayuda a otros usuarios a tomar mejores decisiones
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 max-w-5xl mx-auto">
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats?.total || 0}</div>
            <div className="text-gray-400 text-sm">Total Reseñas</div>
          </div>
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white">{stats?.comunidad?.count || 0}</div>
            <div className="text-gray-400 text-xs">Comunidad</div>
            <div className="flex justify-center mt-1">{renderStarsJSX(Math.round(stats?.comunidad?.avgRating || 0))}</div>
          </div>
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white">{stats?.tienda?.count || 0}</div>
            <div className="text-gray-400 text-xs">Tienda</div>
            <div className="flex justify-center mt-1">{renderStarsJSX(Math.round(stats?.tienda?.avgRating || 0))}</div>
          </div>
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white">{stats?.hubCoins?.count || 0}</div>
            <div className="text-gray-400 text-xs">Hub Coins</div>
            <div className="flex justify-center mt-1">{renderStarsJSX(Math.round(stats?.hubCoins?.avgRating || 0))}</div>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-1 inline-flex flex-wrap justify-center">
            {(['Comunidad', 'Tienda', 'Hub Coins', 'Todas'] as const).map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedTag === tag ? 'bg-[#8e00f7] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                router.push('/ingresar');
                return;
              }
              setShowReviewForm(true);
            }}
            className="bg-[#8e00f7] hover:bg-[#7a00d4] text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {isAuthenticated ? 'Escribir Reseña' : 'Iniciar Sesión para Reseñar'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {(reviews || []).map((review: any) => (
            <div key={review._id || Math.random()} className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {review?.avatar && review?.userId ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${review.userId}/${review.avatar}.png?size=40`}
                      alt={review?.username || review?.name}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/0.png?size=40`;
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#8e00f7] flex items-center justify-center text-white font-bold">
                      {(review?.username || review?.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-white font-medium">{review?.username || review?.name || "Usuario"}</div>
                    <div className="text-gray-400 text-sm">
                      {review?.userId ? 'Usuario Discord' : 'Usuario Invitado'}
                    </div>
                  </div>
                </div>
                <span className="bg-[#8e00f7] text-white text-[10px] px-2 py-1 rounded-full uppercase font-bold">
                  {review?.tag}
                </span>
              </div>
              <div className="flex mb-3">
                {renderStarsJSX(review?.rating || 0)}
              </div>
              <p className="text-gray-300 mb-4 line-clamp-3 italic">"{review?.comment}"</p>
              <div className="text-gray-500 text-sm">
                {review?.createdAt ? new Date(review.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Fecha no disponible'}
              </div>
            </div>
          ))}
        </div>

        {(!reviews || reviews.length === 0) && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-4">No hay reseñas todavía</div>
          </div>
        )}
      </div>

      {showReviewForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Escribir Reseña</h2>
              <button onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white mb-2 text-sm">¿Qué estás reseñando?</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Comunidad', 'Tienda', 'Hub Coins'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tag: t }))}
                      className={`px-2 py-2 rounded-lg text-xs font-bold transition-all ${
                        formData.tag === t ? 'bg-[#8e00f7] text-white' : 'bg-[#1e1e2e] text-gray-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-white mb-2 text-sm">Calificación</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                      className="text-2xl"
                    >
                      <span className={star <= formData.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-white mb-2 text-sm">Tu Reseña</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl text-white text-sm h-32 resize-none focus:border-[#8e00f7] outline-none"
                  placeholder="Comparte tu experiencia..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 px-4 py-3 bg-[#1e1e2e] text-white rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#8e00f7] text-white rounded-xl font-bold text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Publicar Reseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}