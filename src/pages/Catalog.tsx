import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import api from '../api/client';
import { imageUrl } from '../utils/image';

interface BouquetImage { url: string; }
interface Bouquet {
  id: number; name: string; price: number; oldPrice?: number;
  images: BouquetImage[]; isHit: boolean; isNew: boolean; category: string;
}

const FILTERS = [
  { value: '',           label: 'Все' },
  { value: 'new',        label: 'Новое' },
  { value: 'hit',        label: 'Хиты' },
  { value: '0-2000',     label: 'до 2 000' },
  { value: '2000-4000',  label: '2 — 4 т' },
  { value: '4000-6000',  label: '4 — 6 т' },
  { value: '6000-99999', label: 'от 6 т' },
];

const SORT_OPTIONS = [
  { value: '',           label: 'По умолчанию' },
  { value: 'price_asc',  label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
  { value: 'new',        label: 'Новинки' },
];

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || '');
  const [sort, setSort] = useState('');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    api.get('/favorites')
      .then(({ data }) => setFavorites(new Set(data.map((f: any) => f.bouquetId))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const f = searchParams.get('filter') || '';
    if (f !== activeFilter) setActiveFilter(f);
  }, [searchParams]);

  useEffect(() => {
    searchTimeout.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  useEffect(() => {
    fetchBouquets();
  }, [activeFilter, debouncedSearch, sort]);

  const fetchBouquets = async () => {
    setLoading(true);
    const params: any = {};
    if (activeFilter === 'new') params.isNew = true;
    else if (activeFilter === 'hit') params.isHit = true;
    else if (activeFilter.includes('-')) {
      const [min, max] = activeFilter.split('-').map(Number);
      params.minPrice = min; params.maxPrice = max;
    }
    if (debouncedSearch) params.search = debouncedSearch;
    if (sort) params.sort = sort;

    try {
      const { data } = await api.get('/bouquets', { params });
      setBouquets(data || []);
    } catch (e) { setBouquets([]); }
    finally { setLoading(false); }
  };

  const toggleFav = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const next = new Set(favorites);
    const wasFav = favorites.has(id);
    next.has(id) ? next.delete(id) : next.add(id);
    setFavorites(next);
    try {
      wasFav ? await api.delete(`/favorites/${id}`) : await api.post(`/favorites/${id}`);
    } catch {
      // revert
      const rev = new Set(favorites);
      setFavorites(rev);
    }
  };

  const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';

  return (
    <div className="pb-6">
      {/* Head */}
      <div className="px-5 pt-4 pb-5" style={{ borderBottom: '1px solid var(--ink-line)' }}>
        <div className="caps mb-2" style={{ color: 'var(--vermilion)' }}>P.&nbsp;02 — Catalog</div>
        <h1 className="disp text-4xl">
          {activeFilter === 'new' ? <>Новое в <em>студии.</em></>
            : activeFilter === 'hit' ? <>Хиты <em>сезона.</em></>
            : activeFilter ? <>Коллекция</>
            : <>Каталог <em>букетов.</em></>}
        </h1>
      </div>

      {/* Search */}
      <div className="px-5 pt-4">
        <div className="relative">
          <Search size={16} strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--taupe)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск букета…"
            className="w-full pl-10 pr-3 py-3"
            style={{
              background: 'var(--paper-2)',
              border: '1px solid var(--ink-line)',
              fontFamily: 'var(--body)',
              fontSize: 14,
              outline: 'none',
              color: 'var(--ink)',
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="pt-3 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-5">
          {FILTERS.map((f) => {
            const active = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  if (f.value) next.set('filter', f.value); else next.delete('filter');
                  setSearchParams(next);
                  setActiveFilter(f.value);
                }}
                className="flex-shrink-0 px-3 py-1.5 caps"
                style={{
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--paper)' : 'var(--ink)',
                  border: `1px solid ${active ? 'var(--ink)' : 'var(--ink-line)'}`,
                  fontSize: 10,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--ink-line)' }}>
        <span className="caps" style={{ color: 'var(--taupe)' }}>
          {loading ? 'Загрузка…' : `${bouquets.length} шт`}
        </span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="caps bg-transparent"
          style={{ color: 'var(--ink)', border: 'none', fontSize: 10 }}
        >
          {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 px-5 pt-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full">
              <div className="w-full img-slot border border-ink-line" style={{ aspectRatio: '4 / 5' }} />
              <div className="h-3 bg-paper-2 mt-3 w-16" />
              <div className="h-5 bg-paper-2 mt-1 w-24" />
            </div>
          ))}
        </div>
      ) : bouquets.length === 0 ? (
        <div className="text-center py-16 px-5">
          <div className="caps mb-3" style={{ color: 'var(--taupe)' }}>✦ Пусто</div>
          <h2 className="disp text-2xl">Ничего не найдено.</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--ink-soft)' }}>
            Попробуйте изменить фильтр или поисковый запрос.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-5 pt-5">
          {bouquets.map((b, i) => (
            <button
              key={b.id}
              onClick={() => navigate(`/bouquet/${b.id}`)}
              className="w-full text-left"
            >
              <div className="relative w-full img-slot border border-ink-line overflow-hidden"
                style={{ aspectRatio: '4 / 5' }}>
                {b.images?.[0]?.url && (
                  <img src={imageUrl(b.images[0].url)} alt={b.name}
                    className="w-full h-full object-cover" />
                )}
                {b.isHit && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5"
                    style={{ background: 'var(--vermilion)', color: 'var(--paper)',
                      fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.2em' }}>
                    HIT
                  </span>
                )}
                {b.isNew && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5"
                    style={{ background: 'var(--ink)', color: 'var(--paper)',
                      fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.2em' }}>
                    NEW
                  </span>
                )}
                <button
                  onClick={(e) => toggleFav(e, b.id)}
                  className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center"
                  style={{ background: 'var(--paper)', border: '1px solid var(--ink-line)' }}
                >
                  <Heart size={14} strokeWidth={1.5}
                    fill={favorites.has(b.id) ? 'var(--vermilion)' : 'none'}
                    style={{ color: favorites.has(b.id) ? 'var(--vermilion)' : 'var(--ink)' }} />
                </button>
              </div>
              <div className="pt-3">
                <div className="caps" style={{ color: 'var(--taupe)' }}>
                  — {String(i + 1).padStart(2, '0')}
                </div>
                <div className="disp mt-0.5" style={{ fontSize: 18 }}>«{b.name}»</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-sm" style={{ color: 'var(--ink)' }}>
                    {fmt(b.price)}
                  </span>
                  {b.oldPrice && b.oldPrice > b.price && (
                    <span className="font-mono text-xs line-through" style={{ color: 'var(--taupe)' }}>
                      {fmt(b.oldPrice)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
