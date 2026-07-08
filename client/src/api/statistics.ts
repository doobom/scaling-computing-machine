import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';

export interface OverviewStats {
  todayOrders: number;
  todaySales: number;
  conversionRate: number;
  todayVisits: number;
  ordersGrowth: number;
  salesGrowth: number;
  conversionGrowth: number;
  visitsGrowth: number;
}

export interface SalesTrendData {
  dates: string[];
  sales: number[];
  orders: number[];
}

export interface PaymentMethodStat {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface ProductRankingItem {
  productId: string;
  productNameZh: string;
  productNameEn: string;
  quantity: number;
  salesAmount: number;
}

export interface ConversionFunnelData {
  visits: number;
  productViews: number;
  cartAdds: number;
  orders: number;
  paidOrders: number;
  conversionRate: number;
}

export async function getOverview(): Promise<OverviewStats> {
  try {
    const res = await axiosForBackend({
      url: '/api/admin/statistics/overview',
      method: 'GET',
    });
    return res.data as OverviewStats;
  } catch (error) {
    logger.error('Failed to fetch overview statistics', error);
    throw error;
  }
}

export async function getSalesTrend(
  period: 'day' | 'week' | 'month' | 'year',
  startDate?: string,
  endDate?: string,
): Promise<SalesTrendData> {
  try {
    const params: Record<string, string> = { period };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await axiosForBackend({
      url: '/api/admin/statistics/sales-trend',
      method: 'GET',
      params,
    });
    return res.data as SalesTrendData;
  } catch (error) {
    logger.error('Failed to fetch sales trend', error);
    throw error;
  }
}

export async function getPaymentMethods(): Promise<PaymentMethodStat[]> {
  try {
    const res = await axiosForBackend({
      url: '/api/admin/statistics/payment-methods',
      method: 'GET',
    });
    return res.data as PaymentMethodStat[];
  } catch (error) {
    logger.error('Failed to fetch payment methods', error);
    throw error;
  }
}

export async function getProductRanking(
  limit = 10,
  categoryId?: string,
): Promise<ProductRankingItem[]> {
  try {
    const params: Record<string, string | number> = { limit };
    if (categoryId) params.categoryId = categoryId;
    const res = await axiosForBackend({
      url: '/api/admin/statistics/product-ranking',
      method: 'GET',
      params,
    });
    return res.data as ProductRankingItem[];
  } catch (error) {
    logger.error('Failed to fetch product ranking', error);
    throw error;
  }
}

export async function getConversionFunnel(): Promise<ConversionFunnelData> {
  try {
    const res = await axiosForBackend({
      url: '/api/admin/statistics/conversion-funnel',
      method: 'GET',
    });
    return res.data as ConversionFunnelData;
  } catch (error) {
    logger.error('Failed to fetch conversion funnel', error);
    throw error;
  }
}
