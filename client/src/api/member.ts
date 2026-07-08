import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';

// ========== Types ==========

export interface MemberLevel {
  id: string;
  nameZh: string;
  nameEn: string;
  minConsumption: string;
  discountRate: string;
  iconUrl: string | null;
  sort?: number;
  status?: string;
}

export interface MemberProfile {
  id: string;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  totalConsumption: string;
  status: string;
  memberLevel: MemberLevel | null;
  nextLevel: {
    id: string;
    nameZh: string;
    nameEn: string;
    minConsumption: string;
  } | null;
  upgradeProgress: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitleZh: string;
  productTitleEn: string;
  productImageUrl: string | null;
  quantity: number;
  originalPrice: string;
  salePrice: string;
  subtotal: string;
}

export interface OrderDetail {
  id: string;
  orderNo: string;
  userId: string;
  totalAmount: string;
  discountAmount: string;
  shippingFee: string;
  payAmount: string;
  paymentStatus: string;
  paymentMethod: string | null;
  orderStatus: string;
  shippingNo: string | null;
  shippingCompany: string | null;
  remark: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  items: OrderItem[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FavoriteItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    titleZh: string;
    titleEn: string;
    salePrice: string;
    originalPrice: string;
    imageUrl: string | null;
  } | null;
}

export interface AdminMember {
  id: string;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  memberLevelId: string | null;
  totalConsumption: string;
  status: string;
  userId: string | null;
  createdAt: string;
  memberLevel: MemberLevel | null;
}

// ========== API Functions ==========

export async function getMemberProfile(): Promise<MemberProfile> {
  logger.info('[member] get profile');
  const res = await axiosForBackend({
    url: '/api/member/profile',
    method: 'GET',
  });
  return res.data;
}

export async function updateMemberProfile(data: {
  nickname?: string;
  phone?: string;
  email?: string;
}): Promise<MemberProfile> {
  logger.info('[member] update profile');
  const res = await axiosForBackend({
    url: '/api/member/profile',
    method: 'PUT',
    data,
  });
  return res.data;
}

export async function getMemberOrders(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<PaginatedResult<OrderDetail>> {
  logger.info('[member] get orders');
  const { page = 1, pageSize = 10, status } = params;
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (status) query.set('status', status);
  const res = await axiosForBackend({
    url: `/api/member/orders?${query.toString()}`,
    method: 'GET',
  });
  return res.data;
}

export async function getMemberOrderDetail(id: string): Promise<OrderDetail> {
  logger.info(`[member] get order detail: ${id}`);
  const res = await axiosForBackend({
    url: `/api/member/orders/${id}`,
    method: 'GET',
  });
  return res.data;
}

export async function getFavorites(params: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<FavoriteItem>> {
  logger.info('[member] get favorites');
  const { page = 1, pageSize = 12 } = params;
  const res = await axiosForBackend({
    url: `/api/member/favorites?page=${page}&pageSize=${pageSize}`,
    method: 'GET',
  });
  return res.data;
}

export async function addFavorite(productId: string): Promise<void> {
  logger.info(`[member] add favorite: ${productId}`);
  await axiosForBackend({
    url: `/api/member/favorites/${productId}`,
    method: 'POST',
  });
}

export async function removeFavorite(productId: string): Promise<void> {
  logger.info(`[member] remove favorite: ${productId}`);
  await axiosForBackend({
    url: `/api/member/favorites/${productId}`,
    method: 'DELETE',
  });
}

// ========== Admin APIs ==========

export async function getAdminMembers(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}): Promise<PaginatedResult<AdminMember>> {
  logger.info('[admin] get members');
  const { page = 1, pageSize = 10, keyword, status } = params;
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (keyword) query.set('keyword', keyword);
  if (status) query.set('status', status);
  const res = await axiosForBackend({
    url: `/api/admin/users?${query.toString()}`,
    method: 'GET',
  });
  return res.data;
}

export async function getAdminMemberDetail(id: string): Promise<{
  user: AdminMember;
  memberLevel: MemberLevel | null;
  orderCount: number;
  orderTotal: string;
}> {
  logger.info(`[admin] get member detail: ${id}`);
  const res = await axiosForBackend({
    url: `/api/admin/users/${id}`,
    method: 'GET',
  });
  return res.data;
}

export async function updateMemberStatus(id: string, status: string): Promise<void> {
  logger.info(`[admin] update member status: ${id} -> ${status}`);
  await axiosForBackend({
    url: `/api/admin/users/${id}/status`,
    method: 'PATCH',
    data: { status },
  });
}

export async function updateMemberLevel(id: string, memberLevelId: string): Promise<void> {
  logger.info(`[admin] update member level: ${id} -> ${memberLevelId}`);
  await axiosForBackend({
    url: `/api/admin/users/${id}/level`,
    method: 'PATCH',
    data: { memberLevelId },
  });
}

export async function getMemberLevels(): Promise<MemberLevel[]> {
  logger.info('[admin] get member levels');
  const res = await axiosForBackend({
    url: '/api/admin/member-levels',
    method: 'GET',
  });
  return res.data;
}

export async function createMemberLevel(data: {
  nameZh: string;
  nameEn: string;
  minConsumption: string;
  discountRate: string;
  iconUrl?: string;
  sort?: number;
}): Promise<MemberLevel> {
  logger.info('[admin] create member level');
  const res = await axiosForBackend({
    url: '/api/admin/member-levels',
    method: 'POST',
    data,
  });
  return res.data;
}

export async function updateMemberLevelInfo(id: string, data: {
  nameZh?: string;
  nameEn?: string;
  minConsumption?: string;
  discountRate?: string;
  iconUrl?: string;
  sort?: number;
  status?: string;
}): Promise<MemberLevel> {
  logger.info(`[admin] update member level: ${id}`);
  const res = await axiosForBackend({
    url: `/api/admin/member-levels/${id}`,
    method: 'PUT',
    data,
  });
  return res.data;
}

export async function deleteMemberLevel(id: string): Promise<void> {
  logger.info(`[admin] delete member level: ${id}`);
  await axiosForBackend({
    url: `/api/admin/member-levels/${id}`,
    method: 'DELETE',
  });
}
