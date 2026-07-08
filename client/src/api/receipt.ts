import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { Receipt, PaginatedResponse } from '@shared/api.interface';

export async function getReceiptByOrder(orderId: string): Promise<Receipt & { items: import('@shared/api.interface').OrderItem[]; order?: import('@shared/api.interface').Order }> {
  try {
    const res = await axiosForBackend({
      url: `/api/receipts/order/${orderId}`,
      method: 'GET',
    });
    return res.data as Receipt & { items: import('@shared/api.interface').OrderItem[]; order?: import('@shared/api.interface').Order };
  } catch (err) {
    logger.error('getReceiptByOrder failed', err);
    throw err;
  }
}

export async function getReceiptList(
  page = 1,
  pageSize = 10,
): Promise<PaginatedResponse<Receipt>> {
  try {
    const search = new URLSearchParams();
    search.set('page', String(page));
    search.set('pageSize', String(pageSize));
    const res = await axiosForBackend({
      url: `/api/receipts?${search.toString()}`,
      method: 'GET',
    });
    return res.data as PaginatedResponse<Receipt>;
  } catch (err) {
    logger.error('getReceiptList failed', err);
    throw err;
  }
}
