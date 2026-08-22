import { useState, useEffect } from 'react';

interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  tag: string;
  userId: string;
  username: string;
  avatar?: string;
  createdAt: string;
}

interface ReviewStats {
  comunidad: { count: number; avgRating: number };
  total: number;
}

export function useHomeReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    comunidad: { count: 0, avgRating: 0 },
    total: 0
  });
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    fetchHomeReviews();
  }, []);

  const fetchHomeReviews = async () => {
    try {
      setLoading(true);
      const url = '/api/reviews-memory?tag=Comunidad&limit=6';
      
      const response = await fetch(url, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });

      if (!response.ok) throw new Error('Fallo en la respuesta de red');
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const safeReviews = (data.data.reviews || []).map((r: any) => ({
          ...r,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
        }));

        setReviews(safeReviews);
        setStats({
          comunidad: {
            count: data.data.stats?.comunidad?.count || 0,
            avgRating: data.data.stats?.comunidad?.avgRating || 0
          },
          total: data.data.stats?.total || 0
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas del Home:', error);
    } finally {
      setLoading(false);
    }
  };

  return { 
    reviews: reviews || [], 
    stats: stats || { comunidad: { count: 0, avgRating: 0 }, total: 0 }, 
    loading 
  };
}