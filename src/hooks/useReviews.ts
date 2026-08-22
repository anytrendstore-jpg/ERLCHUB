"use client";

import { useState, useEffect } from 'react';
import { useDiscordAuth } from './useDiscordAuth';

interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  tag: 'Comunidad' | 'Tienda' | 'Hub Coins';
  userId?: string;
  username?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  comunidad: { count: number; avgRating: number };
  tienda: { count: number; avgRating: number };
  hubCoins: { count: number; avgRating: number };
  total: number;
}

const reviewsCache = new Map<string, { reviews: Review[]; stats: ReviewStats; timestamp: number }>();
const CACHE_DURATION = 30 * 1000;
let forceRefresh = false;

export function useReviews(tag?: 'Comunidad' | 'Tienda' | 'Hub Coins' | 'Todas') {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    comunidad: { count: 0, avgRating: 0 },
    tienda: { count: 0, avgRating: 0 },
    hubCoins: { count: 0, avgRating: 0 },
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useDiscordAuth();

  useEffect(() => {
    fetchReviews();
  }, [tag]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url;
      if (tag === 'Todas') {
        url = '/api/reviews-memory?limit=50';
      } else if (tag) {
        url = `/api/reviews-memory?tag=${tag}&limit=50`;
      } else {
        url = '/api/reviews-memory?limit=50';
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const newReviews = data.data.reviews || [];
        const newStats = data.data.stats || {
          comunidad: { count: 0, avgRating: 0 },
          tienda: { count: 0, avgRating: 0 },
          hubCoins: { count: 0, avgRating: 0 },
          total: 0
        };
        
        setReviews(newReviews);
        setStats(newStats);
        
        const cacheKey = tag || 'all';
        reviewsCache.set(cacheKey, {
          reviews: newReviews,
          stats: newStats,
          timestamp: Date.now()
        });
      } else {
        throw new Error(data.error || 'API returned failure');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Timeout fetching reviews, keeping existing data');
        return;
      }
      
      setError(error instanceof Error ? error.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData: {
    rating: number;
    comment: string;
    tag: 'Comunidad' | 'Tienda' | 'Hub Coins';
  }) => {
    if (!isAuthenticated) {
      throw new Error('You must be logged in to create a review');
    }

    try {
      const response = await fetch('/api/reviews-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reviewData,
          userId: user?.id,
          username: user?.global_name || user?.username,
          avatar: user?.avatar,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create review');
      }

      const data = await response.json();
      
      if (data.success) {
        const newReview = data.data;
        
        setReviews(prev => [newReview, ...prev]);
        
        setStats(prev => {
          const newStats = { ...prev };
          
          newStats.total = prev.total + 1;
          
          if (newReview.tag === 'Comunidad') {
            const currentCount = prev.comunidad.count;
            const currentAvg = prev.comunidad.avgRating;
            const newCount = currentCount + 1;
            const newAvg = ((currentAvg * currentCount) + newReview.rating) / newCount;
            
            newStats.comunidad = {
              count: newCount,
              avgRating: newAvg
            };
          } else if (newReview.tag === 'Tienda') {
            const currentCount = prev.tienda.count;
            const currentAvg = prev.tienda.avgRating;
            const newCount = currentCount + 1;
            const newAvg = ((currentAvg * currentCount) + newReview.rating) / newCount;
            
            newStats.tienda = {
              count: newCount,
              avgRating: newAvg
            };
          } else if (newReview.tag === 'Hub Coins') {
            const currentCount = prev.hubCoins.count;
            const currentAvg = prev.hubCoins.avgRating;
            const newCount = currentCount + 1;
            const newAvg = ((currentAvg * currentCount) + newReview.rating) / newCount;
            
            newStats.hubCoins = {
              count: newCount,
              avgRating: newAvg
            };
          }
          
          return newStats;
        });
        
        
        return newReview;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      throw error;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starClass = i < rating ? 'text-yellow-400' : 'text-gray-600';
      return `${starClass}★`;
    }).join('');
  };

  return {
    reviews,
    stats,
    loading,
    error,
    createReview,
    renderStars,
    isAuthenticated,
    user,
    refetch: fetchReviews,
  };
}