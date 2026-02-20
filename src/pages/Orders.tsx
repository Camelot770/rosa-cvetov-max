import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Truck, XCircle, Sparkles } from 'lucide-react';
import api from '../api/client';

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
  items: { id: number; name: string; price: number; quantity: number }[];
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  new: { label: 'Новый', icon: Clock, color: 'text-blue-500 bg-blue-50' },
  confirmed: { label: 'Подтверждён', icon: CheckCircle, color: 'text-green-500 bg-green-50' },
  preparing: { label: 'Готовится', icon: Sparkles, color: 'text-amber-500 bg-amber-50' },
  delivering: { label: 'В доставке', icon: Truck, color: 'text-purple-500 bg-purple-50' },
  completed: { label: 'Выполнен', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  canceled: { label: 'Отменён', icon: XCircle, color: 'text-red-500 bg-red-50' },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then(({ data }) => {
      setOrders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-4">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-bold text-gray-800">Заказов пока нет</h2>
        <p className="text-gray-700 mt-2 text-center font-medium">
          Ваши заказы будут отображаться здесь
        </p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-4 py-4 bg-white border-b">
        <h1 className="text-xl font-bold">Мои заказы</h1>
      </div>

      <div className="px-4 py-3 space-y-3">
        {orders.map((order) => {
          const sc = statusConfig[order.status] || statusConfig.new;
          const StatusIcon = sc.icon;
          const date = new Date(order.createdAt);
          return (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">Заказ #{order.id}</span>
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${sc.color}`}>
                  <StatusIcon size={12} />
                  {sc.label}
                </div>
              </div>

              <p className="text-xs font-medium text-gray-600">
                {date.toLocaleDateString('ru-RU')} в {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>

              <div className="mt-2 space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{item.name} x{item.quantity}</span>
                    <span className="font-bold text-gray-900">{item.price * item.quantity} ₽</span>
                  </div>
                ))}
              </div>

              <div className="border-t mt-2 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {order.deliveryType === 'delivery' ? '🚗 Доставка' : '🏪 Самовывоз'}
                  {order.deliveryDate ? ` · ${order.deliveryDate}` : ''}
                </span>
                <span className="font-bold text-primary">{order.totalPrice} ₽</span>
              </div>

              {order.bonusEarned > 0 && order.status === 'completed' && (
                <p className="text-xs text-green-500 mt-1">
                  +{order.bonusEarned} бонусов начислено ⭐
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
