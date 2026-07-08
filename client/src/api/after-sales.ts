import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  AfterSales,
  AfterSalesImage,
  CreateAfterSalesRequest,
  PaginatedResponse,
} from '@shared/api.interface';

export async function createAfterSales(
  data: CreateAfterSalesRequest,
): Promise<AfterSales> {
  try {
    const res = await axiosForBackend({
      url: '/api/after-sales',
      method: 'POST',
      data,
    });
    return res.data as AfterSales;
  } catch (err) {
    logger.error('createAfterSales failed', err);
    throw err;
  }
}

export async function getAfterSalesList(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<PaginatedResponse<AfterSales & { images?: AfterSalesImage[] }>> {
  try {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.pageSize) search.set('pageSize', String(params.pageSize));
    if (params.status) search.set('status', params.status);
    const res = await axiosForBackend({
      url: `/api/after-sales?${search.toString()}`,
      method: 'GET',
    });
    return res.data as PaginatedResponse<AfterSales>;
  } catch (err) {
    logger.error('getAfterSalesList failed', err);
    throw err;
  }
}

export async function getAfterSalesDetail(id: string): Promise<AfterSales> {
  try {
    const res = await axiosForBackend({
      url: `/api/after-sales/${id}`,
      method: 'GET',
    });
    return res.data as AfterSales;
  } catch (err) {
    logger.error('getAfterSalesDetail failed', err);
    throw err;
  }
}

export async function submitReturnTracking(
  id: string,
  trackingNo: string,
  company: string,
): Promise<AfterSales> {
  try {
    const res = await axiosForBackend({
      url: `/api/after-sales/${id}/tracking`,
      method: 'PATCH',
      data: { trackingNo, company },
    });
    return res.data as AfterSales;
  } catch (err) {
    logger.error('submitReturnTracking failed', err);
    throw err;
  }
}
