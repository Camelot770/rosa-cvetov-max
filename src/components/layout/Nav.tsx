import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { useCartStore } from '../../store/cart';

export default function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = useCartStore((s) => s.totalItems());

  const tabs = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/catalog', icon: Search, label: 'Каталог' },
    { path: '/cart', icon: ShoppingBag, label: 'Корзина', badge: totalItems },
    { path: '/favorites', icon: Heart, label: 'Избранное' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
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
                  size={22}
                  className={active ? 'text-primary' : 'text-gray-600'}
                />
                {tab.badge ? (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] mt-1 font-semibold ${active ? 'text-primary' : 'text-gray-600'}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
