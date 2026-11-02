import api from '../api/client';

// These requests wait for YooKassa and the bots on the server side, so they get more than the default timeout
export const SLOW_REQUEST_TIMEOUT = 30000;

// A link kept for too long may have expired at YooKassa; asking the server again returns a valid one
const PAYMENT_LINK_TTL = 10 * 60 * 1000;

export interface PaymentLink {
  url: string;
  at: number;
}

// Passed from Checkout to Orders when navigating after a new order
export interface PlacedOrderState {
  placedOrderId: number;
  link?: PaymentLink;
  paymentError?: string;
}

export const PAYMENT_ERROR_FALLBACK = 'Не удалось создать платёж. Попробуйте ещё раз или позвоните нам.';

export async function createPaymentLink(orderId: number): Promise<PaymentLink> {
  const { data } = await api.post(
    '/payment/create',
    { orderId, returnUrl: `${window.location.origin}/paid?order=${orderId}` },
    { timeout: SLOW_REQUEST_TIMEOUT },
  );
  if (!data?.confirmationUrl) throw new Error('Payment has no confirmation URL');
  return { url: data.confirmationUrl, at: Date.now() };
}

export const isLinkFresh = (link?: PaymentLink) => !!link && Date.now() - link.at < PAYMENT_LINK_TTL;
