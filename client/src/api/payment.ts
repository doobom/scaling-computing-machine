import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';

// ---- Types ----

export interface PaymentInfo {
  id: string;
  orderId: string;
  orderNo: string;
  paymentNo: string | null;
  amount: string;
  paymentMethod: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  transferVoucherUrl: string | null;
  paidAt: string | null;
  createdAt?: string;
}

export interface PaymentMethodConfig {
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface PaymentMethodsConfig {
  [key: string]: PaymentMethodConfig;
}

export interface PaymentListResponse {
  items: PaymentInfo[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ShippingRule {
  id: string;
  region: string;
  minWeight: number;
  maxWeight: number;
  fee: number;
}

export interface ShippingTemplate {
  freeShippingThreshold: number;
  baseFee: number;
  description: string;
  rules: ShippingRule[];
}

export interface SfExpressConfig {
  enabled: boolean;
  monthlyAccount: string;
  customerCode: string;
  apiKey: string;
  apiUrl: string;
  testMode: boolean;
}

// ---- Frontend Payment APIs ----

/** Get payment status for an order */
export async function getPaymentByOrder(
  orderId: string,
): Promise<PaymentInfo> {
  logger.info(`getPaymentByOrder: ${orderId}`);
  const res = await axiosForBackend({
    url: `/api/payments/order/${orderId}`,
    method: 'GET',
  });
  return res.data as PaymentInfo;
}

/** Upload bank transfer voucher */
export async function uploadVoucher(
  orderId: string,
  transferVoucherUrl: string,
): Promise<PaymentInfo> {
  logger.info(`uploadVoucher: ${orderId}`);
  const res = await axiosForBackend({
    url: `/api/payments/${orderId}/voucher`,
    method: 'POST',
    data: { transferVoucherUrl },
  });
  return res.data as PaymentInfo;
}

/** Retry payment */
export async function retryPayment(orderId: string): Promise<PaymentInfo> {
  logger.info(`retryPayment: ${orderId}`);
  const res = await axiosForBackend({
    url: `/api/payments/${orderId}/retry`,
    method: 'POST',
  });
  return res.data as PaymentInfo;
}

/** Get available payment methods */
export async function getPaymentMethods(): Promise<
  { key: string; enabled: boolean; config: Record<string, unknown> }[]
> {
  logger.info('getPaymentMethods');
  const res = await axiosForBackend({
    url: '/api/payments/methods',
    method: 'GET',
  });
  return res.data as {
    key: string;
    enabled: boolean;
    config: Record<string, unknown>;
  }[];
}

// ---- Admin Payment Settings APIs ----

export async function getAdminPaymentSettings(): Promise<PaymentMethodsConfig> {
  logger.info('getAdminPaymentSettings');
  const res = await axiosForBackend({
    url: '/api/admin/payment-settings',
    method: 'GET',
  });
  return res.data as PaymentMethodsConfig;
}

export async function updateAdminPaymentSettings(
  data: PaymentMethodsConfig,
): Promise<PaymentMethodsConfig> {
  logger.info('updateAdminPaymentSettings');
  const res = await axiosForBackend({
    url: '/api/admin/payment-settings',
    method: 'PUT',
    data,
  });
  return res.data as PaymentMethodsConfig;
}

// ---- Admin Payment Records APIs ----

export async function getAdminPaymentRecords(params: {
  page: number;
  pageSize: number;
  paymentMethod?: string;
  status?: string;
}): Promise<PaymentListResponse> {
  logger.info(`getAdminPaymentRecords: page=${params.page}`);
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  searchParams.set('pageSize', String(params.pageSize));
  if (params.paymentMethod) {
    searchParams.set('paymentMethod', params.paymentMethod);
  }
  if (params.status) {
    searchParams.set('status', params.status);
  }
  const res = await axiosForBackend({
    url: `/api/admin/payments?${searchParams.toString()}`,
    method: 'GET',
  });
  return res.data as PaymentListResponse;
}

export async function getAdminPaymentRecord(id: string): Promise<PaymentInfo> {
  logger.info(`getAdminPaymentRecord: ${id}`);
  const res = await axiosForBackend({
    url: `/api/admin/payments/${id}`,
    method: 'GET',
  });
  return res.data as PaymentInfo;
}

// ---- Admin Shipping Settings APIs ----

export async function getAdminShippingSettings(): Promise<ShippingTemplate> {
  logger.info('getAdminShippingSettings');
  const res = await axiosForBackend({
    url: '/api/admin/shipping-settings',
    method: 'GET',
  });
  return res.data as ShippingTemplate;
}

export async function updateAdminShippingSettings(
  data: Partial<ShippingTemplate>,
): Promise<ShippingTemplate> {
  logger.info('updateAdminShippingSettings');
  const res = await axiosForBackend({
    url: '/api/admin/shipping-settings',
    method: 'PUT',
    data,
  });
  return res.data as ShippingTemplate;
}

// ---- Admin SF Express APIs ----

export async function getAdminSfExpressConfig(): Promise<SfExpressConfig> {
  logger.info('getAdminSfExpressConfig');
  const res = await axiosForBackend({
    url: '/api/admin/shipping-settings/sf-express',
    method: 'GET',
  });
  return res.data as SfExpressConfig;
}

export async function updateAdminSfExpressConfig(
  data: Partial<SfExpressConfig>,
): Promise<SfExpressConfig> {
  logger.info('updateAdminSfExpressConfig');
  const res = await axiosForBackend({
    url: '/api/admin/shipping-settings/sf-express',
    method: 'PUT',
    data,
  });
  return res.data as SfExpressConfig;
}
