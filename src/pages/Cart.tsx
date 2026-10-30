import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { imageUrl } from '../utils/image';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();

  const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';

  if (items.length === 0) {
    return (
      <div className="pb-6">
        <div className="px-5 pt-4 pb-5" style={{ borderBottom: '1px solid var(--ink-line)' }}>
          <div className="caps mb-2" style={{ color: 'var(--vermilion)' }}>P.&nbsp;05 — Cart</div>
          <h1 className="disp text-4xl">Корзина <em>пуста.</em></h1>
        </div>
        <div className="px-5 py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Выберите букет из каталога — он останется с вами на годы.
          </p>
          <button
            onClick={() => navigate('/catalog')}
            className="mt-6 w-full py-4 flex items-center justify-center gap-2"
            style={{
              background: 'var(--ink)', color: 'var(--paper)',
              fontFamily: 'var(--mono)', fontSize: 11,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}
          >
            Открыть каталог →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Head */}
      <div className="px-5 pt-4 pb-5" style={{ borderBottom: '1px solid var(--ink-line)' }}>
        <div className="flex items-end justify-between">
          <div>
            <div className="caps mb-2" style={{ color: 'var(--vermilion)' }}>P.&nbsp;05 — Cart</div>
            <h1 className="disp text-4xl">Ваш <em>набор.</em></h1>
          </div>
          <button
            onClick={clearCart}
            className="caps underline underline-offset-4 pb-1"
            style={{ color: 'var(--vermilion)' }}
          >
            Очистить
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y" style={{ borderBottom: '1px solid var(--ink-line)' }}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex gap-4 py-4 px-5"
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--ink-line)' }}
          >
            <div
              className="w-20 h-24 img-slot flex-shrink-0 overflow-hidden"
              style={{ border: '1px solid var(--ink-line)' }}
            >
              {item.image ? (
                <img
                  src={imageUrl(item.image)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="caps" style={{ color: 'var(--taupe)' }}>
                  — {String(i + 1).padStart(2, '0')}
                </div>
                <div className="disp mt-0.5" style={{ fontSize: 18, lineHeight: 1.1 }}>
                  «{item.name}»
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div
                  className="flex items-center"
                  style={{ border: '1px solid var(--ink-line)' }}
                >
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <Minus size={12} strokeWidth={1.5} />
                  </button>
                  <span
                    className="w-8 h-8 flex items-center justify-center font-mono"
                    style={{ fontSize: 13 }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <Plus size={12} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">
                    {fmt(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{ color: 'var(--taupe)' }}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total + CTA */}
      <div
        className="fixed left-0 right-0 bottom-16 px-5 py-4 z-40"
        style={{
          background: 'var(--paper)',
          borderTop: '1px solid var(--ink-line)',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <span className="caps" style={{ color: 'var(--taupe)' }}>Итого</span>
          <span className="disp" style={{ fontSize: 24 }}>{fmt(totalPrice())}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full py-4 flex items-center justify-center gap-2"
          style={{
            background: 'var(--vermilion)', color: 'var(--paper)',
            fontFamily: 'var(--mono)', fontSize: 11,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}
        >
          Оформить заказ →
        </button>
      </div>
    </div>
  );
}
