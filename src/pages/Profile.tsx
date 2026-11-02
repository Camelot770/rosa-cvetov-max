import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Heart, Info, MessageCircle, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import api from '../api/client';
import { useUserStore } from '../store/user';
import { useSettings } from '../hooks/useSettings';
import { PageHead, Spinner, ErrorState } from '../components/ui';
import { apiErrorMessage } from '../utils/format';

function MenuRow({
  icon: Icon,
  title,
  meta,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-4 text-left"
      style={{ borderBottom: '1px solid var(--ink-line)' }}
    >
      <Icon size={16} strokeWidth={1.5} style={{ color: 'var(--vermilion)' }} className="flex-shrink-0" />
      <span className="flex-1">
        <span className="font-display block" style={{ fontSize: 20, lineHeight: 1.1 }}>{title}</span>
        <span className="caps block mt-1" style={{ color: 'var(--taupe)' }}>{meta}</span>
      </span>
      <ArrowRight size={16} strokeWidth={1.5} style={{ color: 'var(--vermilion)' }} />
    </button>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, fetchProfile } = useUserStore();
  const settings = useSettings();
  const [attempted, setAttempted] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const load = () => {
    setAttempted(false);
    fetchProfile().finally(() => setAttempted(true));
  };

  useEffect(load, []);

  const deleteAddress = async (id: number) => {
    setDeletingId(id);
    setDeleteError('');
    try {
      await api.delete(`/user/address/${id}`);
      useUserStore.setState((state) => (
        state.user
          ? { user: { ...state.user, addresses: state.user.addresses.filter((a) => a.id !== id) } }
          : state
      ));
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'Не удалось удалить адрес. Попробуйте ещё раз.'));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const menu = (
    <div className="px-5 mt-5" style={{ borderTop: '1px solid var(--ink-line)' }}>
      <MenuRow icon={Package} title="Мои заказы" meta="История и оплата" onClick={() => navigate('/orders')} />
      <MenuRow icon={Heart} title="Избранное" meta="Понравившиеся букеты" onClick={() => navigate('/favorites')} />
      <MenuRow icon={Info} title="О студии" meta="Контакты и доставка" onClick={() => navigate('/about')} />
      <MenuRow icon={MessageCircle} title="Написать нам" meta="Задайте вопрос" onClick={() => navigate('/contact')} />
    </div>
  );

  if (!user && !attempted) {
    return (
      <div className="pb-6">
        <PageHead kicker={<>P.&nbsp;08 — Profile</>}>Ваш <em>профиль.</em></PageHead>
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pb-6">
        <PageHead kicker={<>P.&nbsp;08 — Profile</>}>Ваш <em>профиль.</em></PageHead>
        <ErrorState
          title="Профиль не загрузился."
          message="Проверьте интернет и попробуйте ещё раз. Если не помогло, перезапустите приложение."
          onRetry={load}
        />
        {menu}
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHead kicker={<>P.&nbsp;08 — Profile</>}>
        {user.firstName ? <>Здравствуйте, <em>{user.firstName}.</em></> : <>Ваш <em>профиль.</em></>}
      </PageHead>

      {/* Bonus */}
      <div
        className="mx-5 mt-5 px-4 py-4"
        style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-line)' }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="caps" style={{ color: 'var(--vermilion)' }}>✦ Бонусы</span>
          <span className="disp" style={{ fontSize: 32 }}>{user.bonusPoints || 0}</span>
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
          {settings.bonus_percent || '5'}% кэшбэк с каждого заказа. 1 бонус = 1 рубль.
        </p>
      </div>

      {menu}

      {user.phone && (
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--ink-line)' }}>
          <div className="caps" style={{ color: 'var(--taupe)' }}>Ваш телефон</div>
          <div className="font-mono text-sm mt-1">{user.phone}</div>
        </div>
      )}

      {user.addresses?.length > 0 && (
        <section className="px-5 pt-6">
          <div className="caps mb-2" style={{ color: 'var(--vermilion)' }}>✦ Адреса</div>
          {deleteError && (
            <p className="text-sm mb-2 px-3 py-2" style={{ background: 'var(--vermilion)', color: 'var(--paper)' }}>
              {deleteError}
            </p>
          )}
          {user.addresses.map((a: any) => (
            <div
              key={a.id}
              className="flex items-baseline justify-between gap-3 py-3"
              style={{ borderBottom: '1px solid var(--ink-line)' }}
            >
              <span className="text-sm">
                {a.street}, {a.house}
                {a.apartment ? `, кв. ${a.apartment}` : ''}
              </span>
              {confirmDeleteId === a.id ? (
                <span className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => deleteAddress(a.id)}
                    disabled={deletingId === a.id}
                    className="caps underline underline-offset-4"
                    style={{ color: 'var(--vermilion)' }}
                  >
                    {deletingId === a.id ? 'Удаляем…' : 'Удалить'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="caps underline underline-offset-4"
                    style={{ color: 'var(--ink)' }}
                  >
                    Нет
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(a.id)}
                  className="caps underline underline-offset-4 flex-shrink-0"
                  style={{ color: 'var(--taupe)' }}
                >
                  Убрать
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
