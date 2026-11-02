import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import api from '../api/client';
import { imageUrl } from '../utils/image';
import { useCartStore } from '../store/cart';
import { hapticSuccess } from '../utils/platform';
import { PageHead, Spinner, ErrorState, EmptyState } from '../components/ui';
import { fmt } from '../utils/format';

interface FavBouquet {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
  customOrder: boolean;
  images: { url: string }[];
}

interface FavItem {
  id: number;
  bouquetId: number;
  bouquet: FavBouquet;
}

function FavoriteRow({
  bouquet,
  index,
  onRemove,
}: {
  bouquet: FavBouquet;
  index: number;
  onRemove: () => void;
}) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const orderable = bouquet.inStock || bouquet.customOrder;
  const open = () => navigate(`/bouquet/${bouquet.id}`);

  const handleAdd = () => {
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

  return (
    <div
      className="flex gap-4 py-4 px-5"
      style={{ borderTop: index === 0 ? 'none' : '1px solid var(--ink-line)' }}
    >
      <button
        onClick={open}
        className="w-20 h-24 img-slot flex-shrink-0 overflow-hidden"
        style={{ border: '1px solid var(--ink-line)' }}
      >
        {bouquet.images[0]?.url ? (
          <img
            src={imageUrl(bouquet.images[0].url)}
            alt={bouquet.name}
            className="w-full h-full object-cover"
          />
        ) : null}
      </button>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <button onClick={open} className="text-left">
          <div className="caps" style={{ color: 'var(--taupe)' }}>
            — {String(index + 1).padStart(2, '0')}
          </div>
          <div className="disp mt-0.5" style={{ fontSize: 18, lineHeight: 1.1 }}>
            «{bouquet.name}»
          </div>
          <div className="font-mono text-sm mt-1">{fmt(bouquet.price)}</div>
        </button>
        <div className="flex items-center justify-between mt-2">
          {orderable ? (
            <button
              onClick={handleAdd}
              className="caps underline underline-offset-4"
              style={{ color: added ? 'var(--ink)' : 'var(--vermilion)' }}
            >
              {added ? '✓ Добавлено' : 'В корзину'}
            </button>
          ) : (
            <span className="caps" style={{ color: 'var(--taupe)' }}>Нет в наличии</span>
          )}
          <button
            onClick={onRemove}
            aria-label="Убрать из избранного"
            className="w-8 h-8 flex items-center justify-center"
          >
            <Heart size={14} strokeWidth={1.5} fill="var(--vermilion)" style={{ color: 'var(--vermilion)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [removeFailed, setRemoveFailed] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);
    api.get('/favorites')
      .then(({ data }) => setFavorites(data))
      // The server creates the customer on the first profile request, which may still be on its way
      .catch((err) => (err?.response?.status === 404 ? setFavorites([]) : setFailed(true)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const removeFav = async (bouquetId: number) => {
    setRemoveFailed(false);
    try {
      await api.delete(`/favorites/${bouquetId}`);
      setFavorites((prev) => prev.filter((f) => f.bouquetId !== bouquetId));
    } catch {
      setRemoveFailed(true);
    }
  };

  const head = <PageHead kicker={<>P.&nbsp;03 — Favorites</>}>Ваше <em>избранное.</em></PageHead>;

  if (loading) {
    return (
      <div className="pb-6">
        {head}
        <Spinner />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="pb-6">
        {head}
        <ErrorState title="Избранное не загрузилось." onRetry={load} />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="pb-6">
        {head}
        <EmptyState
          title={<>Пока <em>пусто.</em></>}
          message="Отмечайте понравившиеся букеты сердечком, они появятся здесь."
          actionLabel="Открыть каталог →"
          onAction={() => navigate('/catalog')}
        />
      </div>
    );
  }

  return (
    <div className="pb-6">
      {head}

      {removeFailed && (
        <p className="text-sm mx-5 mt-4 px-3 py-2" style={{ background: 'var(--vermilion)', color: 'var(--paper)' }}>
          Не удалось убрать букет из избранного. Попробуйте ещё раз.
        </p>
      )}

      <div style={{ borderBottom: '1px solid var(--ink-line)' }}>
        {favorites.map((fav, i) => (
          <FavoriteRow
            key={fav.id}
            bouquet={fav.bouquet}
            index={i}
            onRemove={() => removeFav(fav.bouquetId)}
          />
        ))}
      </div>
    </div>
  );
}
