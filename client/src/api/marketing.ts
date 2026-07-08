import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';

// ---------- Types ----------
export interface Banner {
  id: string;
  imageUrl: string;
  titleZh?: string;
  titleEn?: string;
  subtitleZh?: string;
  subtitleEn?: string;
  jumpUrl?: string;
  sort: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Discount {
  id: string;
  nameZh: string;
  nameEn: string;
  discountRate: string;
  startTime: string;
  endTime: string;
  applicableScope: string;
  applicableIds: string[];
  status: string;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  nameZh: string;
  nameEn: string;
  thresholdAmount: string;
  discountAmount: string;
  startTime: string;
  endTime: string;
  applicableScope: string;
  applicableIds: string[];
  allowStack: boolean;
  status: string;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountFormData {
  nameZh: string;
  nameEn: string;
  discountRate: string;
  startTime: string;
  endTime: string;
  applicableScope: string;
  applicableIds: string[];
  status: string;
  sort: number;
}

export interface PromotionFormData {
  nameZh: string;
  nameEn: string;
  thresholdAmount: string;
  discountAmount: string;
  startTime: string;
  endTime: string;
  applicableScope: string;
  applicableIds: string[];
  allowStack: boolean;
  status: string;
  sort: number;
}

export interface BannerFormData {
  imageUrl: string;
  titleZh?: string;
  titleEn?: string;
  subtitleZh?: string;
  subtitleEn?: string;
  jumpUrl?: string;
  sort: number;
  status: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------- Storefront APIs ----------

export async function getBanners(): Promise<Banner[]> {
  logger.info('getBanners (storefront)');
  const res = await axiosForBackend({
    url: '/api/banners',
    method: 'GET',
  });
  return (res.data?.items ?? res.data) as Banner[];
}

export async function getActiveDiscounts(): Promise<Discount[]> {
  logger.info('getActiveDiscounts (storefront)');
  const res = await axiosForBackend({
    url: '/api/discounts/active',
    method: 'GET',
  });
  return (res.data?.items ?? res.data) as Discount[];
}

// ---------- Admin Discount APIs ----------

export async function getAdminDiscountList(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}): Promise<PaginatedResponse<Discount>> {
  logger.info('getAdminDiscountList', { params });
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('pageSize', String(params.pageSize ?? 10));
  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.status) searchParams.set('status', params.status);
  const res = await axiosForBackend({
    url: `/api/admin/discounts?${searchParams.toString()}`,
    method: 'GET',
  });
  return res.data as PaginatedResponse<Discount>;
}

export async function getAdminDiscountDetail(id: string): Promise<Discount> {
  logger.info('getAdminDiscountDetail', { id });
  const res = await axiosForBackend({
    url: `/api/admin/discounts/${id}`,
    method: 'GET',
  });
  return res.data as Discount;
}

export async function createAdminDiscount(data: DiscountFormData): Promise<Discount> {
  logger.info('createAdminDiscount');
  const res = await axiosForBackend({
    url: '/api/admin/discounts',
    method: 'POST',
    data,
  });
  return res.data as Discount;
}

export async function updateAdminDiscount(
  id: string,
  data: DiscountFormData,
): Promise<Discount> {
  logger.info('updateAdminDiscount', { id });
  const res = await axiosForBackend({
    url: `/api/admin/discounts/${id}`,
    method: 'PUT',
    data,
  });
  return res.data as Discount;
}

export async function deleteAdminDiscount(id: string): Promise<void> {
  logger.info('deleteAdminDiscount', { id });
  await axiosForBackend({
    url: `/api/admin/discounts/${id}`,
    method: 'DELETE',
  });
}

export async function updateAdminDiscountStatus(
  id: string,
  status: string,
): Promise<Discount> {
  logger.info('updateAdminDiscountStatus', { id, status });
  const res = await axiosForBackend({
    url: `/api/admin/discounts/${id}/status`,
    method: 'PATCH',
    data: { status },
  });
  return res.data as Discount;
}

// ---------- Admin Promotion APIs ----------

export async function getAdminPromotionList(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}): Promise<PaginatedResponse<Promotion>> {
  logger.info('getAdminPromotionList', { params });
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('pageSize', String(params.pageSize ?? 10));
  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.status) searchParams.set('status', params.status);
  const res = await axiosForBackend({
    url: `/api/admin/promotions?${searchParams.toString()}`,
    method: 'GET',
  });
  return res.data as PaginatedResponse<Promotion>;
}

export async function getAdminPromotionDetail(id: string): Promise<Promotion> {
  logger.info('getAdminPromotionDetail', { id });
  const res = await axiosForBackend({
    url: `/api/admin/promotions/${id}`,
    method: 'GET',
  });
  return res.data as Promotion;
}

export async function createAdminPromotion(data: PromotionFormData): Promise<Promotion> {
  logger.info('createAdminPromotion');
  const res = await axiosForBackend({
    url: '/api/admin/promotions',
    method: 'POST',
    data,
  });
  return res.data as Promotion;
}

export async function updateAdminPromotion(
  id: string,
  data: PromotionFormData,
): Promise<Promotion> {
  logger.info('updateAdminPromotion', { id });
  const res = await axiosForBackend({
    url: `/api/admin/promotions/${id}`,
    method: 'PUT',
    data,
  });
  return res.data as Promotion;
}

export async function deleteAdminPromotion(id: string): Promise<void> {
  logger.info('deleteAdminPromotion', { id });
  await axiosForBackend({
    url: `/api/admin/promotions/${id}`,
    method: 'DELETE',
  });
}

export async function updateAdminPromotionStatus(
  id: string,
  status: string,
): Promise<Promotion> {
  logger.info('updateAdminPromotionStatus', { id, status });
  const res = await axiosForBackend({
    url: `/api/admin/promotions/${id}/status`,
    method: 'PATCH',
    data: { status },
  });
  return res.data as Promotion;
}

// ---------- Admin Banner APIs ----------

export async function getAdminBannerList(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<PaginatedResponse<Banner>> {
  logger.info('getAdminBannerList', { params });
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('pageSize', String(params.pageSize ?? 50));
  if (params.status) searchParams.set('status', params.status);
  const res = await axiosForBackend({
    url: `/api/admin/banners?${searchParams.toString()}`,
    method: 'GET',
  });
  return res.data as PaginatedResponse<Banner>;
}

export async function createAdminBanner(data: BannerFormData): Promise<Banner> {
  logger.info('createAdminBanner');
  const res = await axiosForBackend({
    url: '/api/admin/banners',
    method: 'POST',
    data,
  });
  return res.data as Banner;
}

export async function updateAdminBanner(
  id: string,
  data: BannerFormData,
): Promise<Banner> {
  logger.info('updateAdminBanner', { id });
  const res = await axiosForBackend({
    url: `/api/admin/banners/${id}`,
    method: 'PUT',
    data,
  });
  return res.data as Banner;
}

export async function deleteAdminBanner(id: string): Promise<void> {
  logger.info('deleteAdminBanner', { id });
  await axiosForBackend({
    url: `/api/admin/banners/${id}`,
    method: 'DELETE',
  });
}

export async function updateAdminBannerStatus(
  id: string,
  status: string,
): Promise<Banner> {
  logger.info('updateAdminBannerStatus', { id, status });
  const res = await axiosForBackend({
    url: `/api/admin/banners/${id}/status`,
    method: 'PATCH',
    data: { status },
  });
  return res.data as Banner;
}
