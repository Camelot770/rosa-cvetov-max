import type { ReactNode } from 'react';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHead } from '../components/ui';
import { useSettings, DEFAULT_ADDRESS, DEFAULT_HOURS, DEFAULT_PHONE } from '../hooks/useSettings';
import { fmt, phoneHref, phoneLabel } from '../utils/format';

function InfoRow({
  icon: Icon,
  label,
  href,
  children,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  children: ReactNode;
}) {
  const content = (
    <>
      <Icon size={16} strokeWidth={1.5} style={{ color: 'var(--vermilion)' }} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm break-words">{children}</div>
        <div className="caps mt-1" style={{ color: 'var(--taupe)' }}>{label}</div>
      </div>
    </>
  );
  const className = 'flex items-center gap-3 py-3';
  const style = { borderBottom: '1px solid var(--ink-line)' };

  return href ? (
    <a href={href} className={className} style={style}>{content}</a>
  ) : (
    <div className={className} style={style}>{content}</div>
  );
}

function InfoList({ num, title, lines }: { num: string; title: string; lines: string[] }) {
  return (
    <section className="pt-8">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="caps flex-shrink-0" style={{ color: 'var(--vermilion)' }}>— {num}</span>
        <h2 className="disp" style={{ fontSize: 22 }}>{title}</h2>
      </div>
      <ul className="space-y-1.5 text-sm" style={{ color: 'var(--ink-soft)' }}>
        {lines.map((line) => <li key={line}>{line}</li>)}
      </ul>
    </section>
  );
}

function ChannelLink({ title, name, href }: { title: string; name: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: '1px solid var(--ink-line)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm break-words">{name}</div>
        <div className="caps mt-1" style={{ color: 'var(--taupe)' }}>{title}</div>
      </div>
      <ExternalLink size={16} strokeWidth={1.5} style={{ color: 'var(--vermilion)' }} />
    </a>
  );
}

const telegramUrl = (channel: string) =>
  /^https?:\/\//.test(channel) ? channel : `https://t.me/${channel.replace('@', '')}`;

export default function About() {
  const settings = useSettings();

  const studioName = settings.studio_name || 'Роза цветов';
  const lastSpace = studioName.lastIndexOf(' ');
  const phone = settings.phone || DEFAULT_PHONE;
  const email = settings.email || 'rozacvetov@list.ru';

  return (
    <div className="pb-6">
      <PageHead kicker={<>P.&nbsp;09 — About</>}>
        {studioName.slice(0, lastSpace + 1)}<em>{studioName.slice(lastSpace + 1)}.</em>
      </PageHead>

      <div className="px-5">
        <div className="caps mt-5" style={{ color: 'var(--taupe)' }}>Студия стабилизированной флористики</div>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          Живые цветы, которые не вянут. Букеты, которые остаются надолго.
        </p>

        <div className="mt-5" style={{ borderTop: '1px solid var(--ink-line)' }}>
          <InfoRow icon={MapPin} label="Адрес">{settings.address || DEFAULT_ADDRESS}</InfoRow>
          <InfoRow icon={Phone} label="Телефон" href={phoneHref(phone)}>{phoneLabel(phone)}</InfoRow>
          <InfoRow icon={Mail} label="Email" href={`mailto:${email}`}>{email}</InfoRow>
          <InfoRow icon={Clock} label="Режим работы">Ежедневно, {settings.work_hours || DEFAULT_HOURS}</InfoRow>
        </div>

        <InfoList
          num="01"
          title="Доставка"
          lines={[
            `Стоимость доставки: ${fmt(parseInt(settings.delivery_price || '500'))}`,
            `Бесплатно от ${fmt(parseInt(settings.free_delivery_from || '5000'))}`,
            'Срок доставки: 1-3 часа',
            `Минимальный заказ: ${fmt(parseInt(settings.min_order || '1000'))}`,
          ]}
        />

        <InfoList
          num="02"
          title="Бонусная программа"
          lines={[
            `${settings.bonus_percent || '5'}% кэшбэк с каждого заказа`,
            `Оплата бонусами до ${settings.max_bonus_discount || '20'}% заказа`,
            '1 бонус = 1 рубль',
          ]}
        />

        {(settings.telegram_channel || settings.max_channel) && (
          <div className="mt-8" style={{ borderTop: '1px solid var(--ink-line)' }}>
            {settings.telegram_channel && (
              <ChannelLink
                title="Наш Telegram"
                name={settings.telegram_channel}
                href={telegramUrl(settings.telegram_channel)}
              />
            )}
            {settings.max_channel && (
              <ChannelLink
                title="Наш канал в Max"
                name={settings.max_channel}
                href={settings.max_channel}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
