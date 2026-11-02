import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useUserStore } from '../store/user';
import { PageHead, Spinner, ErrorState, EmptyState, ctaStyle } from '../components/ui';
import { fmt, apiErrorMessage } from '../utils/format';
import { openLink } from '../utils/platform';
import {
  createPaymentLink,
  isLinkFresh,
  PAYMENT_ERROR_FALLBACK,
  SLOW_REQUEST_TIMEOUT,
  type PaymentLink,
  type PlacedOrderState,
} from '../utils/payment';

interface Order {
  id: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  deliveryType: string;
  deliveryDate?: string;
  deliveryTime?: string;
  paymentStatus: string;
  bonusEarned: number;
  bonusUsed: number;
  promoDiscount: number;
  items: { id: number; name: string; price: number; quantity: number }[];
  address?: { street: string; house: string; apartment?: string } | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Новый', color: 'var(--vermilion)' },
  confirmed: { label: 'Подтверждён', color: 'var(--ink)' },
  preparing: { label: 'Готовится', color: 'var(--ink)' },
  delivering: { label: 'В доставке', color: 'var(--ink)' },
  completed: { label: 'Выполнен', color: 'var(--ink)' },
  canceled: { label: 'Отменён', color: 'var(--taupe)' },
};

// How often to look for the payment result while a payment link is open.
// A payment page shown over the app may not trigger visibilitychange when it closes.
const PAYMENT_POLL_MS = 15000;

const isUnpaid = (order: Order) => order.paymentStatus !== 'paid';
const canPay = (order: Order) => isUnpaid(order) && !['canceled', 'completed'].includes(order.status);
const canCancel = (order: Order) => isUnpaid(order) && order.status === 'new';
// A link of a payment that failed leads nowhere, the next attempt needs a new one
const activeLink = (order: Order, link?: PaymentLink) =>
  canPay(order) && order.paymentStatus !== 'canceled' && isLinkFresh(link) ? link : undefined;

function paymentLabel(order: Order): { text: string; color: string } | null {
  if (order.paymentStatus === 'paid') return { text: 'Оплачен', color: 'var(--ink)' };
  if (order.status === 'canceled') return null;
  if (order.paymentStatus === 'canceled') return { text: 'Платёж не прошёл', color: 'var(--vermilion)' };
  return { text: 'Ожидает оплаты', color: 'var(--vermilion)' };
}

// 2026-11-03 → 03.11.2026
const formatDeliveryDate = (date: string) => date.split('-').reverse().join('.');

function OrderCard({
  order,
  link,
  payError,
  paying,
  canceling,
  confirmingCancel,
  onPay,
  onAskCancel,
  onKeep,
  onCancel,
}: {
  order: Order;
  link?: PaymentLink;
  payError?: string;
  paying: boolean;
  canceling: boolean;
  confirmingCancel: boolean;
  onPay: () => void;
  onAskCancel: () => void;
  onKeep: () => void;
  onCancel: () => void;
}) {
  const status = statusConfig[order.status] || statusConfig.new;
  const payment = paymentLabel(order);
  const created = new Date(order.createdAt);
  const linkReady = !!activeLink(order, link);

  return (
    <article className="px-5 py-5" style={{ borderBottom: '1px solid var(--ink-line)' }}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="disp" style={{ fontSize: 24 }}>Заказ <em>№{order.id}</em></h2>
        <span className="caps flex-shrink-0" style={{ color: status.color }}>{status.label}</span>
      </div>
      <div className="caps mt-1" style={{ color: 'var(--taupe)' }}>
        {created.toLocaleDateString('ru-RU')} · {created.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className="mt-3 space-y-1.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 text-sm">
            <span>«{item.name}»{item.quantity > 1 ? ` × ${item.quantity}` : ''}</span>
            <span className="font-mono flex-shrink-0">{fmt(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="rail mt-3" />

      <div className="mt-3 text-sm" style={{ color: 'var(--ink-soft)' }}>
        {order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
        {order.deliveryDate ? ` · ${formatDeliveryDate(order.deliveryDate)}` : ''}
        {order.deliveryTime ? `, ${order.deliveryTime}` : ''}
        {order.address && (
          <div className="mt-1">
            {order.address.street}, {order.address.house}
            {order.address.apartment ? `, кв. ${order.address.apartment}` : ''}
          </div>
        )}
      </div>

      {(order.promoDiscount > 0 || order.bonusUsed > 0) && (
        <div className="caps mt-3" style={{ color: 'var(--taupe)' }}>
          {order.promoDiscount > 0 && <div>Промокод: −{fmt(order.promoDiscount)}</div>}
          {order.bonusUsed > 0 && <div className={order.promoDiscount > 0 ? 'mt-1' : ''}>Бонусы: −{fmt(order.bonusUsed)}</div>}
        </div>
      )}

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="caps" style={{ color: payment?.color }}>{payment?.text}</span>
        <span className="disp flex-shrink-0" style={{ fontSize: 22 }}>{fmt(order.totalPrice)}</span>
      </div>

      {order.bonusEarned > 0 && order.paymentStatus === 'paid' && order.status !== 'canceled' && (
        <p className="caps mt-2" style={{ color: 'var(--taupe)' }}>
          +{order.bonusEarned} бонусов начислено
        </p>
      )}

      {payError && (
        <p className="text-sm mt-3 px-3 py-2" style={{ background: 'var(--vermilion)', color: 'var(--paper)' }}>
          {payError}
        </p>
      )}

      {canPay(order) && (
        <>
          <button
            onClick={onPay}
            disabled={paying}
            className="w-full py-4 mt-4 flex items-center justify-center gap-2"
            style={{ ...ctaStyle(paying ? 'var(--taupe)' : 'var(--vermilion)'), opacity: paying ? 0.6 : 1 }}
          >
            {paying ? 'Создаём платёж…' : linkReady ? 'Перейти к оплате' : `Оплатить · ${fmt(order.totalPrice)}`}
          </button>
          {linkReady && (
            <p className="text-sm mt-2" style={{ color: 'var(--ink-soft)' }}>
              Откроется страница ЮKassa. После оплаты вернитесь сюда, статус обновится сам.
            </p>
          )}
        </>
      )}

      {canCancel(order) && (
        confirmingCancel ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm">Точно отменить заказ?</span>
            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={onCancel}
                disabled={canceling}
                className="caps underline underline-offset-4"
                style={{ color: 'var(--vermilion)' }}
              >
                {canceling ? 'Отменяем…' : 'Да, отменить'}
              </button>
              <button onClick={onKeep} className="caps underline underline-offset-4" style={{ color: 'var(--ink)' }}>
                Нет
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onAskCancel}
            className="caps underline underline-offset-4 mt-4"
            style={{ color: 'var(--taupe)' }}
          >
            Отменить заказ
          </button>
        )
      )}
    </article>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  // Only for the visit right after checkout: it leaves the history entry, so a reload doesn't bring old messages back
  const [placed] = useState(location.state as PlacedOrderState | null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [links, setLinks] = useState<Record<number, PaymentLink>>(
    placed?.link ? { [placed.placedOrderId]: placed.link } : {},
  );
  const [payErrors, setPayErrors] = useState<Record<number, string>>(
    placed?.paymentError ? { [placed.placedOrderId]: placed.paymentError } : {},
  );
  const [payingId, setPayingId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to load orders:', err?.response?.status, err?.response?.data);
      // The server creates the customer on the first profile request, which may still be on its way
      if (err?.response?.status === 404) {
        setOrders([]);
      } else if (!silent) {
        setError(
          err?.response?.status === 401
            ? 'Ошибка авторизации. Попробуйте перезапустить приложение.'
            : 'Не удалось загрузить заказы'
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [loadOrders]);

  // The customer comes back here from the payment page
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') loadOrders(true);
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [loadOrders]);

  const waitingForPayment = orders.some((order) => activeLink(order, links[order.id]));
  useEffect(() => {
    if (!waitingForPayment) return;
    const timer = setInterval(() => loadOrders(true), PAYMENT_POLL_MS);
    return () => clearInterval(timer);
  }, [waitingForPayment, loadOrders]);

  const handlePay = async (order: Order) => {
    const existing = activeLink(order, links[order.id]);
    if (existing) {
      openLink(existing.url);
      return;
    }
    setPayingId(order.id);
    setPayErrors(({ [order.id]: _, ...rest }) => rest);
    try {
      const link = await createPaymentLink(order.id);
      setLinks((current) => ({ ...current, [order.id]: link }));
      setOrders((current) => current.map((o) => (o.id === order.id ? { ...o, paymentStatus: 'pending' } : o)));
      openLink(link.url);
    } catch (err) {
      console.error('Payment error:', err);
      setPayErrors((current) => ({ ...current, [order.id]: apiErrorMessage(err, PAYMENT_ERROR_FALLBACK) }));
      // A 409 means the order changed in the meantime, for example it has just been paid
      loadOrders(true);
    } finally {
      setPayingId(null);
    }
  };

  const handleCancel = async (order: Order) => {
    setCancelingId(order.id);
    setPayErrors(({ [order.id]: _, ...rest }) => rest);
    try {
      await api.post(`/orders/${order.id}/cancel`, undefined, { timeout: SLOW_REQUEST_TIMEOUT });
      await loadOrders(true);
      // Spent bonuses come back with the cancellation
      useUserStore.getState().fetchProfile();
    } catch (err) {
      console.error('Cancel error:', err);
      setPayErrors((current) => ({
        ...current,
        [order.id]: apiErrorMessage(err, 'Не удалось отменить заказ. Попробуйте ещё раз или позвоните нам.'),
      }));
      loadOrders(true);
    } finally {
      setCancelingId(null);
      setConfirmCancelId(null);
    }
  };

  const head = <PageHead kicker={<>P.&nbsp;07 — Orders</>}>Мои <em>заказы.</em></PageHead>;

  if (loading) {
    return (
      <div className="pb-6">
        {head}
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-6">
        {head}
        <ErrorState title="Заказы не загрузились." message={error} onRetry={() => loadOrders()} />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="pb-6">
        {head}
        <EmptyState
          title={<>Заказов <em>пока нет.</em></>}
          message="Ваши заказы будут отображаться здесь."
          actionLabel="Открыть каталог →"
          onAction={() => navigate('/catalog')}
        />
      </div>
    );
  }

  const placedOrder = placed ? orders.find((order) => order.id === placed.placedOrderId) : undefined;

  return (
    <div className="pb-6">
      {head}

      {placedOrder && canPay(placedOrder) && (
        <div
          className="mx-5 mt-4 px-4 py-3"
          style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-line)' }}
        >
          <div className="caps mb-1" style={{ color: 'var(--vermilion)' }}>✦ Заказ оформлен</div>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Заказ №{placedOrder.id} сохранён. Осталось его оплатить, кнопка ниже.
          </p>
        </div>
      )}

      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          link={links[order.id]}
          payError={payErrors[order.id]}
          paying={payingId === order.id}
          canceling={cancelingId === order.id}
          confirmingCancel={confirmCancelId === order.id}
          onPay={() => handlePay(order)}
          onAskCancel={() => setConfirmCancelId(order.id)}
          onKeep={() => setConfirmCancelId(null)}
          onCancel={() => handleCancel(order)}
        />
      ))}
    </div>
  );
}
