import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  CartListResponse,
  Address,
  Order,
  PaginatedResponse,
  CreateOrderResponse,
  OrderListParams,
} from '@shared/api.interface';

// ========== Cart ==========
export async function getCart(): Promise<CartListResponse> {
  try {
    const res = await axiosForBackend({ url: '/api/carts', method: 'GET' });
    return res.data as CartListResponse;
  } catch (err) {
    logger.error('getCart failed', err);
    throw err;
  }
}

export async function addToCart(
  productId: string,
  spec: Record<string, string> = {},
  quantity = 1,
): Promise<void> {
  try {
    await axiosForBackend({
      url: '/api/carts',
      method: 'POST',
      data: { productId, spec, quantity },
    });
  } catch (err) {
    logger.error('addToCart failed', err);
    throw err;
  }
}

export async function updateCartItem(id: string, quantity: number): Promise<void> {
  try {
    await axiosForBackend({
      url: `/api/carts/${id}`,
      method: 'PUT',
      data: { quantity },
    });
  } catch (err) {
    logger.error('updateCartItem failed', err);
    throw err;
  }
}

export async function removeCartItem(id: string): Promise<void> {
  try {
    await axiosForBackend({ url: `/api/carts/${id}`, method: 'DELETE' });
  } catch (err) {
    logger.error('removeCartItem failed', err);
    throw err;
  }
}

export async function clearCart(): Promise<void> {
  try {
    await axiosForBackend({ url: '/api/carts/clear', method: 'DELETE' });
  } catch (err) {
    logger.error('clearCart failed', err);
    throw err;
  }
}

// ========== Address ==========
export async function getAddresses(): Promise<Address[]> {
  try {
    const res = await axiosForBackend({ url: '/api/addresses', method: 'GET' });
    return res.data as Address[];
  } catch (err) {
    logger.error('getAddresses failed', err);
    throw err;
  }
}

export async function createAddress(data: Omit<Address, 'id' | 'userId' | 'isDefault'> & { isDefault?: boolean }): Promise<Address> {
  try {
    const res = await axiosForBackend({
      url: '/api/addresses',
      method: 'POST',
      data,
    });
    return res.data as Address;
  } catch (err) {
    logger.error('createAddress failed', err);
    throw err;
  }
}

export async function updateAddress(id: string, data: Partial<Omit<Address, 'id' | 'userId'>>): Promise<Address> {
  try {
    const res = await axiosForBackend({
      url: `/api/addresses/${id}`,
      method: 'PUT',
      data,
    });
    return res.data as Address;
  } catch (err) {
    logger.error('updateAddress failed', err);
    throw err;
  }
}

export async function deleteAddress(id: string): Promise<void> {
  try {
    await axiosForBackend({ url: `/api/addresses/${id}`, method: 'DELETE' });
  } catch (err) {
    logger.error('deleteAddress failed', err);
    throw err;
  }
}

export async function setDefaultAddress(id: string): Promise<Address> {
  try {
    const res = await axiosForBackend({
      url: `/api/addresses/${id}/default`,
      method: 'PATCH',
    });
    return res.data as Address;
  } catch (err) {
    logger.error('setDefaultAddress failed', err);
    throw err;
  }
}

// ========== Order (Front) ==========
export async function createOrder(data: {
  items: Array<{ cartId?: string; productId: string; spec: Record<string, string>; quantity: number }>;
  addressId: string;
  paymentMethod: string;
  remark?: string;
}): Promise<CreateOrderResponse> {
  try {
    const res = await axiosForBackend({
      url: '/api/orders',
      method: 'POST',
      data,
    });
    return res.data as CreateOrderResponse;
  } catch (err) {
    logger.error('createOrder failed', err);
    throw err;
  }
}

export async function getOrders(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Order>> {
  try {
    const search = new URLSearchParams();
    if (params.status) search.set('status', params.status);
    if (params.page) search.set('page', String(params.page));
    if (params.pageSize) search.set('pageSize', String(params.pageSize));
    const res = await axiosForBackend({
      url: `/api/orders?${search.toString()}`,
      method: 'GET',
    });
    return res.data as PaginatedResponse<Order>;
  } catch (err) {
    logger.error('getOrders failed', err);
    throw err;
  }
}

export async function getOrderDetail(id: string): Promise<Order> {
  try {
    const res = await axiosForBackend({ url: `/api/orders/${id}`, method: 'GET' });
    return res.data as Order;
  } catch (err) {
    logger.error('getOrderDetail failed', err);
    throw err;
  }
}

export async function cancelOrder(id: string): Promise<void> {
  try {
    await axiosForBackend({ url: `/api/orders/${id}/cancel`, method: 'POST' });
  } catch (err) {
    logger.error('cancelOrder failed', err);
    throw err;
  }
}

// ========== Admin Order ==========
export async function getAdminOrders(params: OrderListParams): Promise<PaginatedResponse<Order>> {
  try {
    const search = new URLSearchParams();
    if (params.orderNo) search.set('orderNo', params.orderNo);
    if (params.status) search.set('status', params.status);
    if (params.userId) search.set('userId', params.userId);
    if (params.startDate) search.set('startDate', params.startDate);
    if (params.endDate) search.set('endDate', params.endDate);
    search.set('page', String(params.page || 1));
    search.set('pageSize', String(params.pageSize || 10));
    const res = await axiosForBackend({
      url: `/api/admin/orders?${search.toString()}`,
      method: 'GET',
    });
    return res.data as PaginatedResponse<Order>;
  } catch (err) {
    logger.error('getAdminOrders failed', err);
    throw err;
  }
}

export async function getAdminOrderDetail(id: string): Promise<Order> {
  try {
    const res = await axiosForBackend({ url: `/api/admin/orders/${id}`, method: 'GET' });
    return res.data as Order;
  } catch (err) {
    logger.error('getAdminOrderDetail failed', err);
    throw err;
  }
}

export async function shipOrder(id: string, shippingNo: string, shippingCompany: string): Promise<void> {
  try {
    await axiosForBackend({
      url: `/api/admin/orders/${id}/ship`,
      method: 'PATCH',
      data: { shippingNo, shippingCompany },
    });
  } catch (err) {
    logger.error('shipOrder failed', err);
    throw err;
  }
}

export async function updateOrderPrice(id: string, payAmount: number): Promise<void> {
  try {
    await axiosForBackend({
      url: `/api/admin/orders/${id}/price`,
      method: 'PATCH',
      data: { payAmount },
    });
  } catch (err) {
    logger.error('updateOrderPrice failed', err);
    throw err;
  }
}

export async function adminCancelOrder(id: string): Promise<void> {
  try {
    await axiosForBackend({ url: `/api/admin/orders/${id}/cancel`, method: 'PATCH' });
  } catch (err) {
    logger.error('adminCancelOrder failed', err);
    throw err;
  }
}

export async function updateOrderRemark(id: string, remark: string): Promise<void> {
  try {
    await axiosForBackend({
      url: `/api/admin/orders/${id}/remark`,
      method: 'PATCH',
      data: { remark },
    });
  } catch (err) {
    logger.error('updateOrderRemark failed', err);
    throw err;
  }
}
