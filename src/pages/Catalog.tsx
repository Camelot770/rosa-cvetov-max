import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Search, SlidersHorizontal } from 'lucide-react';
import api from '../api/client';

interface BouquetImage {
  url: string;
}

interface Bouquet {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  images: BouquetImage[];
  isHit: boolean;
  isNew: boolean;
  category: string;
}

const CATALOG_FILTERS = [
  { value: '', label: 'Все' },
  { value: 'new', label: 'Новинки' },
  { value: 'hit', label: 'Хиты продаж' },
  { value: '0-2000', label: 'до 2 000 ₽' },
  { value: '2000-4000', label: '2 000 – 4 000 ₽' },
  { value: '4000-6000', label: '4 000 – 6 000 ₽' },
  { value: '6000-99999', label: 'от 6 000 ₽' },
];

const SORT_OPTIONS = [
  { value: '', label: 'По умолчанию' },
  { value: 'price_asc', label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
  { value: 'new', label: 'Новинки' },
];

import { imageUrl } from '../utils/image';

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || '');
  const [sort, setSort] = useState('');
  const [showSort, setShowSort] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Load favorites from server
  useEffect(() => {
    api.get('/favorites').then(({ data }) => {
      const ids = data.map((f: any) => f.bouquetId);
      setFavorites(new Set(ids));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const filterFromUrl = searchParams.get('filter') || '';
    if (filterFromUrl !== activeFilter) {
      setActiveFilter(filterFromUrl);
    }
  }, [searchParams]);

  // Debounce search
  useEffect(() => {
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  useEffect(() => {
    fetchBouquets();
  }, [activeFilter, debouncedSearch, sort]);

  const fetchBouquets = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeFilter === 'new') {
        params.isNew = 'true';
      } else if (activeFilter === 'hit') {
        params.isHit = 'true';
      } else if (activeFilter) {
        const [min, max] = activeFilter.split('-');
        if (min) params.priceMin = min;
        if (max) params.priceMax = max;
      }
      if (debouncedSearch) params.search = debouncedSearch;
      if (sort) params.sort = sort;

      const { data } = await api.get<Bouquet[]>('/bouquets', { params });
      setBouquets(data);
    } catch (err) {
      console.error('Failed to fetch bouquets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (filter) {
      setSearchParams({ filter });
    } else {
      setSearchParams({});
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      if (favorites.has(id)) {
        await api.delete(`/favorites/${id}`);
        setFavorites((prev) => { const next = new Set(prev); next.delete(id); return next; });
      } else {
        await api.post(`/favorites/${id}`);
        setFavorites((prev) => { const next = new Set(prev); next.add(id); return next; });
      }
    } catch {}
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const getImageUrl = (bouquet: Bouquet): string | null => {
    if (bouquet.images && bouquet.images.length > 0 && bouquet.images[0].url) {
      return imageUrl(bouquet.images[0].url);
    }
    return null;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU');
  };

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск букетов..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={() => setShowSort(!showSort)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Sort dropdown */}
      {showSort && (
        <div className="mb-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSort(option.value);
                setShowSort(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                sort === option.value
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Catalog filter pills */}
      <div className="flex gap-2 overflow-x-auto mb-4 -mx-4 px-4 scrollbar-hide">
        {CATALOG_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === f.value
                ? 'bg-primary text-white'
                : 'bg-white text-gray-800 font-semibold border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : bouquets.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Search size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-base font-bold text-gray-800">Ничего не найдено</p>
          <p className="text-sm font-medium mt-1">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        /* Bouquet grid */
        <div className="grid grid-cols-2 gap-3">
          {bouquets.map((bouquet) => {
            const imageUrl = getImageUrl(bouquet);
            const isFav = favorites.has(bouquet.id);

            return (
              <div
                key={bouquet.id}
                onClick={() => navigate(`/bouquet/${bouquet.id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-square">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={bouquet.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-pink-100 flex items-center justify-center">
                      <span className="text-4xl">🌸</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {bouquet.isHit && (
                      <span className="bg-primary-dark text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        HIT
                      </span>
                    )}
                    {bouquet.isNew && (
                      <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                  </div>

                  {/* Favorite button */}
                  <button
                    onClick={(e) => toggleFavorite(e, bouquet.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-colors"
                  >
                    <Heart
                      size={16}
                      className={isFav ? 'text-primary fill-primary' : 'text-gray-400'}
                    />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mb-1.5">
                    {bouquet.name}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-gray-900">
                      {formatPrice(bouquet.price)} ₽
                    </span>
                    {bouquet.oldPrice && (
                      <span className="text-xs text-gray-500 line-through">
                        {formatPrice(bouquet.oldPrice)} ₽
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
