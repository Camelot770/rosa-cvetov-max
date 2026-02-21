import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client';
import { imageUrl } from '../utils/image';
import { useCartStore } from '../store/cart';
import { hapticLight, hapticSuccess } from '../utils/platform';

interface Bouquet {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: string;
  tags: string[];
  isHit: boolean;
  isNew: boolean;
  images: { id: number; url: string }[];
}

export default function BouquetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [bouquet, setBouquet] = useState<Bouquet | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    api.get(`/bouquets/${id}`).then(({ data }) => {
      setBouquet(data);
      setLoading(false);
    }).catch(() => setLoading(false));

    api.get('/favorites').then(({ data }) => {
      if (data.some((f: any) => f.bouquetId === Number(id))) setIsFav(true);
    }).catch(() => {});
  }, [id]);

  const toggleFav = async () => {
    try {
      if (isFav) {
        await api.delete(`/favorites/${id}`);
        setIsFav(false);
      } else {
        await api.post(`/favorites/${id}`);
        setIsFav(true);
      }
      hapticLight();
    } catch {}
  };

  const handleAddToCart = () => {
    if (!bouquet) return;
    addItem({
      id: `bouquet-${bouquet.id}`,
      bouquetId: bouquet.id,
      name: bouquet.name,
      price: bouquet.price,
      image: bouquet.images[0]?.url,
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

  if (!bouquet) {
    return (
      <div className="p-4 text-center mt-20">
        <p className="text-gray-700 font-medium">Букет не найден</p>
        <button onClick={() => navigate('/catalog')} className="mt-4 text-primary">
          Вернуться в каталог
        </button>
      </div>
    );
  }

  const images = bouquet.images.length > 0 ? bouquet.images : [{ id: 0, url: '' }];

  return (
    <div className="pb-4">
      {/* Image gallery */}
      <div className="relative aspect-square bg-pink-50">
        {images[currentImage]?.url ? (
          <img
            src={imageUrl(images[currentImage].url)}
            alt={bouquet.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🌹</div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 z-20 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-gray-800" />
        </button>

        {/* Favorite button */}
        <button
          onClick={toggleFav}
          className="absolute top-3 right-3 z-20 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <Heart size={20} className={isFav ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
        </button>

        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-2 h-2 rounded-full ${i === currentImage ? 'bg-primary' : 'bg-white/60'}`}
              />
            ))}
          </div>
        )}

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImage((p) => (p > 0 ? p - 1 : images.length - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentImage((p) => (p < images.length - 1 ? p + 1 : 0))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-16 flex gap-2">
          {bouquet.isHit && (
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">Хит</span>
          )}
          {bouquet.isNew && (
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Новинка</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold">{bouquet.name}</h1>

        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-2xl font-bold text-primary">{bouquet.price} ₽</span>
          {bouquet.oldPrice && (
            <span className="text-lg text-gray-500 line-through">{bouquet.oldPrice} ₽</span>
          )}
        </div>

        <p className="text-gray-800 font-medium mt-3 leading-relaxed">{bouquet.description}</p>

        {bouquet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {bouquet.tags.map((tag) => (
              <span key={tag} className="bg-pink-50 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          className="w-full mt-6 bg-primary text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <ShoppingBag size={20} />
          В корзину
        </button>
      </div>
    </div>
  );
}
