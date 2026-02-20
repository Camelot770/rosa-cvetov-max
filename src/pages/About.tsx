import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import api from '../api/client';

export default function About() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSettings(data)).catch(() => {});
  }, []);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-pink-500 text-white px-4 py-8 text-center">
        <div className="text-5xl mb-3">🌹</div>
        <h1 className="text-2xl font-bold">{settings.studio_name || 'Роза цветов'}</h1>
        <p className="text-pink-100 mt-1">Студия стабилизированной флористики</p>
        <p className="text-pink-200 text-xs mt-2">Живые цветы, которые не вянут. Букеты, которые остаются надолго.</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Address */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Адрес</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">
                {settings.address || 'д. Званка, ул. Приозёрная, д. 58'}
              </p>
            </div>
          </div>
        </div>

        {/* Phone */}
        <a
          href={`tel:${settings.phone || '+79178765958'}`}
          className="block bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
              <Phone size={20} className="text-green-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Телефон</p>
              <p className="text-sm text-primary mt-0.5">
                {settings.phone || '+7 917 876-59-58'}
              </p>
            </div>
          </div>
        </a>

        {/* Email */}
        <a
          href={`mailto:${settings.email || 'rozacvetov@list.ru'}`}
          className="block bg-white rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <Mail size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Email</p>
              <p className="text-sm text-primary mt-0.5">
                {settings.email || 'rozacvetov@list.ru'}
              </p>
            </div>
          </div>
        </a>

        {/* Work hours */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
              <Clock size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Режим работы</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">
                Ежедневно, {settings.work_hours || '9:00 – 21:00'}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2">🚗 Доставка</h3>
          <ul className="text-sm font-medium text-gray-800 space-y-1">
            <li>• Стоимость доставки — {settings.delivery_price || '500'}₽</li>
            <li>• Бесплатно от {settings.free_delivery_from || '5000'}₽</li>
            <li>• Срок доставки — 1–3 часа</li>
            <li>• Минимальный заказ — {settings.min_order || '1000'}₽</li>
          </ul>
        </div>

        {/* Bonus program */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-2">⭐ Бонусная программа</h3>
          <ul className="text-sm font-medium text-gray-800 space-y-1">
            <li>• {settings.bonus_percent || '5'}% кэшбэк с каждого заказа</li>
            <li>• Оплата бонусами до {settings.max_bonus_discount || '20'}% заказа</li>
            <li>• 1 бонус = 1 рубль</li>
          </ul>
        </div>

        {/* Social */}
        {settings.telegram_channel && (
          <a
            href={`https://t.me/${settings.telegram_channel.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm"
          >
            <span className="text-2xl">📱</span>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Наш Telegram</p>
              <p className="text-sm text-primary">{settings.telegram_channel}</p>
            </div>
            <ExternalLink size={16} className="text-gray-600" />
          </a>
        )}
        {settings.max_channel && (
          <a
            href={settings.max_channel}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm"
          >
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Наш канал в Max</p>
              <p className="text-sm text-primary">{settings.max_channel}</p>
            </div>
            <ExternalLink size={16} className="text-gray-600" />
          </a>
        )}
      </div>
    </div>
  );
}
