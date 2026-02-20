import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import api from '../api/client';
import { imageUrl } from '../utils/image';
import { useCartStore } from '../store/cart';
import { hapticSuccess } from '../utils/platform';

interface ConstructorItem {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
}

interface SelectedItem {
  item: ConstructorItem;
  quantity: number;
}

export default function Constructor() {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [flowers, setFlowers] = useState<ConstructorItem[]>([]);
  const [greenery, setGreenery] = useState<ConstructorItem[]>([]);
  const [packaging, setPackaging] = useState<ConstructorItem[]>([]);
  const [selectedFlowers, setSelectedFlowers] = useState<Map<number, SelectedItem>>(new Map());
  const [selectedGreenery, setSelectedGreenery] = useState<Map<number, SelectedItem>>(new Map());
  const [selectedPackaging, setSelectedPackaging] = useState<number | null>(null);
  const [step, setStep] = useState(0); // 0=flowers, 1=greenery, 2=packaging
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    api.get('/constructor').then(({ data }) => {
      setFlowers(data.flowers);
      setGreenery(data.greenery);
      setPackaging(data.packaging);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const addFlower = (item: ConstructorItem) => {
    const map = new Map(selectedFlowers);
    const existing = map.get(item.id);
    map.set(item.id, { item, quantity: (existing?.quantity || 0) + 1 });
    setSelectedFlowers(map);
  };

  const removeFlower = (id: number) => {
    const map = new Map(selectedFlowers);
    const existing = map.get(id);
    if (existing && existing.quantity > 1) {
      map.set(id, { ...existing, quantity: existing.quantity - 1 });
    } else {
      map.delete(id);
    }
    setSelectedFlowers(map);
  };

  const addGreen = (item: ConstructorItem) => {
    const map = new Map(selectedGreenery);
    const existing = map.get(item.id);
    map.set(item.id, { item, quantity: (existing?.quantity || 0) + 1 });
    setSelectedGreenery(map);
  };

  const removeGreen = (id: number) => {
    const map = new Map(selectedGreenery);
    const existing = map.get(id);
    if (existing && existing.quantity > 1) {
      map.set(id, { ...existing, quantity: existing.quantity - 1 });
    } else {
      map.delete(id);
    }
    setSelectedGreenery(map);
  };

  const totalPrice = () => {
    let total = 0;
    selectedFlowers.forEach((v) => (total += v.item.price * v.quantity));
    selectedGreenery.forEach((v) => (total += v.item.price * v.quantity));
    if (selectedPackaging) {
      const pkg = packaging.find((p) => p.id === selectedPackaging);
      if (pkg) total += pkg.price;
    }
    return total;
  };

  const totalFlowers = () => {
    let count = 0;
    selectedFlowers.forEach((v) => (count += v.quantity));
    return count;
  };

  const handleAddToCart = () => {
    const constructorData = {
      flowers: Array.from(selectedFlowers.values()).map((v) => ({
        name: v.item.name,
        price: v.item.price,
        quantity: v.quantity,
      })),
      greenery: Array.from(selectedGreenery.values()).map((v) => ({
        name: v.item.name,
        price: v.item.price,
        quantity: v.quantity,
      })),
      packaging: selectedPackaging
        ? packaging.find((p) => p.id === selectedPackaging)?.name
        : null,
    };

    addItem({
      id: `constructor-${Date.now()}`,
      name: 'Авторский букет',
      price: totalPrice(),
      isConstructor: true,
      constructorData,
    });

    hapticSuccess();
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const steps = ['Цветы', 'Зелень', 'Упаковка'];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-pink-500 text-white px-4 py-6">
        <h1 className="text-xl font-bold">Конструктор букетов</h1>
        <p className="text-pink-100 text-sm mt-1">Соберите свой уникальный букет</p>
      </div>

      {/* Step indicators */}
      <div className="flex border-b">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
              step === i ? 'border-primary text-primary' : 'border-transparent text-gray-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {step === 0 && (
          <div className="space-y-3">
            {flowers.map((f) => {
              const sel = selectedFlowers.get(f.id);
              return (
                <div key={f.id} className="flex items-center bg-white rounded-xl p-3 shadow-sm">
                  <div className="w-14 h-14 bg-pink-50 rounded-lg flex items-center justify-center text-2xl shrink-0">
                    {f.imageUrl ? (
                      <img src={imageUrl(f.imageUrl || '')} alt={f.name} className="w-full h-full object-cover rounded-lg" />
                    ) : '🌸'}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium">{f.name}</p>
                    <p className="text-primary text-sm font-semibold">{f.price} ₽/шт</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sel && sel.quantity > 0 && (
                      <>
                        <button onClick={() => removeFlower(f.id)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-medium">{sel.quantity}</span>
                      </>
                    )}
                    <button onClick={() => addFlower(f)} className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {greenery.map((g) => {
              const sel = selectedGreenery.get(g.id);
              return (
                <div key={g.id} className="flex items-center bg-white rounded-xl p-3 shadow-sm">
                  <div className="w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center text-2xl shrink-0">
                    {g.imageUrl ? (
                      <img src={imageUrl(g.imageUrl || '')} alt={g.name} className="w-full h-full object-cover rounded-lg" />
                    ) : '🌿'}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium">{g.name}</p>
                    <p className="text-green-600 text-sm font-semibold">{g.price} ₽/шт</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sel && sel.quantity > 0 && (
                      <>
                        <button onClick={() => removeGreen(g.id)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-medium">{sel.quantity}</span>
                      </>
                    )}
                    <button onClick={() => addGreen(g)} className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {packaging.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPackaging(selectedPackaging === p.id ? null : p.id)}
                className={`w-full flex items-center bg-white rounded-xl p-3 shadow-sm border-2 transition-colors ${
                  selectedPackaging === p.id ? 'border-primary' : 'border-transparent'
                }`}
              >
                <div className="w-14 h-14 bg-amber-50 rounded-lg flex items-center justify-center text-2xl shrink-0">
                  {p.imageUrl ? (
                    <img src={imageUrl(p.imageUrl || '')} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                  ) : '📦'}
                </div>
                <div className="ml-3 flex-1 text-left">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-amber-600 text-sm font-semibold">{p.price} ₽</p>
                </div>
                {selectedPackaging === p.id && (
                  <span className="text-primary font-bold text-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom summary */}
      {totalFlowers() > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-3">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600">Цветов: {totalFlowers()}</span>
              <span className="text-xl font-bold text-primary">{totalPrice()} ₽</span>
            </div>
            <button
              onClick={handleAddToCart}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <ShoppingBag size={18} />
              Добавить в корзину
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
