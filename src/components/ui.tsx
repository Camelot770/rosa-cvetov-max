import type { CSSProperties, ReactNode } from 'react';
import { useCartStore } from '../store/cart';

export const ctaStyle = (background: string): CSSProperties => ({
  background,
  color: 'var(--paper)',
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
});

export function PageHead({
  kicker,
  children,
  aside,
}: {
  kicker: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="px-5 pt-4 pb-5" style={{ borderBottom: '1px solid var(--ink-line)' }}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="caps mb-2" style={{ color: 'var(--vermilion)' }}>{kicker}</div>
          <h1 className="disp text-4xl">{children}</h1>
        </div>
        {aside}
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <div
        className="w-6 h-6 rounded-full animate-spin"
        style={{ border: '2px solid var(--vermilion)', borderTopColor: 'transparent' }}
      />
    </div>
  );
}

// Shown when a request failed, so that a failure never looks like an empty list
export function ErrorState({
  title = 'Не удалось загрузить.',
  message = 'Проверьте интернет и попробуйте ещё раз.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-16 px-5">
      <div className="caps mb-3" style={{ color: 'var(--vermilion)' }}>✦ Ошибка</div>
      <h2 className="disp text-2xl">{title}</h2>
      <p className="mt-2 text-sm" style={{ color: 'var(--ink-soft)' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 w-full py-4 flex items-center justify-center gap-2"
          style={ctaStyle('var(--ink)')}
        >
          Попробовать снова
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="px-5 py-16 text-center">
      <h2 className="disp text-2xl">{title}</h2>
      <p className="mt-2 text-sm" style={{ color: 'var(--ink-soft)' }}>{message}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-6 w-full py-4 flex items-center justify-center gap-2"
          style={ctaStyle('var(--ink)')}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// What changed in the cart after comparing it with the catalog
export function CartNotices() {
  const notices = useCartStore((s) => s.notices);
  const dismissNotices = useCartStore((s) => s.dismissNotices);

  if (notices.length === 0) return null;

  return (
    <div
      className="mx-5 mt-4 px-4 py-3"
      style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-line)' }}
    >
      <div className="caps mb-2" style={{ color: 'var(--vermilion)' }}>✦ Корзина обновилась</div>
      <div className="space-y-1">
        {notices.map((notice) => (
          <p key={notice} className="text-sm" style={{ color: 'var(--ink-soft)' }}>{notice}</p>
        ))}
      </div>
      <button
        onClick={dismissNotices}
        className="caps underline underline-offset-4 mt-3"
        style={{ color: 'var(--ink)' }}
      >
        Понятно
      </button>
    </div>
  );
}
