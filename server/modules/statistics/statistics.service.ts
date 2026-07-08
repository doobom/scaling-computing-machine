import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { and, eq, gte, lt, sql, desc, sum, count } from 'drizzle-orm';
import { appOrder, orderItem, product, payment, cart } from '@server/database/schema';

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

type PeriodType = 'day' | 'week' | 'month' | 'year';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getOverview(): Promise<OverviewStats> {
    const today = this.getStartOfDay(new Date());
    const yesterday = this.getStartOfDay(this.addDays(today, -1));
    const dayAfterYesterday = this.getStartOfDay(this.addDays(today, -2));

    const [todayStats, yesterdayStats] = await Promise.all([
      this.getDayStats(today, yesterday),
      this.getDayStats(yesterday, dayAfterYesterday),
    ]);

    const calcGrowth = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(2));
    };

    return {
      todayOrders: todayStats.orders,
      todaySales: todayStats.sales,
      conversionRate: todayStats.conversionRate,
      todayVisits: todayStats.visits,
      ordersGrowth: calcGrowth(todayStats.orders, yesterdayStats.orders),
      salesGrowth: calcGrowth(todayStats.sales, yesterdayStats.sales),
      conversionGrowth: calcGrowth(todayStats.conversionRate, yesterdayStats.conversionRate),
      visitsGrowth: calcGrowth(todayStats.visits, yesterdayStats.visits),
    };
  }

  private async getDayStats(start: Date, end: Date): Promise<{
    orders: number;
    sales: number;
    conversionRate: number;
    visits: number;
  }> {
    const [ordersResult, salesResult, cartResult] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(appOrder)
        .where(and(gte(appOrder.createdAt, start), lt(appOrder.createdAt, end))),
      this.db
        .select({ total: sum(appOrder.payAmount) })
        .from(appOrder)
        .where(and(
          gte(appOrder.createdAt, start),
          lt(appOrder.createdAt, end),
          eq(appOrder.paymentStatus, 'paid'),
        )),
      this.db
        .select({ count: count() })
        .from(cart)
        .where(and(gte(cart.createdAt, start), lt(cart.createdAt, end))),
    ]);

    const orders = Number(ordersResult[0]?.count ?? 0);
    const sales = Number(salesResult[0]?.total ?? 0);
    const cartAdds = Number(cartResult[0]?.count ?? 0);
    // 模拟访问量：订单量 * 系数
    const visits = Math.round(orders * 15 + cartAdds * 3);
    const conversionRate = visits > 0 ? Number(((orders / visits) * 100).toFixed(2)) : 0;

    return { orders, sales, conversionRate, visits };
  }

  async getSalesTrend(
    period: PeriodType,
    startDate?: string,
    endDate?: string,
  ): Promise<SalesTrendData> {
    const { dates, start, end, dateTruncExpr, dateFormat } = this.getDateRange(
      period,
      startDate,
      endDate,
    );

    const results = await this.db
      .select({
        date: sql<string>`${dateTruncExpr}`.as('date'),
        sales: sum(appOrder.payAmount),
        orders: count(),
      })
      .from(appOrder)
      .where(and(
        gte(appOrder.createdAt, start),
        lt(appOrder.createdAt, end),
        eq(appOrder.paymentStatus, 'paid'),
      ))
      .groupBy(sql`date`)
      .orderBy(sql`date`);

    const salesMap = new Map<string, number>();
    const ordersMap = new Map<string, number>();

    for (const row of results) {
      const key = this.formatDateKey(row.date, dateFormat);
      salesMap.set(key, Number(row.sales ?? 0));
      ordersMap.set(key, Number(row.orders ?? 0));
    }

    return {
      dates,
      sales: dates.map((d: string) => salesMap.get(d) ?? 0),
      orders: dates.map((d: string) => ordersMap.get(d) ?? 0),
    };
  }

  async getPaymentMethods(): Promise<PaymentMethodStat[]> {
    const results = await this.db
      .select({
        method: payment.paymentMethod,
        count: count(),
        amount: sum(payment.amount),
      })
      .from(payment)
      .where(eq(payment.status, 'success'))
      .groupBy(payment.paymentMethod)
      .orderBy(desc(sql`amount`));

    const totalAmount = results.reduce(
      (sum: number, row: { amount: string | number | null }) => sum + Number(row.amount ?? 0),
      0,
    );

    return results.map((row: { method: string; count: string | number; amount: string | number | null }) => ({
      method: row.method,
      count: Number(row.count),
      amount: Number(row.amount ?? 0),
      percentage: totalAmount > 0 ? Number(((Number(row.amount ?? 0) / totalAmount) * 100).toFixed(2)) : 0,
    }));
  }

  async getProductRanking(limit = 10, categoryId?: string): Promise<ProductRankingItem[]> {
    const conditions = [eq(appOrder.paymentStatus, 'paid')];
    if (categoryId) {
      conditions.push(eq(product.categoryId, categoryId));
    }

    const results = await this.db
      .select({
        productId: orderItem.productId,
        productNameZh: product.titleZh,
        productNameEn: product.titleEn,
        quantity: sum(orderItem.quantity),
        salesAmount: sum(orderItem.subtotal),
      })
      .from(orderItem)
      .innerJoin(product, eq(orderItem.productId, product.id))
      .innerJoin(appOrder, eq(orderItem.orderId, appOrder.id))
      .where(and(...conditions))
      .groupBy(orderItem.productId, product.titleZh, product.titleEn)
      .orderBy(desc(sql`quantity`))
      .limit(limit);

    return results.map((row: {
      productId: string;
      productNameZh: string;
      productNameEn: string;
      quantity: string | number;
      salesAmount: string | number;
    }) => ({
      productId: row.productId,
      productNameZh: row.productNameZh,
      productNameEn: row.productNameEn,
      quantity: Number(row.quantity ?? 0),
      salesAmount: Number(row.salesAmount ?? 0),
    }));
  }

  async getConversionFunnel(): Promise<ConversionFunnelData> {
    const thirtyDaysAgo = this.addDays(new Date(), -30);

    const [ordersResult, paidResult, cartResult] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(appOrder)
        .where(gte(appOrder.createdAt, thirtyDaysAgo)),
      this.db
        .select({ count: count() })
        .from(appOrder)
        .where(and(
          gte(appOrder.createdAt, thirtyDaysAgo),
          eq(appOrder.paymentStatus, 'paid'),
        )),
      this.db
        .select({ count: count() })
        .from(cart)
        .where(gte(cart.createdAt, thirtyDaysAgo)),
    ]);

    const orders = Number(ordersResult[0]?.count ?? 0);
    const paidOrders = Number(paidResult[0]?.count ?? 0);
    const cartAdds = Number(cartResult[0]?.count ?? 0);
    // 模拟浏览量和访问量
    const productViews = Math.round(cartAdds * 4 + orders * 2);
    const visits = Math.round(productViews * 2.5);
    const conversionRate = visits > 0 ? Number(((paidOrders / visits) * 100).toFixed(2)) : 0;

    return {
      visits,
      productViews,
      cartAdds,
      orders,
      paidOrders,
      conversionRate,
    };
  }

  private getDateRange(period: PeriodType, startDate?: string, endDate?: string): {
    dates: string[];
    start: Date;
    end: Date;
    dateTruncExpr: ReturnType<typeof sql>;
    dateFormat: 'day' | 'week' | 'month';
  } {
    const dates: string[] = [];
    let start: Date;
    let end: Date;
    let dateTruncExpr: ReturnType<typeof sql>;
    let dateFormat: 'day' | 'week' | 'month' = 'day';

    const now = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end = this.addDays(end, 1);
    } else {
      end = this.addDays(this.getStartOfDay(now), 1);

      switch (period) {
        case 'day':
          start = this.addDays(end, -7);
          break;
        case 'week':
          start = this.addDays(end, -28);
          break;
        case 'month':
          start = this.addMonths(end, -6);
          break;
        case 'year':
          start = this.addMonths(end, -12);
          break;
        default:
          start = this.addDays(end, -7);
      }
    }

    if (period === 'day') {
      dateTruncExpr = sql`DATE(${appOrder.createdAt})::text`;
      dateFormat = 'day';
      let current = new Date(start);
      while (current < end) {
        dates.push(current.toISOString().split('T')[0]);
        current = this.addDays(current, 1);
      }
    } else if (period === 'week') {
      dateTruncExpr = sql`DATE_TRUNC('week', ${appOrder.createdAt})::date::text`;
      dateFormat = 'week';
      // 返回最近4周（周一为起始）
      for (let i = 3; i >= 0; i--) {
        const weekEnd = this.addDays(this.getStartOfWeek(now), -i * 7);
        const weekStart = this.addDays(weekEnd, -6);
        dates.push(
          `${weekStart.toISOString().split('T')[0].slice(5)} ~ ${weekEnd.toISOString().split('T')[0].slice(5)}`,
        );
      }
    } else {
      // month / year 都按月聚合
      dateTruncExpr = sql`DATE_TRUNC('month', ${appOrder.createdAt})::date::text`;
      dateFormat = 'month';
      const count = period === 'year' ? 12 : 6;
      for (let i = count - 1; i >= 0; i--) {
        const d = this.addMonths(now, -i);
        dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    }

    return { dates, start, end, dateTruncExpr, dateFormat };
  }

  private formatDateKey(dbDate: string, format: 'day' | 'week' | 'month'): string {
    if (format === 'day') {
      return dbDate;
    }
    if (format === 'week') {
      // dbDate 是周一的日期，计算周日日期，返回 "MM-DD ~ MM-DD" 格式
      const weekStart = new Date(dbDate);
      const weekEnd = this.addDays(weekStart, 6);
      return `${weekStart.toISOString().split('T')[0].slice(5)} ~ ${weekEnd.toISOString().split('T')[0].slice(5)}`;
    }
    // month
    const d = new Date(dbDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private getStartOfWeek(date: Date): Date {
    const d = this.getStartOfDay(date);
    const day = d.getDay();
    // 周一为一周开始
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }
}
