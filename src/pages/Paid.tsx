import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { PageHead, ctaStyle } from '../components/ui';
import { useSettings, DEFAULT_PHONE } from '../hooks/useSettings';
import { phoneHref, phoneLabel } from '../utils/format';
import { getWebApp } from '../utils/platform';

// Where YooKassa returns the customer. It usually opens in an external browser,
// where the messenger session doesn't exist, so it only uses the public status endpoint.

type PaidState = 'checking' | 'paid' | 'failed' | 'canceled' | 'waiting' | 'unknown';

const POLL_INTERVAL_MS = 3000;
const POLL_LIMIT_MS = 60000;

const HEADLINES: Record<PaidState, React.ReactNode> = {
  checking: <>Проверяем <em>оплату.</em></>,
  paid: <>Оплата <em>получена.</em></>,
  failed: <>Платёж <em>не прошёл.</em></>,
  canceled: <>Заказ <em>отменён.</em></>,
  waiting: <>Ждём <em>подтверждение.</em></>,
  unknown: <>Не удалось <em>проверить.</em></>,
};

export default function Paid() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const settings = useSettings();

  const orderId = Number(searchParams.get('order'));
  const validOrder = Number.isInteger(orderId) && orderId > 0;

  const [state, setState] = useState<PaidState>(validOrder ? 'checking' : 'unknown');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!validOrder) return;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let reachedServer = false;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}/status`);
        reachedServer = true;
        if (stopped) return;
        if (data.paymentStatus === 'paid') return setState('paid');
        if (data.status === 'canceled') return setState('canceled');
        if (data.paymentStatus === 'canceled') return setState('failed');
      } catch (err: any) {
        if (stopped) return;
        if (err?.response?.status === 404) return setState('unknown');
      }
      if (Date.now() - startedAt >= POLL_LIMIT_MS) {
        setState(reachedServer ? 'waiting' : 'unknown');
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    setState('checking');
    poll();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [orderId, validOrder, attempt]);

  const inApp = !!getWebApp()?.initData;
  const phone = settings.phone || DEFAULT_PHONE;
  const orderLabel = validOrder ? `Заказ №${orderId}` : 'Заказ';

  return (
    <div className="pb-10">
      <PageHead kicker={<>P.&nbsp;06 — Payment</>}>{HEADLINES[state]}</PageHead>

      <div className="px-5 pt-6">
        {state === 'checking' && (
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full animate-spin flex-shrink-0"
              style={{ border: '2px solid var(--vermilion)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              {orderLabel}: ждём ответ банка. Обычно это занимает несколько секунд.
            </p>
          </div>
        )}

        {state === 'paid' && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            {orderLabel} оплачен, спасибо! Теперь вернитесь в приложение «Роза Цветов»:
            статус заказа виден в разделе «Мои заказы».
          </p>
        )}

        {state === 'failed' && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            {orderLabel} не оплачен. Вернитесь в приложение «Роза Цветов», откройте
            «Мои заказы» и нажмите «Оплатить», чтобы попробовать ещё раз.
          </p>
        )}

        {state === 'canceled' && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            {orderLabel} отменён. Если это ошибка, позвоните нам:{' '}
            <a href={phoneHref(phone)} style={{ color: 'var(--vermilion)' }}>{phoneLabel(phone)}</a>.
          </p>
        )}

        {state === 'waiting' && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            Подтверждения оплаты пока нет. Если вы уже оплатили, статус обновится в течение
            нескольких минут. Вернитесь в приложение «Роза Цветов» и проверьте «Мои заказы».
          </p>
        )}

        {state === 'unknown' && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            Сейчас не получается узнать статус оплаты. Вернитесь в приложение «Роза Цветов»
            и проверьте «Мои заказы». Если есть вопросы, позвоните нам:{' '}
            <a href={phoneHref(phone)} style={{ color: 'var(--vermilion)' }}>{phoneLabel(phone)}</a>.
          </p>
        )}

        {validOrder && (state === 'waiting' || state === 'unknown') && (
          <button
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-6 w-full py-4 flex items-center justify-center gap-2"
            style={ctaStyle('var(--ink)')}
          >
            Проверить ещё раз
          </button>
        )}

        {inApp && state !== 'checking' && (
          <button
            onClick={() => navigate('/orders', { replace: true })}
            className="mt-3 w-full py-4 flex items-center justify-center gap-2"
            style={ctaStyle('var(--vermilion)')}
          >
            Мои заказы →
          </button>
        )}
      </div>
    </div>
  );
}
