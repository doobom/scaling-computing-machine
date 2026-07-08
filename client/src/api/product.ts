import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';

// ---------- Types ----------
export interface ProductImage {
  id?: string;
  imageUrl: string;
  sort: number;
  isMain: boolean;
}

export interface ProductSpec {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  categoryId: string;
  categoryNameZh?: string;
  categoryNameEn?: string;
  titleZh: string;
  titleEn: string;
  descZh?: string;
  descEn?: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  stockWarningThreshold: number;
  spec?: ProductSpec[];
  status: 'on_sale' | 'off_sale';
  tags?: string[];
  images?: ProductImage[];
  mainImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  keyword?: string;
  categoryId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductFormData {
  categoryId: string;
  titleZh: string;
  titleEn: string;
  descZh?: string;
  descEn?: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  stockWarningThreshold: number;
  spec?: ProductSpec[];
  status: 'on_sale' | 'off_sale';
  tags?: string[];
  images: ProductImage[];
}

export interface Category {
  id: string;
  parentId?: string;
  nameZh: string;
  nameEn: string;
  iconUrl?: string;
  sort: number;
  status: 'enabled' | 'disabled';
  children?: Category[];
}

export interface CategoryFormData {
  parentId?: string;
  nameZh: string;
  nameEn: string;
  iconUrl?: string;
  sort: number;
  status: 'enabled' | 'disabled';
}

// ---------- Product APIs ----------
export async function getProductList(
  params: ProductListParams,
): Promise<ProductListResponse> {
  logger.info('getProductList', { params });
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.status) searchParams.set('status', params.status);
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('pageSize', String(params.pageSize ?? 20));
  const res = await axiosForBackend({
    url: `/api/admin/products?${searchParams.toString()}`,
    method: 'GET',
  });
  return res.data as ProductListResponse;
}

export async function getProductDetail(id: string): Promise<Product> {
  logger.info('getProductDetail', { id });
  const res = await axiosForBackend({
    url: `/api/admin/products/${id}`,
    method: 'GET',
  });
  return res.data as Product;
}

export async function createProduct(data: ProductFormData): Promise<Product> {
  logger.info('createProduct');
  const res = await axiosForBackend({
    url: '/api/admin/products',
    method: 'POST',
    data,
  });
  return res.data as Product;
}

export async function updateProduct(
  id: string,
  data: ProductFormData,
): Promise<Product> {
  logger.info('updateProduct', { id });
  const res = await axiosForBackend({
    url: `/api/admin/products/${id}`,
    method: 'PUT',
    data,
  });
  return res.data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  logger.info('deleteProduct', { id });
  await axiosForBackend({
    url: `/api/admin/products/${id}`,
    method: 'DELETE',
  });
}

export async function updateProductStatus(
  id: string,
  status: 'on_sale' | 'off_sale',
): Promise<void> {
  logger.info('updateProductStatus', { id, status });
  await axiosForBackend({
    url: `/api/admin/products/${id}/status`,
    method: 'PATCH',
    data: { status },
  });
}

export async function batchUpdateProductStatus(
  ids: string[],
  status: string,
): Promise<void> {
  logger.info('batchUpdateProductStatus', { count: ids.length, status });
  await axiosForBackend({
    url: '/api/admin/products/batch-status',
    method: 'POST',
    data: { ids, status },
  });
}

export async function getLowStockProducts(): Promise<Product[]> {
  logger.info('getLowStockProducts');
  const res = await axiosForBackend({
    url: '/api/admin/products/low-stock',
    method: 'GET',
  });
  return (res.data?.items ?? res.data) as Product[];
}

// ---------- Category APIs ----------
export async function getCategoryList(): Promise<{ items: Category[] }> {
  logger.info('getCategoryList');
  const res = await axiosForBackend({
    url: '/api/admin/categories',
    method: 'GET',
  });
  return res.data as { items: Category[] };
}

export async function createCategory(data: CategoryFormData): Promise<Category> {
  logger.info('createCategory');
  const res = await axiosForBackend({
    url: '/api/admin/categories',
    method: 'POST',
    data,
  });
  return res.data as Category;
}

export async function updateCategory(
  id: string,
  data: CategoryFormData,
): Promise<Category> {
  logger.info('updateCategory', { id });
  const res = await axiosForBackend({
    url: `/api/admin/categories/${id}`,
    method: 'PUT',
    data,
  });
  return res.data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  logger.info('deleteCategory', { id });
  await axiosForBackend({
    url: `/api/admin/categories/${id}`,
    method: 'DELETE',
  });
}

export async function updateCategoryStatus(
  id: string,
  status: 'enabled' | 'disabled',
): Promise<void> {
  logger.info('updateCategoryStatus', { id, status });
  await axiosForBackend({
    url: `/api/admin/categories/${id}/status`,
    method: 'PATCH',
    data: { status },
  });
}

// ---------- Storefront APIs ----------

export interface StoreProductSearchParams {
  keyword?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'sales' | 'newest';
  tag?: string;
  page: number;
  pageSize: number;
}

export interface StoreProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getCategoryTree(): Promise<Category[]> {
  logger.info('getCategoryTree (storefront)');
  const res = await axiosForBackend({
    url: '/api/categories/tree',
    method: 'GET',
  });
  return res.data as Category[];
}

export async function searchProducts(
  params: StoreProductSearchParams,
): Promise<StoreProductListResponse> {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.minPrice !== undefined && params.minPrice !== null) {
    searchParams.set('minPrice', String(params.minPrice));
  }
  if (params.maxPrice !== undefined && params.maxPrice !== null) {
    searchParams.set('maxPrice', String(params.maxPrice));
  }
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.tag) searchParams.set('tag', params.tag);
  searchParams.set('page', String(params.page));
  searchParams.set('pageSize', String(params.pageSize));
  const query = searchParams.toString();
  logger.info(`searchProducts (storefront): ${query}`);
  const res = await axiosForBackend({
    url: `/api/products/search?${query}`,
    method: 'GET',
  });
  return res.data as StoreProductListResponse;
}

export async function getStoreProductDetail(id: string): Promise<Product> {
  logger.info('getStoreProductDetail', { id });
  const res = await axiosForBackend({
    url: `/api/products/${id}`,
    method: 'GET',
  });
  return res.data as Product;
}
