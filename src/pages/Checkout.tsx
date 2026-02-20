import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, CreditCard, Gift, MessageSquare } from 'lucide-react';
import api from '../api/client';
import { useCartStore } from '../store/cart';
import { useUserStore } from '../store/user';
import { hapticSuccess } from '../utils/platform';

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

  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSettings(data)).catch(() => {});
    if (user?.addresses?.length) {
      const def = user.addresses.find((a: any) => a.isDefault) || user.addresses[0];
      setSelectedAddress(def.id);
    }
  }, [user]);

  const deliveryPrice = parseInt(settings.delivery_price || '500');
  const freeFrom = parseInt(settings.free_delivery_from || '5000');
  const maxBonusPercent = parseInt(settings.max_bonus_discount || '20');

  const subtotal = totalPrice();
  const deliveryCost = deliveryType === 'delivery' && subtotal < freeFrom ? deliveryPrice : 0;
  const maxBonus = Math.min(user?.bonusPoints || 0, Math.floor(subtotal * maxBonusPercent / 100));
  const finalPrice = subtotal + deliveryCost - bonusUsed;

  const timeSlots = [
    '9:00–12:00', '12:00–15:00', '15:00–18:00', '18:00–21:00',
  ];

  const [validationError, setValidationError] = useState('');

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setValidationError('');

    // Validation
    if (!recipientPhone.trim()) {
      setValidationError('Укажите телефон получателя');
      return;
    }
    if (!deliveryDate) {
      setValidationError('Выберите дату доставки');
      return;
    }
    if (!deliveryTime) {
      setValidationError('Выберите время доставки');
      return;
    }
    if (deliveryType === 'delivery' && !selectedAddress && user?.addresses?.length) {
      setValidationError('Выберите адрес доставки');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        items: items.map((i) => ({
          bouquetId: i.bouquetId || null,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        addressId: deliveryType === 'delivery' ? selectedAddress : null,
        deliveryType,
        deliveryDate,
        deliveryTime,
        recipientName,
        recipientPhone,
        comment,
        bonusUsed,
        isAnonymous,
        cardText,
      };

      const { data: order } = await api.post('/orders', orderData);

      // Create payment
      try {
        const { data: payment } = await api.post('/payment/create', { orderId: order.id });
        if (payment.confirmationUrl) {
          clearCart();
          // Max WebView blocks openLink() after async calls (not a direct user gesture)
          // Use window.location.href for reliable redirect to YuKassa payment page
          window.location.href = payment.confirmationUrl;
          return;
        }
      } catch {
        // Payment not configured — order still created
      }

      clearCart();
      hapticSuccess();
      navigate('/orders');
    } catch (error) {
      console.error('Order error:', error);
      alert('Ошибка при создании заказа');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="pb-4">
      <div className="px-4 py-4 bg-white border-b">
        <h1 className="text-xl font-bold">Оформление заказа</h1>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Delivery type */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-primary" />
            Способ получения
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
                deliveryType === 'delivery' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800 font-semibold'
              }`}
            >
              Доставка
            </button>
            <button
              onClick={() => setDeliveryType('pickup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
                deliveryType === 'pickup' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800 font-semibold'
              }`}
            >
              Самовывоз
            </button>
          </div>
          {deliveryType === 'delivery' && (
            <div className="mt-3">
              {user?.addresses?.length ? (
                <select
                  value={selectedAddress || ''}
                  onChange={(e) => setSelectedAddress(Number(e.target.value))}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 font-medium"
                >
                  {user.addresses.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.title}: {a.street}, {a.house}{a.apartment ? `, кв. ${a.apartment}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-gray-700">
                  Добавьте адрес в профиле или укажите в комментарии
                </p>
              )}
              {subtotal < freeFrom && (
                <p className="text-xs font-medium text-gray-600 mt-2">
                  Доставка {deliveryPrice}₽ (бесплатно от {freeFrom}₽)
                </p>
              )}
            </div>
          )}
          {deliveryType === 'pickup' && (
            <p className="text-sm font-medium text-gray-800 mt-3">
              📍 {settings.address || 'д. Званка, ул. Приозёрная, д. 58'}
            </p>
          )}
        </div>

        {/* Date & time */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Clock size={18} className="text-primary" />
            Дата и время
          </h3>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 mb-2"
          />
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setDeliveryTime(slot)}
                className={`py-2 rounded-xl text-sm ${
                  deliveryTime === slot ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800 font-semibold'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Recipient */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Gift size={18} className="text-primary" />
            Получатель
          </h3>
          <input
            type="text"
            placeholder="Имя получателя"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 mb-2"
          />
          <input
            type="tel"
            placeholder="Телефон получателя"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 mb-2"
          />
          <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="accent-primary w-5 h-5"
            />
            Анонимная доставка
          </label>
        </div>

        {/* Card text */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-primary" />
            Текст открытки
          </h3>
          <textarea
            placeholder="Напишите текст для открытки (необязательно)"
            value={cardText}
            onChange={(e) => setCardText(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 h-20 resize-none"
          />
        </div>

        {/* Comment */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <textarea
            placeholder="Комментарий к заказу"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900 h-16 resize-none"
          />
        </div>

        {/* Bonus */}
        {user && user.bonusPoints > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
              <CreditCard size={18} className="text-primary" />
              Бонусы ({user.bonusPoints} баллов)
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={maxBonus}
                value={bonusUsed}
                onChange={(e) => setBonusUsed(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="font-bold text-primary w-16 text-right">−{bonusUsed}₽</span>
            </div>
            <p className="text-xs font-medium text-gray-600 mt-1">
              Максимум {maxBonusPercent}% от суммы заказа
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Товары</span>
              <span className="font-semibold text-gray-900">{subtotal} ₽</span>
            </div>
            {deliveryCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Доставка</span>
                <span className="font-semibold text-gray-900">{deliveryCost} ₽</span>
              </div>
            )}
            {bonusUsed > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Бонусы</span>
                <span>−{bonusUsed} ₽</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>Итого</span>
              <span className="text-primary">{finalPrice} ₽</span>
            </div>
          </div>

          {validationError && (
            <p className="text-sm text-red-500 mt-2">{validationError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full mt-4 bg-primary text-white py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {submitting ? 'Оформляем...' : 'Оплатить'}
          </button>
        </div>
      </div>
    </div>
  );
}
