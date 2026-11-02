import { useState } from 'react';
import { Phone } from 'lucide-react';
import api from '../api/client';
import { PageHead, ctaStyle } from '../components/ui';
import { useSettings, DEFAULT_PHONE } from '../hooks/useSettings';
import { apiErrorMessage, phoneHref, phoneLabel } from '../utils/format';

export default function Contact() {
  const settings = useSettings();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const phone = settings.phone || DEFAULT_PHONE;

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError('');

    try {
      await api.post('/contact', { message: message.trim() });
      setSent(true);
      setMessage('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Не удалось отправить сообщение'));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="pb-6">
        <PageHead kicker={<>P.&nbsp;10 — Contact</>}>Сообщение <em>отправлено.</em></PageHead>
        <div className="px-5 pt-5">
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Мы ответим в ближайшее время.</p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 w-full py-4 flex items-center justify-center gap-2"
            style={ctaStyle('var(--ink)')}
          >
            Написать ещё
          </button>
        </div>
      </div>
    );
  }

  const canSend = !sending && !!message.trim();

  return (
    <div className="pb-6">
      <PageHead kicker={<>P.&nbsp;10 — Contact</>}>Написать <em>нам.</em></PageHead>

      <div className="px-5 pt-5">
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Мы ответим вам в Max</p>

        <textarea
          placeholder="Ваше сообщение…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={6}
          className="mt-4"
          style={{
            background: 'var(--paper-2)',
            border: '1px solid var(--ink-line)',
            fontFamily: 'var(--body)',
            fontSize: 14,
            color: 'var(--ink)',
            outline: 'none',
            width: '100%',
            padding: '12px 14px',
            resize: 'none',
          }}
        />
        <p className="caps mt-1 text-right" style={{ color: 'var(--taupe)' }}>{message.length}/2000</p>

        {error && (
          <p className="text-sm mt-3 px-3 py-2" style={{ background: 'var(--vermilion)', color: 'var(--paper)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="mt-4 w-full py-4 flex items-center justify-center gap-2"
          style={{ ...ctaStyle(canSend ? 'var(--vermilion)' : 'var(--taupe)'), opacity: canSend ? 1 : 0.6 }}
        >
          {sending ? 'Отправляем…' : 'Отправить'}
        </button>

        <a
          href={phoneHref(phone)}
          className="flex items-center gap-3 py-3 mt-6"
          style={{ borderTop: '1px solid var(--ink-line)', borderBottom: '1px solid var(--ink-line)' }}
        >
          <Phone size={16} strokeWidth={1.5} style={{ color: 'var(--vermilion)' }} />
          <div className="flex-1">
            <div className="font-mono text-sm">{phoneLabel(phone)}</div>
            <div className="caps mt-1" style={{ color: 'var(--taupe)' }}>Или позвоните нам</div>
          </div>
        </a>
      </div>
    </div>
  );
}
