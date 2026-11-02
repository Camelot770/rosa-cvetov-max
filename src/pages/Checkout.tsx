import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCartStore } from '../store/cart';
import { useUserStore } from '../store/user';
import { useSettings, DEFAULT_ADDRESS } from '../hooks/useSettings';
import { useKeyboardOpen } from '../hooks/useKeyboardOpen';
import { CartNotices, ctaStyle } from '../components/ui';
import { fmt, apiErrorMessage } from '../utils/format';
import { openLink, hapticSuccess } from '../utils/platform';
import {
  createPaymentLink,
  PAYMENT_ERROR_FALLBACK,
  SLOW_REQUEST_TIMEOUT,
  type PlacedOrderState,
} from '../utils/payment';

// Outside Checkout on purpose: a component declared during render remounts its inputs and closes the keyboard.
function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-6 pb-2">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="caps flex-shrink-0" style={{ color: 'var(--vermilion)' }}>
          — {num}
        </span>
        <h3 className="disp" style={{ fontSize: 22 }}>
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

const inpBase: React.CSSProperties = {
  background: 'var(--paper-2)',
  border: '1px solid var(--ink-line)',
  fontFamily: 'var(--body)',
  fontSize: 14,
  color: 'var(--ink)',
  outline: 'none',
  width: '100%',
  padding: '12px 14px',
};
const chipBase = (active: boolean, disabled = false): React.CSSProperties => ({
  background: active ? 'var(--ink)' : 'transparent',
  color: active ? 'var(--paper)' : 'var(--ink)',
  border: `1px solid ${active ? 'var(--ink)' : 'var(--ink-line)'}`,
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  padding: '10px 14px',
  textAlign: 'center',
  opacity: disabled ? 0.35 : 1,
  textDecoration: disabled ? 'line-through' : 'none',
});

const TIME_SLOTS = [
  { label: '9:00 — 12:00', end: 12 * 60 },
  { label: '12:00 — 15:00', end: 15 * 60 },
  { label: '15:00 — 18:00', end: 18 * 60 },
  { label: '18:00 — 21:00', end: 21 * 60 },
];

// A slot can still be chosen for today while this much of it is left
const SLOT_LEAD_MINUTES = 60;

const EMPTY_ADDRESS = { street: '', house: '', apartment: '', entrance: '', floor: '' };

// The server checks the code again; this only shows the discount before ordering
const PROMO_CODE = 'VISITKA10';
const PROMO_SHARE = 0.1;

// Today and the time at the studio in Kazan, not UTC and not the customer's device zone
function studioNow(): { date: string; minutes: number } {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const part = (type: string) => parts.find((p) => p.type === type)?.value || '';
    return {
      date: `${part('year')}-${part('month')}-${part('day')}`,
      minutes: Number(part('hour')) * 60 + Number(part('minute')),
    };
  } catch {
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      minutes: now.getHours() * 60 + now.getMinutes(),
    };
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart, syncItems } = useCartStore();
  const user = useUserStore((s) => s.user);
  const settings = useSettings();
  const keyboardOpen = useKeyboardOpen();

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [comment, setComment] = useState('');
  const [cardText, setCardText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [bonusUsed, setBonusUsed] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoTouched, setPromoTouched] = useState(false);
  const [addressChoice, setAddressChoice] = useState<number | 'new' | null>(null);
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const [privateHouse, setPrivateHouse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const orderSubmitted = useRef(false);

  const savedAddresses: any[] = user?.addresses || [];

  useEffect(() => {
    syncItems();
  }, []);

  useEffect(() => {
    setAddressChoice((current) => {
      if (current === 'new' || savedAddresses.some((a) => a.id === current)) return current;
      if (savedAddresses.length === 0) return null;
      return (savedAddresses.find((a) => a.isDefault) || savedAddresses[0]).id;
    });
  }, [user]);

  // Nobody has a saved address yet: the form is shown right away
  const choice = addressChoice ?? 'new';

  const deliveryPrice   = parseInt(settings.delivery_price || '500');
  const freeFrom        = parseInt(settings.free_delivery_from || '5000');
  const maxBonusPercent = parseInt(settings.max_bonus_discount || '20');
  const minOrder        = parseInt(settings.min_order || '0') || 0;

  // Same order of calculation as on the server: promo first, the bonus cap counts from what's left
  const subtotal      = totalPrice();
  const promoEntered  = promoCode.trim().toUpperCase() === PROMO_CODE;
  const promoValid    = promoEntered && user?.promoAvailable !== false;
  const promoDiscount = promoValid ? Math.floor(subtotal * PROMO_SHARE) : 0;
  const discounted    = subtotal - promoDiscount;
  const deliveryCost  = deliveryType === 'delivery' && subtotal < freeFrom ? deliveryPrice : 0;
  const maxBonus      = Math.max(0, Math.min(
    user?.bonusPoints || 0,
    Math.floor(discounted * maxBonusPercent / 100),
    discounted - 1,
  ));
  const bonusApplied  = Math.min(bonusUsed, maxBonus);
  const finalPrice    = discounted + deliveryCost - bonusApplied;

  const now = studioNow();
  const isSlotOpen = (end: number) => deliveryDate !== now.date || now.minutes + SLOT_LEAD_MINUTES <= end;
  const noSlotsToday = deliveryDate === now.date && !TIME_SLOTS.some((slot) => isSlotOpen(slot.end));

  useEffect(() => {
    const slot = TIME_SLOTS.find((s) => s.label === deliveryTime);
    if (slot && !isSlotOpen(slot.end)) setDeliveryTime('');
  }, [deliveryDate]);

  // The message is about the form as it was on submit
  useEffect(() => {
    setValidationError('');
  }, [deliveryType, choice, newAddress, privateHouse, deliveryDate, deliveryTime, recipientName, recipientPhone, promoCode]);

  const setAddressField = (field: keyof typeof EMPTY_ADDRESS) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setNewAddress((current) => ({ ...current, [field]: e.target.value }));

  const findProblem = (): string => {
    const receiving = deliveryType === 'delivery' ? 'доставки' : 'самовывоза';
    if (deliveryType === 'delivery' && choice === 'new') {
      if (!newAddress.street.trim()) return 'Укажите город и улицу';
      if (!newAddress.house.trim()) return 'Укажите номер дома';
      if (!privateHouse && !newAddress.apartment.trim()) {
        return 'Укажите квартиру или отметьте «Частный дом»';
      }
    }
    if (!deliveryDate) return `Выберите дату ${receiving}`;
    if (deliveryDate < now.date) return 'Эта дата уже прошла, выберите другую';
    if (!deliveryTime) return `Выберите время ${receiving}`;
    const slot = TIME_SLOTS.find((s) => s.label === deliveryTime);
    if (!slot || !isSlotOpen(slot.end)) return 'Это время уже прошло, выберите другое';
    if (!recipientName.trim()) return 'Укажите имя получателя';
    if (recipientPhone.replace(/\D/g, '').length < 10) {
      return 'Укажите телефон получателя, минимум 10 цифр';
    }
    if (subtotal < minOrder) return `Минимальная сумма заказа ${fmt(minOrder)}`;
    return '';
  };

  const saveNewAddress = async (): Promise<number> => {
    const { data: created } = await api.post('/user/address', {
      title: 'Адрес',
      street: newAddress.street.trim(),
      house: newAddress.house.trim(),
      apartment: privateHouse ? undefined : newAddress.apartment.trim(),
      entrance: newAddress.entrance.trim() || undefined,
      floor: newAddress.floor.trim() || undefined,
      isDefault: savedAddresses.length === 0,
    });
    // A retry after a failed order must reuse this address, not create it again
    useUserStore.setState((state) => (
      state.user ? { user: { ...state.user, addresses: [...state.user.addresses, created] } } : state
    ));
    setAddressChoice(created.id);
    setNewAddress(EMPTY_ADDRESS);
    setPrivateHouse(false);
    return created.id;
  };

  const handleSubmit = async () => {
    if (items.length === 0 || submitting) return;

    const problem = findProblem();
    setValidationError(problem);
    if (problem) return;

    setSubmitting(true);
    try {
      let addressId: number | null = null;
      if (deliveryType === 'delivery') {
        addressId = choice === 'new' ? await saveNewAddress() : choice;
      }

      const { data: order } = await api.post('/orders', {
        items: items.map((i) => ({
          bouquetId: i.bouquetId, name: i.name, price: i.price, quantity: i.quantity,
        })),
        addressId,
        deliveryType, deliveryDate, deliveryTime,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        comment, bonusUsed: bonusApplied, isAnonymous, cardText,
        promoCode: promoValid ? PROMO_CODE : undefined,
      }, { timeout: SLOW_REQUEST_TIMEOUT });

      // The order exists from here on: a payment problem is shown in Orders, where it can be paid again
      const placed: PlacedOrderState = { placedOrderId: order.id };
      try {
        placed.link = await createPaymentLink(order.id);
      } catch (error) {
        console.error('Payment error:', error);
        placed.paymentError = apiErrorMessage(error, PAYMENT_ERROR_FALLBACK);
      }

      orderSubmitted.current = true;
      clearCart();
      hapticSuccess();
      useUserStore.getState().fetchProfile();
      // Messengers may ignore a link opened long after the tap, so Orders also offers an explicit button
      if (placed.link) openLink(placed.link.url);
      navigate('/orders', { replace: true, state: placed });
    } catch (error) {
      console.error('Order error:', error);
      setValidationError(apiErrorMessage(error, 'Не удалось оформить заказ. Попробуйте ещё раз.'));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (items.length === 0 && !orderSubmitted.current) navigate('/cart');
  }, [items.length, navigate]);
  if (items.length === 0 && !orderSubmitted.current) return null;

  return (
    <div className="pb-48">
      {/* Head */}
      <div className="px-5 pt-4 pb-5" style={{ borderBottom: '1px solid var(--ink-line)' }}>
        <div className="caps mb-2" style={{ color: 'var(--vermilion)' }}>P.&nbsp;06 — Checkout</div>
        <h1 className="disp text-4xl">Оформление <em>заказа.</em></h1>
      </div>

      <CartNotices />

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
          {deliveryType === 'delivery' ? (
            <>
              {savedAddresses.length > 0 && (
                <select
                  value={choice}
                  onChange={(e) => setAddressChoice(e.target.value === 'new' ? 'new' : Number(e.target.value))}
                  style={{ ...inpBase, marginTop: 12 }}
                >
                  {savedAddresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.street}, {a.house}{a.apartment ? `, кв. ${a.apartment}` : ''}
                    </option>
                  ))}
                  <option value="new">Новый адрес</option>
                </select>
              )}
              {choice === 'new' && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text" placeholder="Город и улица"
                    value={newAddress.street} onChange={setAddressField('street')}
                    style={inpBase}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text" placeholder="Дом"
                      value={newAddress.house} onChange={setAddressField('house')}
                      style={inpBase}
                    />
                    <input
                      type="text" placeholder={privateHouse ? 'Квартиры нет' : 'Квартира'}
                      value={privateHouse ? '' : newAddress.apartment} onChange={setAddressField('apartment')}
                      disabled={privateHouse}
                      style={{ ...inpBase, opacity: privateHouse ? 0.5 : 1 }}
                    />
                    <input
                      type="text" placeholder="Подъезд"
                      value={newAddress.entrance} onChange={setAddressField('entrance')}
                      style={inpBase}
                    />
                    <input
                      type="text" placeholder="Этаж"
                      value={newAddress.floor} onChange={setAddressField('floor')}
                      style={inpBase}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm pt-1" style={{ color: 'var(--ink)' }}>
                    <input
                      type="checkbox"
                      checked={privateHouse}
                      onChange={(e) => setPrivateHouse(e.target.checked)}
                      style={{ accentColor: 'var(--vermilion)', width: 18, height: 18 }}
                    />
                    Частный дом, квартиры нет
                  </label>
                </div>
              )}
              {subtotal < freeFrom && (
                <p className="caps mt-3" style={{ color: 'var(--taupe)' }}>
                  Доставка {fmt(deliveryPrice)} · бесплатно от {fmt(freeFrom)}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm mt-3" style={{ color: 'var(--ink-soft)' }}>
              📍 {settings.address || DEFAULT_ADDRESS}
            </p>
          )}
        </Section>

        <Section num="02" title="Дата и время">
          <input
            type="date"
            value={deliveryDate}
            min={now.date}
            onChange={(e) => setDeliveryDate(e.target.value)}
            style={{ ...inpBase, minHeight: 46 }}
          />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {TIME_SLOTS.map((slot) => {
              const open = isSlotOpen(slot.end);
              return (
                <button
                  key={slot.label}
                  disabled={!open}
                  onClick={() => setDeliveryTime(slot.label)}
                  style={chipBase(deliveryTime === slot.label, !open)}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
          {noSlotsToday && (
            <p className="text-sm mt-3" style={{ color: 'var(--vermilion)' }}>
              На сегодня интервалы закончились, выберите другую дату.
            </p>
          )}
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

        <Section num="06" title="Скидки">
          <input
            type="text" placeholder="Промокод (если есть)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            onBlur={() => setPromoTouched(true)}
            style={inpBase}
          />
          {promoValid ? (
            <p className="caps mt-2" style={{ color: 'var(--vermilion)' }}>
              Скидка {PROMO_SHARE * 100}% применена
            </p>
          ) : promoEntered ? (
            <p className="caps mt-2" style={{ color: 'var(--taupe)' }}>Промокод действует только на первый заказ</p>
          ) : promoTouched && promoCode.trim() ? (
            <p className="caps mt-2" style={{ color: 'var(--taupe)' }}>Такого промокода нет</p>
          ) : null}
          {maxBonus > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <input
                  type="range" min={0} max={maxBonus} value={bonusApplied}
                  onChange={(e) => setBonusUsed(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: 'var(--vermilion)' }}
                />
                <span className="font-mono text-sm w-20 text-right" style={{ color: 'var(--vermilion)' }}>
                  −{fmt(bonusApplied)}
                </span>
              </div>
              <p className="caps mt-2" style={{ color: 'var(--taupe)' }}>
                Бонусов на счёте: {user?.bonusPoints} · Максимум {maxBonusPercent}% от суммы
              </p>
            </div>
          )}
        </Section>

        {/* Summary */}
        <Section num="07" title="Итого">
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--ink-soft)' }}>Товары</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--vermilion)' }}>
                <span>Промокод</span>
                <span className="font-mono">−{fmt(promoDiscount)}</span>
              </div>
            )}
            {deliveryCost > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--ink-soft)' }}>Доставка</span>
                <span className="font-mono">{fmt(deliveryCost)}</span>
              </div>
            )}
            {bonusApplied > 0 && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--vermilion)' }}>
                <span>Бонусы</span>
                <span className="font-mono">−{fmt(bonusApplied)}</span>
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
        </Section>
      </div>

      {/* Fixed submit: gives way to the keyboard so it never covers the field being typed in */}
      {!keyboardOpen && (
        <div
          className="fixed left-0 right-0 bottom-16 px-5 py-4 z-40"
          style={{
            background: 'var(--paper)',
            borderTop: '1px solid var(--ink-line)',
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
          }}
        >
          {validationError && (
            <p className="text-sm mb-3 px-3 py-2"
              style={{ background: 'var(--vermilion)', color: 'var(--paper)' }}>
              {validationError}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 flex items-center justify-center gap-2"
            style={{
              ...ctaStyle(submitting ? 'var(--taupe)' : 'var(--vermilion)'),
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Оформляем…' : `Оплатить · ${fmt(finalPrice)}`}
          </button>
        </div>
      )}
    </div>
  );
}
