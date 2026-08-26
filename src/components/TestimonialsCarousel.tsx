"use client";

import { useRef, useState, useEffect } from "react";
import { Star, CheckCircle } from "lucide-react";
import { useHomeReviews } from "@/hooks/useHomeReviews";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";

interface Testimonial {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  tag: 'Comunidad' | 'Tienda';
  userId?: string;
  username?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { reviews, loading } = useHomeReviews(); 
  const { isAuthenticated } = useDiscordAuth();

  const bestReviews = reviews.filter((review: any) => review.rating >= 4).slice(0, 6);

  useEffect(() => {
    if (isPaused || loading || bestReviews.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bestReviews.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, loading, bestReviews.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? bestReviews.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % bestReviews.length);
  };

  if (loading) {
    return (
      <div className="w-full py-16 text-center">
        <div className="text-[var(--text-muted)] text-lg">Cargando mejores reseñas...</div>
      </div>
    );
  }

  if (bestReviews.length === 0) {
    return (
      <div className="w-full py-16 text-center">
        <div className="text-[var(--text-muted)] text-lg mb-4">
          Aún no hay reseñas de la comunidad
        </div>
        <div className="text-[var(--text-faint)]">
          Sé el primero en compartir tu experiencia
        </div>
      </div>
    );
  }

  const renderStarsJSX = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-600'}>
        ★
      </span>
    ));
  };

  const currentReview = bestReviews[currentIndex];

  return (
    <div className="w-full py-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
            Lo que dicen nuestros usuarios
          </h2>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
            Descubre las experiencias de nuestra comunidad con ERLC HUB
          </p>
        </div>

        {/* Main Testimonial */}
        <div className="relative">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 md:p-12 shadow-2xl">
            {/* Rating Stars */}
            <div className="flex justify-center mb-6">
              {renderStarsJSX(currentReview.rating)}
            </div>

            {/* Review Text */}
            <blockquote className="text-[var(--text-muted)] text-lg md:text-xl leading-relaxed mb-8 text-center">
              "{currentReview.comment}"
            </blockquote>

            {/* User Info */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                {currentReview.avatar && currentReview.userId ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${currentReview.userId}/${currentReview.avatar}.png?size=48`}
                    alt={currentReview.username || currentReview.name}
                    className="w-12 h-12 rounded-full border-2 border-[#8e00f7]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#8e00f7] flex items-center justify-center text-white font-bold text-lg border-2 border-[#8e00f7]">
                    {currentReview.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-[var(--foreground)] font-semibold text-lg">
                    {currentReview.name}
                  </div>
                  <div className="text-[var(--text-muted)] text-sm">
                    {currentReview.username || 'Usuario de ERLC HUB'}
                  </div>
                </div>
              </div>
              <div className="bg-[#8e00f7] text-white text-xs px-3 py-1 rounded-full">
                {currentReview.tag}
              </div>
            </div>

            {/* Date */}
            <div className="text-center mt-6">
              <div className="text-[var(--text-faint)] text-sm">
                {new Date(currentReview.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-[var(--card-bg-2)] hover:bg-[#2a2a3e] text-[var(--foreground)] p-3 rounded-full transition-all hover:scale-110 shadow-lg"
            aria-label="Anterior"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--card-bg-2)] hover:bg-[#2a2a3e] text-[var(--foreground)] p-3 rounded-full transition-all hover:scale-110 shadow-lg"
            aria-label="Siguiente"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {bestReviews.map((_: Testimonial, index: number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-[#8e00f7] w-8"
                  : "bg-[var(--card-bg-2)] hover:bg-[#2a2a3e]"
              }`}
              aria-label={`Ir a reseña ${index + 1}`}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)] mb-2">
              {bestReviews.length}+
            </div>
            <div className="text-[var(--text-muted)]">Reseñas Positivas</div>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)] mb-2">
              {(() => {
                if (bestReviews.length === 0) return '0.0';
                const total = bestReviews.reduce((acc: number, r: any) => acc + r.rating, 0);
                return (total / bestReviews.length).toFixed(1);
              })()}
            </div>
            <div className="text-[var(--text-muted)]">Calificación Promedio</div>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)] mb-2">100%</div>
            <div className="text-[var(--text-muted)]">Usuarios Satisfechos</div>
          </div>
        </div>
      </div>
    </div>
  );
}
