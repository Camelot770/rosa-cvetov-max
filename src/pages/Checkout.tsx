import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCartStore } from '../store/cart';
import { useUserStore } from '../store/user';
import { openLink, hapticSuccess } from '../utils/platform';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
  const user = useUserStore((s) => s.user);

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [comment, setComment] = useState('');
  const [cardText, setCardText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [bonusUsed, setBonusUsed] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const orderSubmitted = useRef(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSettings(data)).catch(() => {});
    if (user?.addresses?.length) {
      const def = user.addresses.find((a: any) => a.isDefault) || user.addresses[0];
      setSelectedAddress(def.id);
    }
  }, [user]);

  const deliveryPrice   = parseInt(settings.delivery_price || '500');
  const freeFrom        = parseInt(settings.free_delivery_from || '5000');
  const maxBonusPercent = parseInt(settings.max_bonus_discount || '20');

  const subtotal     = totalPrice();
  const deliveryCost = deliveryType === 'delivery' && subtotal < freeFrom ? deliveryPrice : 0;
  const maxBonus     = Math.min(user?.bonusPoints || 0, Math.floor(subtotal * maxBonusPercent / 100));
  const finalPrice   = subtotal + deliveryCost - bonusUsed;

  const timeSlots = ['9:00 — 12:00', '12:00 — 15:00', '15:00 — 18:00', '18:00 — 21:00'];
  const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setValidationError('');

    if (!recipientPhone.trim()) return setValidationError('Укажите телефон получателя');
    if (!deliveryDate)          return setValidationError('Выберите дату доставки');
    if (!deliveryTime)          return setValidationError('Выберите время доставки');
    if (deliveryType === 'delivery' && !selectedAddress && user?.addresses?.length) {
      return setValidationError('Выберите адрес доставки');
    }

    setSubmitting(true);
    try {
      const orderData = {
        items: items.map((i) => ({
          bouquetId: i.bouquetId || null, name: i.name, price: i.price, quantity: i.quantity,
        })),
        addressId: deliveryType === 'delivery' ? selectedAddress : null,
        deliveryType, deliveryDate, deliveryTime, recipientName, recipientPhone,
        comment, bonusUsed, isAnonymous, cardText,
      };
      const { data: order } = await api.post('/orders', orderData);
      try {
        const { data: payment } = await api.post('/payment/create', {
          orderId: order.id, returnUrl: `${window.location.origin}/orders`,
        });
        if (payment.confirmationUrl) {
          orderSubmitted.current = true;
          clearCart();
          openLink(payment.confirmationUrl);
          navigate('/orders');
          return;
        }
      } catch {
        // Payment недоступна — заказ всё равно создан
      }
      orderSubmitted.current = true;
      clearCart();
      hapticSuccess();
      navigate('/orders');
    } catch (error) {
      console.error('Order error:', error);
      setValidationError('Ошибка при создании заказа. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (items.length === 0 && !orderSubmitted.current) navigate('/cart');
  }, [items.length, navigate]);
  if (items.length === 0 && !orderSubmitted.current) return null;

  const Section = ({ num, title, children }: { num: string; title: string; children: React.ReactNode }) => (
    <section className="pt-6 pb-2">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="caps flex-shrink-0" style={{ color: 'var(--vermilion)' }}>— {num}</span>
        <h3 className="disp" style={{ fontSize: 22 }}>{title}</h3>
      </div>
      {children}
    </section>
  );

  const inpBase: React.CSSProperties = {
    background: 'var(--paper-2)', border: '1px solid var(--ink-line)',
    fontFamily: 'var(--body)', fontSize: 14, color: 'var(--ink)',
    outline: 'none', width: '100%', padding: '12px 14px',
  };
  const chipBase = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--ink)' : 'transparent',
    color: active ? 'var(--paper)' : 'var(--ink)',
    border: `1px solid ${active ? 'var(--ink)' : 'var(--ink-line)'}`,
    fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
    textTransform: 'uppercase', padding: '10px 14px', textAlign: 'center',
  });

  return (
    <div className="pb-40">
      {/* Head */}
      <div className="px-5 pt-4 pb-5" style={{ borderBottom: '1px solid var(--ink-line)' }}>
        <div className="caps mb-2" style={{ color: 'var(--vermilion)' }}>P.&nbsp;06 — Checkout</div>
        <h1 className="disp text-4xl">Оформление <em>заказа.</em></h1>
      </div>

      <div className="px-5">
        <Section num="01" title="Способ получения">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setDeliveryType('delivery')} style={chipBase(deliveryType === 'delivery')}>
              Доставка
            </button>
            <button onClick={() => setDeliveryType('pickup')} style={chipBase(deliveryType === 'pickup')}>
              Самовывоз
            </button>
          </div>
          {deliveryType === 'delivery' && user?.addresses?.length ? (
            <select
              value={selectedAddress || ''}
              onChange={(e) => setSelectedAddress(Number(e.target.value))}
              style={{ ...inpBase, marginTop: 12 }}
            >
              {user.addresses.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.title}: {a.street}, {a.house}{a.apartment ? `, кв. ${a.apartment}` : ''}
                </option>
              ))}
            </select>
          ) : deliveryType === 'delivery' ? (
            <p className="text-sm mt-3" style={{ color: 'var(--ink-soft)' }}>
              Адрес уточним в комментарии или звонком.
            </p>
          ) : (
            <p className="text-sm mt-3" style={{ color: 'var(--ink-soft)' }}>
              📍 {settings.address || 'д. Званка, ул. Приозёрная, 58'}
            </p>
          )}
          {deliveryType === 'delivery' && subtotal < freeFrom && (
            <p className="caps mt-3" style={{ color: 'var(--taupe)' }}>
              Доставка {fmt(deliveryPrice)} · бесплатно от {fmt(freeFrom)}
            </p>
          )}
        </Section>

        <Section num="02" title="Дата и время">
          <input
            type="date"
            value={deliveryDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDeliveryDate(e.target.value)}
            style={inpBase}
          />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {timeSlots.map((slot) => (
              <button key={slot} onClick={() => setDeliveryTime(slot)} style={chipBase(deliveryTime === slot)}>
                {slot}
              </button>
            ))}
          </div>
        </Section>

        <Section num="03" title="Получатель">
          <input
            type="text" placeholder="Имя получателя"
            value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
            style={inpBase}
          />
          <input
            type="tel" placeholder="Телефон +7…"
            value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)}
            style={{ ...inpBase, marginTop: 10 }}
          />
          <label className="flex items-center gap-2 text-sm mt-3" style={{ color: 'var(--ink)' }}>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ accentColor: 'var(--vermilion)', width: 18, height: 18 }}
            />
            Анонимная доставка
          </label>
        </Section>

        <Section num="04" title="Открытка">
          <textarea
            placeholder="Напишите пару слов — вложим в букет (необязательно)"
            value={cardText} onChange={(e) => setCardText(e.target.value)}
            style={{ ...inpBase, height: 80, resize: 'none' }}
          />
        </Section>

        <Section num="05" title="Комментарий">
          <textarea
            placeholder="Этаж, домофон, пожелания флористу…"
            value={comment} onChange={(e) => setComment(e.target.value)}
            style={{ ...inpBase, height: 70, resize: 'none' }}
          />
        </Section>

        {user && user.bonusPoints > 0 && (
          <Section num="06" title={`Бонусы — ${user.bonusPoints} баллов`}>
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={maxBonus} value={bonusUsed}
                onChange={(e) => setBonusUsed(Number(e.target.value))}
                className="flex-1"
                style={{ accentColor: 'var(--vermilion)' }}
              />
              <span className="font-mono text-sm w-16 text-right" style={{ color: 'var(--vermilion)' }}>
                −{fmt(bonusUsed)}
              </span>
            </div>
            <p className="caps mt-2" style={{ color: 'var(--taupe)' }}>
              Максимум {maxBonusPercent}% от суммы заказа
            </p>
          </Section>
        )}

        {/* Summary */}
        <Section num="07" title="Итого">
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--ink-soft)' }}>Товары</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>
            {deliveryCost > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--ink-soft)' }}>Доставка</span>
                <span className="font-mono">{fmt(deliveryCost)}</span>
              </div>
            )}
            {bonusUsed > 0 && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--vermilion)' }}>
                <span>Бонусы</span>
                <span className="font-mono">−{fmt(bonusUsed)}</span>
              </div>
            )}
            <div
              className="pt-3 flex justify-between items-baseline"
              style={{ borderTop: '1px solid var(--ink-line)' }}
            >
              <span className="caps" style={{ color: 'var(--ink)' }}>К оплате</span>
              <span className="disp" style={{ fontSize: 26 }}>{fmt(finalPrice)}</span>
            </div>
          </div>
          {validationError && (
            <p className="text-sm mt-3 px-3 py-2"
              style={{ background: 'var(--vermilion)', color: 'var(--paper)' }}>
              {validationError}
            </p>
          )}
        </Section>
      </div>

      {/* Fixed submit */}
      <div
        className="fixed left-0 right-0 bottom-16 px-5 py-4 z-40"
        style={{
          background: 'var(--paper)',
          borderTop: '1px solid var(--ink-line)',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 flex items-center justify-center gap-2"
          style={{
            background: submitting ? 'var(--taupe)' : 'var(--vermilion)',
            color: 'var(--paper)', fontFamily: 'var(--mono)', fontSize: 11,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Отправка…' : `Оплатить · ${fmt(finalPrice)}`}
        </button>
      </div>
    </div>
  );
}
