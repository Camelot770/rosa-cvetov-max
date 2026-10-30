import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../api/client';
import { imageUrl } from '../utils/image';
import { useCartStore } from '../store/cart';
import { hapticLight, hapticSuccess } from '../utils/platform';

interface Bouquet {
  id: number; name: string; description: string;
  price: number; oldPrice?: number; category: string;
  tags: string[]; isHit: boolean; isNew: boolean;
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
  const [added, setAdded] = useState(false);
  const touchRef = useRef<{
    startX: number; startY: number; startDist: number;
    startScale: number; startTranslate: { x: number; y: number };
    isSwiping: boolean;
  }>({ startX: 0, startY: 0, startDist: 0, startScale: 1, startTranslate: { x: 0, y: 0 }, isSwiping: false });

  useEffect(() => {
    api.get(`/bouquets/${id}`)
      .then(({ data }) => { setBouquet(data); setLoading(false); })
      .catch(() => setLoading(false));
    api.get('/favorites')
      .then(({ data }) => {
        if (data.some((f: any) => f.bouquetId === Number(id))) setIsFav(true);
      })
      .catch(() => {});
  }, [id]);

  const toggleFav = async () => {
    const wasFav = isFav;
    setIsFav(!wasFav);
    hapticLight();
    try {
      wasFav ? await api.delete(`/favorites/${id}`) : await api.post(`/favorites/${id}`);
    } catch { setIsFav(wasFav); }
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
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div
          className="w-6 h-6 rounded-full animate-spin"
          style={{ border: '2px solid var(--vermilion)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!bouquet) {
    return (
      <div className="px-5 py-20 text-center">
        <div className="caps mb-3" style={{ color: 'var(--taupe)' }}>✦ 404</div>
        <h1 className="disp text-3xl">Букет не найден.</h1>
        <button
          onClick={() => navigate('/catalog')}
          className="mt-6 caps underline underline-offset-4"
          style={{ color: 'var(--vermilion)' }}
        >
          Вернуться в каталог →
        </button>
      </div>
    );
  }

  const images = bouquet.images.length > 0 ? bouquet.images : [{ id: 0, url: '' }];

  const openFullscreen = () => {
    setScale(1); setTranslate({ x: 0, y: 0 }); setFullscreen(true); hapticLight();
  };
  const closeFullscreen = () => {
    setFullscreen(false); setScale(1); setTranslate({ x: 0, y: 0 });
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
      const d = getDistance(e.touches[0], e.touches[1]);
      const ns = Math.min(4, Math.max(1, touchRef.current.startScale * (d / touchRef.current.startDist)));
      setScale(ns);
      if (ns <= 1) setTranslate({ x: 0, y: 0 });
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
    <div className="pb-32">
      {/* Fullscreen viewer */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: '#000' }}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <X size={20} strokeWidth={1.5} color="white" />
          </button>
          <div
            className="absolute top-5 left-0 right-0 text-center"
            style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.15em' }}
          >
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
                  className="w-2 h-2"
                  style={{
                    background: i === currentImage ? 'white' : 'rgba(255,255,255,0.4)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Head bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--ink-line)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center"
          style={{ border: '1px solid var(--ink-line)' }}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div className="caps" style={{ color: 'var(--taupe)' }}>
          Pl. · {String(bouquet.id).padStart(2, '0')}
        </div>
        <button
          onClick={toggleFav}
          className="w-9 h-9 flex items-center justify-center"
          style={{ border: '1px solid var(--ink-line)' }}
        >
          <Heart
            size={16}
            strokeWidth={1.5}
            fill={isFav ? 'var(--vermilion)' : 'none'}
            style={{ color: isFav ? 'var(--vermilion)' : 'var(--ink)' }}
          />
        </button>
      </div>

      {/* Hero image 4:5 */}
      <div className="relative img-slot" style={{ aspectRatio: '4 / 5' }}>
        {images[currentImage]?.url ? (
          <img
            src={imageUrl(images[currentImage].url)}
            alt={bouquet.name}
            className="w-full h-full object-cover"
            onClick={openFullscreen}
          />
        ) : null}

        {/* Chips */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {bouquet.isHit && (
            <span
              className="px-1.5 py-0.5"
              style={{ background: 'var(--vermilion)', color: 'var(--paper)',
                fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.2em' }}
            >
              HIT
            </span>
          )}
          {bouquet.isNew && (
            <span
              className="px-1.5 py-0.5"
              style={{ background: 'var(--ink)', color: 'var(--paper)',
                fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.2em' }}
            >
              NEW
            </span>
          )}
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImage((p) => (p > 0 ? p - 1 : images.length - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
              style={{ background: 'var(--paper)', border: '1px solid var(--ink-line)' }}
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setCurrentImage((p) => (p < images.length - 1 ? p + 1 : 0))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
              style={{ background: 'var(--paper)', border: '1px solid var(--ink-line)' }}
            >
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className="w-1.5 h-1.5"
                  style={{
                    background: i === currentImage ? 'var(--vermilion)' : 'rgba(26,22,18,0.3)',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Caption line like in rosa-web */}
      <div
        className="px-4 py-3 flex items-baseline justify-between"
        style={{ borderBottom: '1px solid var(--ink-line)',
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-soft)',
          letterSpacing: '0.1em' }}
      >
        <span><strong style={{ color: 'var(--ink)' }}>Plate</strong> · «{bouquet.name}»</span>
        <span><strong style={{ color: 'var(--ink)' }}>{fmt(bouquet.price)}</strong></span>
      </div>

      {/* Info */}
      <div className="px-5 pt-6">
        <h1 className="disp" style={{ fontSize: 36 }}>«{bouquet.name}»</h1>

        <div className="flex items-baseline gap-3 mt-3">
          <span className="font-mono text-xl" style={{ color: 'var(--ink)' }}>{fmt(bouquet.price)}</span>
          {bouquet.oldPrice && bouquet.oldPrice > bouquet.price && (
            <span className="font-mono text-sm line-through" style={{ color: 'var(--taupe)' }}>
              {fmt(bouquet.oldPrice)}
            </span>
          )}
        </div>

        {bouquet.description && (
          <>
            <div className="rail my-5" />
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--ink-soft)' }}
            >
              {bouquet.description}
            </p>
          </>
        )}

        {bouquet.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {bouquet.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 caps"
                style={{ background: 'var(--paper-2)', color: 'var(--ink)',
                  border: '1px solid var(--ink-line)' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Fixed CTA */}
      <div
        className="fixed left-0 right-0 bottom-16 px-5 py-4 z-40"
        style={{
          background: 'var(--paper)',
          borderTop: '1px solid var(--ink-line)',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={handleAddToCart}
          className="w-full py-4 flex items-center justify-center gap-2"
          style={{
            background: added ? 'var(--ink)' : 'var(--vermilion)',
            color: 'var(--paper)',
            fontFamily: 'var(--mono)', fontSize: 11,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}
        >
          {added ? '✓ Добавлено' : `В корзину · ${fmt(bouquet.price)}`}
        </button>
      </div>
    </div>
  );
}
