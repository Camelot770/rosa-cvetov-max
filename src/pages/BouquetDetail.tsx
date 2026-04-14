import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const touchRef = useRef<{ startX: number; startY: number; startDist: number; startScale: number; startTranslate: { x: number; y: number }; isSwiping: boolean }>({ startX: 0, startY: 0, startDist: 0, startScale: 1, startTranslate: { x: 0, y: 0 }, isSwiping: false });


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
    const wasFav = isFav;
    setIsFav(!wasFav); // optimistic update
    hapticLight();
    try {
      if (wasFav) {
        await api.delete(`/favorites/${id}`);
      } else {
        await api.post(`/favorites/${id}`);
      }
    } catch (err) {
      setIsFav(wasFav); // revert on error
      console.error('Favorites error:', err);
    }
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

  const openFullscreen = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setFullscreen(true);
    hapticLight();
  };

  const closeFullscreen = () => {
    setFullscreen(false);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const getDistance = (t1: React.Touch, t2: React.Touch) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchRef.current.startDist = getDistance(e.touches[0], e.touches[1]);
      touchRef.current.startScale = scale;
      touchRef.current.isSwiping = false;
    } else if (e.touches.length === 1) {
      touchRef.current.startX = e.touches[0].clientX;
      touchRef.current.startY = e.touches[0].clientY;
      touchRef.current.startTranslate = { ...translate };
      touchRef.current.isSwiping = scale <= 1;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches[0], e.touches[1]);
      const newScale = Math.min(4, Math.max(1, touchRef.current.startScale * (dist / touchRef.current.startDist)));
      setScale(newScale);
      if (newScale <= 1) setTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && scale > 1) {
      const dx = e.touches[0].clientX - touchRef.current.startX;
      const dy = e.touches[0].clientY - touchRef.current.startY;
      setTranslate({
        x: touchRef.current.startTranslate.x + dx,
        y: touchRef.current.startTranslate.y + dy,
      });
      touchRef.current.isSwiping = false;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale <= 1 && touchRef.current.isSwiping && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      if (Math.abs(dx) > 60) {
        if (dx < 0 && currentImage < images.length - 1) setCurrentImage(currentImage + 1);
        if (dx > 0 && currentImage > 0) setCurrentImage(currentImage - 1);
      }
    }
    if (scale <= 1) setTranslate({ x: 0, y: 0 });
  };

  return (
    <div className="pb-4">
      {/* Fullscreen image viewer */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <X size={22} className="text-white" />
          </button>

          <div className="absolute top-5 left-0 right-0 text-center text-white/70 text-sm">
            {currentImage + 1} / {images.length}
          </div>

          <div
            className="flex-1 flex items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={imageUrl(images[currentImage].url)}
              alt={bouquet.name}
              className="max-w-full max-h-full object-contain transition-transform duration-100"
              style={{ transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)` }}
              draggable={false}
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentImage(i); setScale(1); setTranslate({ x: 0, y: 0 }); }}
                  className={`w-2.5 h-2.5 rounded-full ${i === currentImage ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image gallery */}
      <div className="relative aspect-square bg-pink-50">
        {images[currentImage]?.url ? (
          <img
            src={imageUrl(images[currentImage].url)}
            alt={bouquet.name}
            className="w-full h-full object-cover cursor-pointer"
            onClick={openFullscreen}
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
