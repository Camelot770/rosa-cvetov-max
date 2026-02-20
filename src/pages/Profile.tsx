import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Heart, Star, MapPin, Phone, Info, MessageCircle } from 'lucide-react';
import { useUserStore } from '../store/user';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, fetchProfile } = useUserStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-pink-500 text-white px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            {user?.firstName?.[0] || '🌹'}
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {user?.firstName} {user?.lastName || ''}
            </h1>
            {user?.username && <p className="text-pink-100">@{user.username}</p>}
          </div>
        </div>

        {/* Bonus card */}
        <div className="mt-4 bg-white/15 backdrop-blur rounded-xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-pink-100 text-sm">Бонусные баллы</p>
              <p className="text-3xl font-bold">{user?.bonusPoints || 0}</p>
            </div>
            <Star size={32} className="text-yellow-300" />
          </div>
          <p className="text-pink-100 text-xs mt-2">
            5% кэшбэк с каждого заказа
          </p>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 py-4 space-y-2">
        <button
          onClick={() => navigate('/orders')}
          className="w-full flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Package size={20} className="text-blue-500" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-gray-900">Мои заказы</p>
            <p className="text-xs font-medium text-gray-700">История заказов</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/favorites')}
          className="w-full flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <Heart size={20} className="text-red-500" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-gray-900">Избранное</p>
            <p className="text-xs font-medium text-gray-700">Понравившиеся букеты</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/about')}
          className="w-full flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
            <Info size={20} className="text-primary" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-gray-900">О студии</p>
            <p className="text-xs font-medium text-gray-700">Контакты и информация</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/contact')}
          className="w-full flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <MessageCircle size={20} className="text-purple-500" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-gray-900">Написать нам</p>
            <p className="text-xs font-medium text-gray-700">Задайте вопрос</p>
          </div>
        </button>

        {/* Phone */}
        {user?.phone && (
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Phone size={20} className="text-green-500" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-gray-900">{user.phone}</p>
              <p className="text-xs font-medium text-gray-700">Ваш телефон</p>
            </div>
          </div>
        )}

        {/* Addresses */}
        {user?.addresses && user.addresses.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-primary" />
              Адреса
            </h3>
            {user.addresses.map((a: any) => (
              <div key={a.id} className="text-sm text-gray-800 py-1.5 border-t first:border-0">
                <span className="font-semibold">{a.title}:</span> {a.street}, {a.house}
                {a.apartment ? `, кв. ${a.apartment}` : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
