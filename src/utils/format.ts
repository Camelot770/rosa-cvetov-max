export const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';

// +79178765958 → +7 917 876-59-58; anything that isn't a Russian number stays as entered
export function phoneLabel(phone: string): string {
  const match = phone.replace(/\D/g, '').match(/^[78](\d{3})(\d{3})(\d{2})(\d{2})$/);
  return match ? `+7 ${match[1]} ${match[2]}-${match[3]}-${match[4]}` : phone;
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

// The server writes customer-facing errors in Russian; anything else is not for the customer's eyes
export function apiErrorMessage(err: any, fallback: string): string {
  const message = err?.response?.data?.error;
  if (typeof message === 'string' && /[а-яё]/i.test(message)) return message;
  if (err?.isAxiosError && !err.response) {
    return 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.';
  }
  return fallback;
}
