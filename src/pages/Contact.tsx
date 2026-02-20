import { useState } from 'react';
import { Send, CheckCircle, MessageCircle } from 'lucide-react';
import api from '../api/client';

export default function Contact() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError('');

    try {
      await api.post('/contact', { message: message.trim() });
      setSent(true);
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="pb-4">
        <div className="bg-gradient-to-r from-pink-400 to-pink-500 text-white px-4 py-10 text-center">
          <CheckCircle size={48} className="mx-auto mb-3" />
          <h1 className="text-xl font-bold">Сообщение отправлено!</h1>
          <p className="text-pink-100 mt-1">Мы ответим в ближайшее время</p>
        </div>
        <div className="px-4 py-4">
          <button
            onClick={() => setSent(false)}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-transform"
          >
            Написать ещё
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-pink-500 text-white px-4 py-8 text-center">
        <MessageCircle size={40} className="mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Написать нам</h1>
        <p className="text-pink-100 mt-1">Мы ответим вам в Max</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <textarea
            placeholder="Ваше сообщение..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={5}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <p className="text-xs font-medium text-gray-600 mt-1 text-right">
            {message.length}/2000
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500 px-1">{error}</p>
        )}

        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send size={18} />
          {sending ? 'Отправка...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
}
