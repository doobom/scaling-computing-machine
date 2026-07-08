export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Category {
  id: string;
  parentId: string | null;
  nameZh: string;
  nameEn: string;
  iconUrl?: string;
  sort: number;
  status: string;
  children?: Category[];
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  sort: number;
  isMain: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  titleZh: string;
  titleEn: string;
  descZh?: string;
  descEn?: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  stockWarningThreshold: number;
  spec: Record<string, string[]>;
  status: string;
  tags: string[];
  salesCount: number;
  sort: number;
  mainImageUrl?: string;
  images?: ProductImage[];
  createdAt?: string;
}

export interface ProductListParams extends PaginationParams {
  keyword?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'sales' | 'newest';
  tag?: string;
  status?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productTitleZh: string;
  productTitleEn: string;
  productImageUrl: string;
  spec: Record<string, string>;
  quantity: number;
  price: number;
  subtotal: number;
  expireAt?: string;
}

export interface CartListResponse {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
}

export interface Address {
  id: string;
  userId: string;
  receiverName: string;
  receiverPhone: string;
  region: string;
  detailAddress: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitleZh: string;
  productTitleEn: string;
  productImageUrl?: string;
  spec: Record<string, string>;
  quantity: number;
  originalPrice: number;
  salePrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  addressId?: string;
  address?: Address;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  payAmount: number;
  paymentMethod?: string;
  paymentStatus: string;
  orderStatus: string;
  shippingNo?: string;
  shippingCompany?: string;
  remark?: string;
  expireTime?: string;
  paidAt?: string;
  shippedAt?: string;
  completedAt?: string;
  items?: OrderItem[];
  createdAt?: string;
}

export interface OrderListParams extends PaginationParams {
  orderNo?: string;
  status?: string;
  paymentStatus?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentNo?: string;
  amount: number;
  paymentMethod: string;
  transferVoucherUrl?: string;
  status: string;
  paidAt?: string;
  createdAt?: string;
}

export interface Discount {
  id: string;
  nameZh: string;
  nameEn: string;
  discountRate: number;
  startTime: string;
  endTime: string;
  applicableScope: string;
  applicableIds: string[];
  status: string;
  sort: number;
}

export interface Promotion {
  id: string;
  nameZh: string;
  nameEn: string;
  thresholdAmount: number;
  discountAmount: number;
  startTime: string;
  endTime: string;
  applicableScope: string;
  applicableIds: string[];
  allowStack: boolean;
  status: string;
  sort: number;
}

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
}

export interface MemberLevel {
  id: string;
  nameZh: string;
  nameEn: string;
  minConsumption: number;
  discountRate: number;
  iconUrl?: string;
  sort: number;
  status: string;
  freeShipping: boolean;
  freeShippingMin: number;
  hasVipService: boolean;
  birthdayCoupon: boolean;
}

export interface AfterSales {
  id: string;
  afterSalesNo: string;
  orderId: string;
  orderNo?: string;
  userId: string;
  type: 'refund_only' | 'return_refund';
  reason: string;
  description?: string;
  refundAmount: number;
  status: 'pending' | 'approved' | 'returning' | 'refunding' | 'completed' | 'rejected';
  returnTrackingNo?: string;
  returnCompany?: string;
  rejectReason?: string;
  auditTime?: string;
  refundTime?: string;
  images?: AfterSalesImage[];
  createdAt?: string;
}

export interface AfterSalesImage {
  id: string;
  afterSalesId: string;
  imageUrl: string;
  sort: number;
}

export interface AfterSalesListParams extends PaginationParams {
  status?: string;
  afterSalesNo?: string;
  orderNo?: string;
  userId?: string;
}

export interface CreateAfterSalesRequest {
  orderId: string;
  type: 'refund_only' | 'return_refund';
  reason: string;
  description?: string;
  refundAmount: number;
  images?: string[];
}

export interface Coupon {
  id: string;
  nameZh: string;
  nameEn: string;
  type: 'fixed' | 'percent' | 'shipping';
  discountValue: number;
  minAmount: number;
  applicableScope: 'all' | 'category' | 'product';
  applicableIds: string[];
  validType: 'fixed' | 'days';
  validDays?: number;
  startTime?: string;
  endTime?: string;
  totalQuantity: number;
  usedQuantity: number;
  perUserLimit: number;
  status: string;
  sort: number;
}

export interface UserCoupon {
  id: string;
  userId: string;
  couponId: string;
  coupon?: Coupon;
  status: 'unused' | 'used' | 'expired';
  usedOrderId?: string;
  usedTime?: string;
  expireTime?: string;
  createdAt?: string;
}

export interface CouponListParams extends PaginationParams {
  status?: string;
  type?: string;
  keyword?: string;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  orderId: string;
  orderNo?: string;
  userId: string;
  amount: number;
  paymentMethod?: string;
  issuedAt: string;
  items?: OrderItem[];
  order?: Order;
}

export interface User {
  id: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  memberLevelId?: string;
  memberLevel?: MemberLevel;
  totalConsumption: number;
  status: string;
  userId?: string;
}

export interface SystemSetting {
  id: string;
  configKey: string;
  configValue: Record<string, any>;
  description?: string;
}

export interface CheckoutSummary {
  items: CartItem[];
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  payAmount: number;
  promotions: Promotion[];
}

export interface CreateOrderItemInput {
  productId: string;
  spec: Record<string, string>;
  quantity: number;
  cartId?: string;
}

export interface CreateOrderRequest {
  addressId: string;
  paymentMethod: string;
  remark?: string;
  cartItemIds?: string[];
  items?: CreateOrderItemInput[];
}

export interface CreateOrderResponse {
  orderId: string;
  orderNo: string;
  payAmount: number;
}

export interface StatisticsOverview {
  todayOrders: number;
  todaySales: number;
  conversionRate: number;
  todayVisits: number;
  ordersGrowth: number;
  salesGrowth: number;
}

export interface SalesTrendItem {
  date: string;
  orders: number;
  sales: number;
}

export interface PaymentStatsItem {
  method: string;
  count: number;
  amount: number;
}

export interface ProductRankItem {
  id: string;
  titleZh: string;
  titleEn: string;
  sales: number;
  amount: number;
}
