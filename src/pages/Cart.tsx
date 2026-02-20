import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { imageUrl } from '../utils/image';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-gray-800">Корзина пуста</h2>
        <p className="text-gray-700 mt-2 text-center font-medium">
          Добавьте букеты из каталога
        </p>
        <button
          onClick={() => navigate('/catalog')}
          className="mt-6 bg-primary text-white px-6 py-3 rounded-xl font-semibold"
        >
          Перейти в каталог
        </button>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Корзина</h1>
          <button onClick={clearCart} className="text-red-500 text-sm font-medium">
            Очистить
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm flex">
            <div className="w-20 h-20 bg-pink-50 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
              {item.image ? (
                <img src={imageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🌹</span>
              )}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex justify-between">
                <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                <button onClick={() => removeItem(item.id)} className="text-gray-400">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-gray-700"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="font-bold text-primary">{item.price * item.quantity} ₽</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total & checkout */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center text-lg">
            <span className="font-bold text-gray-900">Итого:</span>
            <span className="font-bold text-primary text-xl">{totalPrice()} ₽</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full mt-4 bg-primary text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <ShoppingBag size={18} />
            Оформить заказ
          </button>
        </div>
      </div>
    </div>
  );
}
