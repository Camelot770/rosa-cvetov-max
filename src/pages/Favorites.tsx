import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import api from '../api/client';
import { imageUrl } from '../utils/image';
import { useCartStore } from '../store/cart';
import { hapticSuccess } from '../utils/platform';

interface FavItem {
  id: number;
  bouquetId: number;
  bouquet: {
    id: number;
    name: string;
    price: number;
    images: { url: string }[];
  };
}

export default function Favorites() {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [favorites, setFavorites] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/favorites').then(({ data }) => {
      setFavorites(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const removeFav = async (bouquetId: number) => {
    try {
      await api.delete(`/favorites/${bouquetId}`);
      setFavorites((prev) => prev.filter((f) => f.bouquetId !== bouquetId));
    } catch {}
  };

  const handleAdd = (b: FavItem['bouquet']) => {
    addItem({
      id: `bouquet-${b.id}`,
      bouquetId: b.id,
      name: b.name,
      price: b.price,
      image: b.images[0]?.url,
    });
    hapticSuccess();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-4">
        <div className="text-6xl mb-4">💝</div>
        <h2 className="text-xl font-bold text-gray-800">Избранного пока нет</h2>
        <p className="text-gray-700 mt-2 text-center font-medium">
          Нажмите ❤️ на понравившемся букете, чтобы сохранить его
        </p>
        <button
          onClick={() => navigate('/catalog')}
          className="mt-6 bg-primary text-white px-6 py-3 rounded-xl font-semibold"
        >
          Перейти в каталог
        </button>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-4 py-4 bg-white border-b">
        <h1 className="text-xl font-bold">Избранное</h1>
      </div>

      <div className="px-4 py-3 space-y-3">
        {favorites.map((fav) => (
          <div key={fav.id} className="bg-white rounded-xl shadow-sm flex overflow-hidden">
            <div
              onClick={() => navigate(`/bouquet/${fav.bouquet.id}`)}
              className="w-28 h-28 bg-pink-50 shrink-0 cursor-pointer"
            >
              {fav.bouquet.images[0]?.url ? (
                <img
                  src={imageUrl(fav.bouquet.images[0].url)}
                  alt={fav.bouquet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🌹</div>
              )}
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <p
                  onClick={() => navigate(`/bouquet/${fav.bouquet.id}`)}
                  className="font-bold text-gray-900 cursor-pointer"
                >
                  {fav.bouquet.name}
                </p>
                <p className="text-primary font-bold mt-1">{fav.bouquet.price} ₽</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAdd(fav.bouquet)}
                  className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                >
                  <ShoppingBag size={14} />
                  В корзину
                </button>
                <button
                  onClick={() => removeFav(fav.bouquetId)}
                  className="w-10 bg-red-50 rounded-lg flex items-center justify-center"
                >
                  <Heart size={16} className="fill-red-500 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
