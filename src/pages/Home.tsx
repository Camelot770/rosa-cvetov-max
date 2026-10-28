import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, MapPin, Clock } from 'lucide-react';
import api from '../api/client';
import { imageUrl } from '../utils/image';

interface Bouquet {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  images: { url: string }[];
  isHit: boolean;
  isNew: boolean;
  category: string;
}

const CATEGORIES = [
  { label: 'Все букеты',   value: 'all',        meta: 'Полная витрина' },
  { label: 'Хиты',          value: 'hit',        meta: 'Что берут чаще' },
  { label: 'Новинки',       value: 'new',        meta: 'Свежее в студии' },
  { label: 'до 2 000 ₽',    value: '0-2000',     meta: 'Для подарка «просто так»' },
  { label: '2 000 — 4 000 ₽', value: '2000-4000', meta: 'Повод и настроение' },
  { label: 'от 4 000 ₽',    value: '4000-99999', meta: 'Большие композиции' },
];

export default function Home() {
  const navigate = useNavigate();
  const [hits, setHits] = useState<Bouquet[]>([]);
  const [newArrivals, setNewArrivals] = useState<Bouquet[]>([]);
  const [featured, setFeatured] = useState<Bouquet | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loadingHits, setLoadingHits] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);

  useEffect(() => {
    api.get('/bouquets').then((res) => {
      const list: Bouquet[] = res.data || [];
      setTotalCount(list.length);
      // Featured = наиболее дорогой букет = «обложечный»
      const sorted = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
      setFeatured(sorted[0] || null);
    }).catch(() => {});

    api.get('/bouquets', { params: { isHit: true } })
      .then((res) => setHits(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingHits(false));

    api.get('/bouquets', { params: { isNew: true } })
      .then((res) => setNewArrivals(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingNew(false));
  }, []);

  const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';

  const now = new Date();
  const month = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][now.getMonth()];
  const year = now.getFullYear();

  const CoverCard = ({ b }: { b: Bouquet }) => (
    <button
      onClick={() => navigate(`/bouquet/${b.id}`)}
      className="relative w-full text-left overflow-hidden border border-ink-line img-slot"
      style={{ aspectRatio: '4 / 5' }}
    >
      {b.images?.[0]?.url ? (
        <img
          src={imageUrl(b.images[0].url)}
          alt={b.name}
          className="w-full h-full object-cover"
        />
      ) : null}
      <div
        className="absolute top-3 left-3 px-2 py-1"
        style={{ background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase' }}
      >
        Plate · I
      </div>
    </button>
  );

  const MiniCard = ({ b }: { b: Bouquet }) => (
    <button
      key={b.id}
      onClick={() => navigate(`/bouquet/${b.id}`)}
      className="flex-shrink-0 w-40 text-left"
    >
      <div
        className="relative w-full border border-ink-line img-slot overflow-hidden"
        style={{ aspectRatio: '4 / 5' }}
      >
        {b.images?.[0]?.url && (
          <img src={imageUrl(b.images[0].url)} alt={b.name} className="w-full h-full object-cover" />
        )}
        {b.isHit && (
          <span
            className="absolute top-2 left-2 px-1.5 py-0.5"
            style={{ background: 'var(--vermilion)', color: 'var(--paper)', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.2em' }}
          >
            HIT
          </span>
        )}
        {b.isNew && (
          <span
            className="absolute top-2 right-2 px-1.5 py-0.5"
            style={{ background: 'var(--ink)', color: 'var(--paper)', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.2em' }}
          >
            NEW
          </span>
        )}
      </div>
      <div className="pt-3">
        <div className="caps" style={{ color: 'var(--taupe)' }}>— {String(b.id).padStart(2, '0')}</div>
        <div className="disp" style={{ fontSize: 22, marginTop: 2 }}>«{b.name}»</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-sm" style={{ color: 'var(--ink)' }}>{fmt(b.price)}</span>
          {b.oldPrice && b.oldPrice > b.price && (
            <span className="font-mono text-xs line-through" style={{ color: 'var(--taupe)' }}>{fmt(b.oldPrice)}</span>
          )}
        </div>
      </div>
    </button>
  );

  const SkeletonMini = () => (
    <div className="flex-shrink-0 w-40">
      <div className="w-full img-slot border border-ink-line" style={{ aspectRatio: '4 / 5' }} />
      <div className="h-3 bg-paper-2 mt-3 w-20" />
      <div className="h-5 bg-paper-2 mt-1 w-28" />
    </div>
  );

  return (
    <div className="pb-6">
      {/* Masthead-strip */}
      <div className="px-5 pt-3 flex items-center justify-between caps" style={{ color: 'var(--taupe)' }}>
        <span><span style={{ color: 'var(--vermilion)' }}>✦</span> Issue №01 · {month} {year}</span>
        <span>Atelier · Казань</span>
      </div>

      {/* Brand title */}
      <div className="px-5 pt-3 pb-5" style={{ borderBottom: '1px solid var(--ink-line)' }}>
        <div className="font-display text-3xl leading-none">
          <em style={{ color: 'var(--vermilion)', fontStyle: 'italic' }}>Роза</em>&nbsp;Цветов
        </div>
        <div className="caps mt-1" style={{ color: 'var(--taupe)' }}>
          Стабилизированная флористика · {totalCount ?? '—'} букетов
        </div>
      </div>

      {/* Cover block */}
      <section className="px-5 pt-6">
        <div className="caps mb-3" style={{ color: 'var(--vermilion)' }}>✦ Cover</div>
        <h1 className="disp" style={{ fontSize: 'clamp(44px, 12vw, 72px)' }}>
          Живые <em>цветы,</em>
          <br />
          которые
          <br />
          не&nbsp;вянут.
        </h1>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          Настоящие срезанные цветы, прошедшие глубокую стабилизацию натуральными
          растительными соками. Сохраняют форму, цвет и мягкость — до пяти лет
          без воды и ухода.
        </p>
        {featured && (
          <div className="mt-5">
            <CoverCard b={featured} />
            <div
              className="pt-3 flex items-baseline justify-between font-mono"
              style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-soft)' }}
            >
              <span><strong style={{ color: 'var(--ink)' }}>Pl.&nbsp;I</strong> · «{featured.name}»</span>
              <span><strong style={{ color: 'var(--ink)' }}>{fmt(featured.price)}</strong></span>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate('/catalog')}
          className="mt-5 w-full py-4 flex items-center justify-center gap-2"
          style={{
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          Открыть каталог <ArrowRight size={14} strokeWidth={1.5} />
        </button>
      </section>

      <div className="rail mx-5 my-8" />

      {/* Index — table of contents */}
      <section className="px-5">
        <div className="caps mb-4" style={{ color: 'var(--vermilion)' }}>P.&nbsp;02 — Index</div>
        <h2 className="disp text-3xl mb-5">Содержание <em>номера.</em></h2>
        <ul className="divide-y" style={{ borderTop: '1px solid var(--ink-line)', borderBottom: '1px solid var(--ink-line)' }}>
          {CATEGORIES.map((c, i) => (
            <li key={c.value}>
              <button
                onClick={() =>
                  navigate(c.value === 'all' ? '/catalog' : `/catalog?filter=${c.value}`)
                }
                className="w-full flex items-baseline gap-3 py-4 text-left"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--ink-line)' }}
              >
                <span
                  className="font-mono flex-shrink-0 w-9"
                  style={{ fontSize: 11, color: 'var(--taupe)', letterSpacing: '0.1em' }}
                >
                  — {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">
                  <span className="font-display block" style={{ fontSize: 20, lineHeight: 1.1 }}>
                    {c.label}
                  </span>
                  <span className="caps block mt-1" style={{ color: 'var(--taupe)' }}>{c.meta}</span>
                </span>
                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                  style={{ color: 'var(--vermilion)' }}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="rail mx-5 my-8" />

      {/* Hits */}
      {(loadingHits || hits.length > 0) && (
        <section>
          <div className="px-5 flex items-baseline justify-between mb-3">
            <div>
              <div className="caps" style={{ color: 'var(--vermilion)' }}>P.&nbsp;04 — Hits</div>
              <h2 className="disp text-2xl mt-1">Хиты <em>сезона.</em></h2>
            </div>
            <button
              onClick={() => navigate('/catalog?filter=hit')}
              className="caps underline underline-offset-4"
              style={{ color: 'var(--ink)' }}
            >
              Все →
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {loadingHits
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonMini key={i} />)
              : hits.map((b) => <MiniCard key={b.id} b={b} />)}
          </div>
        </section>
      )}

      {(loadingNew || newArrivals.length > 0) && (
        <section className="mt-8">
          <div className="px-5 flex items-baseline justify-between mb-3">
            <div>
              <div className="caps" style={{ color: 'var(--vermilion)' }}>P.&nbsp;06 — New</div>
              <h2 className="disp text-2xl mt-1">Новое в <em>студии.</em></h2>
            </div>
            <button
              onClick={() => navigate('/catalog?filter=new')}
              className="caps underline underline-offset-4"
              style={{ color: 'var(--ink)' }}
            >
              Все →
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {loadingNew
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonMini key={i} />)
              : newArrivals.map((b) => <MiniCard key={b.id} b={b} />)}
          </div>
        </section>
      )}

      <div className="rail mx-5 my-8" />

      {/* Contact / masthead-foot */}
      <section className="px-5">
        <div className="caps mb-3" style={{ color: 'var(--vermilion)' }}>P.&nbsp;08 — Contact</div>
        <h2 className="disp text-3xl mb-4">Студия <em>рядом.</em></h2>
        <div className="space-y-3">
          <a
            href="tel:+79600483996"
            className="flex items-center gap-3 py-3 border-b"
            style={{ borderColor: 'var(--ink-line)' }}
          >
            <Phone size={16} strokeWidth={1.5} style={{ color: 'var(--vermilion)' }} />
            <div className="flex-1">
              <div className="font-mono text-sm">+7 960 048-39-96</div>
              <div className="caps mt-1" style={{ color: 'var(--taupe)' }}>Звоните и заказывайте</div>
            </div>
          </a>
          <div
            className="flex items-center gap-3 py-3 border-b"
            style={{ borderColor: 'var(--ink-line)' }}
          >
            <MapPin size={16} strokeWidth={1.5} style={{ color: 'var(--vermilion)' }} />
            <div className="flex-1">
              <div className="text-sm">д. Званка, ул. Приозёрная, 58</div>
              <div className="caps mt-1" style={{ color: 'var(--taupe)' }}>Казань · Татарстан</div>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3">
            <Clock size={16} strokeWidth={1.5} style={{ color: 'var(--vermilion)' }} />
            <div className="flex-1">
              <div className="text-sm">Ежедневно · 09:00 – 21:00</div>
              <div className="caps mt-1" style={{ color: 'var(--taupe)' }}>Без выходных</div>
            </div>
          </div>
        </div>
      </section>

      {/* Colophon */}
      <div
        className="px-5 pt-10 pb-4 caps text-center"
        style={{ color: 'var(--taupe)' }}
      >
        ✦ Set in DM Serif Display &amp; DM Sans · Issue №01 · {year}
      </div>
    </div>
  );
}
