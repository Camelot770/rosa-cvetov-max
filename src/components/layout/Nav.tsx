import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { useCartStore } from '../../store/cart';

export default function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = useCartStore((s) => s.totalItems());

  const tabs = [
    { path: '/',           icon: Home,        label: 'Главная' },
    { path: '/catalog',    icon: Search,      label: 'Каталог' },
    { path: '/cart',       icon: ShoppingBag, label: 'Корзина', badge: totalItems },
    { path: '/favorites',  icon: Heart,       label: 'Любимое' },
    { path: '/profile',    icon: User,        label: 'Профиль' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'var(--ink)',
        color: 'var(--paper)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center w-full h-full relative"
            >
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={active ? 2 : 1.5}
                  style={{ color: active ? 'var(--vermilion)' : 'var(--paper-2)' }}
                />
                {tab.badge ? (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center"
                    style={{
                      background: 'var(--vermilion)',
                      color: 'var(--paper)',
                      fontFamily: 'var(--mono)',
                      fontSize: 9,
                      fontWeight: 500,
                    }}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className="mt-1"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--vermilion)' : 'var(--paper-2)',
                  opacity: active ? 1 : 0.72,
                }}
              >
                {tab.label}
              </span>
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px]"
                  style={{ background: 'var(--vermilion)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
