import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, DollarSign, Percent, Users } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { useLanguage } from '@client/src/hooks/useLanguage';
import {
  getOverview,
  getSalesTrend,
  getPaymentMethods,
  getProductRanking,
  getConversionFunnel,
  type OverviewStats,
  type SalesTrendData,
  type PaymentMethodStat,
  type ProductRankingItem,
  type ConversionFunnelData,
} from '@client/src/api/statistics';
import StatCard from './StatCard';
import SalesTrendChart from './SalesTrendChart';
import PaymentPieChart from './PaymentPieChart';
import ProductRankingChart from './ProductRankingChart';
import ConversionFunnel from './ConversionFunnel';

type PeriodType = 'day' | 'week' | 'month' | 'year';

const Dashboard: React.FC = () => {
  const { lang, t } = useLanguage();
  const [period, setPeriod] = useState<PeriodType>('day');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodStat[]>([]);
  const [productRanking, setProductRanking] = useState<ProductRankingItem[]>([]);
  const [funnelData, setFunnelData] = useState<ConversionFunnelData | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, salesRes, paymentRes, rankingRes, funnelRes] = await Promise.all([
        getOverview(),
        getSalesTrend(period),
        getPaymentMethods(),
        getProductRanking(10),
        getConversionFunnel(),
      ]);
      setOverview(overviewRes);
      setSalesTrend(salesRes);
      setPaymentMethods(paymentRes);
      setProductRanking(rankingRes);
      setFunnelData(funnelRes);
    } catch (error) {
      logger.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periods: { value: PeriodType; labelZh: string; labelEn: string }[] = [
    { value: 'day', labelZh: '日', labelEn: 'Day' },
    { value: 'week', labelZh: '週', labelEn: 'Week' },
    { value: 'month', labelZh: '月', labelEn: 'Month' },
    { value: 'year', labelZh: '年', labelEn: 'Year' },
  ];

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `HK$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 10000) {
      return `HK$${(value / 10000).toFixed(2)}萬`;
    }
    return `HK$${value.toLocaleString()}`;
  };

  const formatNumber = (value: number): string => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(2)}萬`;
    }
    return value.toLocaleString();
  };

  if (loading && !overview) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with period toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {lang === 'zh' ? '數據看板' : 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'zh' ? '實時銷售與運營數據概覽' : 'Real-time sales & operations overview'}
          </p>
        </div>
        <div className="flex bg-muted rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                period === p.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {lang === 'zh' ? p.labelZh : p.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={lang === 'zh' ? '今日訂單量' : "Today's Orders"}
          value={formatNumber(overview?.todayOrders ?? 0)}
          growth={overview?.ordersGrowth ?? 0}
          icon={<ShoppingCart className="w-6 h-6 text-primary" />}
          iconBg="bg-primary/10"
        />
        <StatCard
          title={lang === 'zh' ? '今日銷售額' : "Today's Sales"}
          value={formatCurrency(overview?.todaySales ?? 0)}
          growth={overview?.salesGrowth ?? 0}
          icon={<DollarSign className="w-6 h-6 text-accent" />}
          iconBg="bg-accent/10"
        />
        <StatCard
          title={lang === 'zh' ? '轉化率' : 'Conversion Rate'}
          value={`${(overview?.conversionRate ?? 0).toFixed(2)}%`}
          growth={overview?.conversionGrowth ?? 0}
          icon={<Percent className="w-6 h-6 text-warning" />}
          iconBg="bg-warning/10"
        />
        <StatCard
          title={lang === 'zh' ? '今日訪問量' : "Today's Visits"}
          value={formatNumber(overview?.todayVisits ?? 0)}
          growth={overview?.visitsGrowth ?? 0}
          icon={<Users className="w-6 h-6 text-price" />}
          iconBg="bg-price/10"
        />
      </div>

      {/* Charts Row 1: Sales Trend + Payment Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold text-primary mb-4">
            {lang === 'zh' ? '銷售趨勢' : 'Sales Trend'}
          </h3>
          {salesTrend && <SalesTrendChart data={salesTrend} />}
        </div>
        <div className="bg-card rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold text-primary mb-4">
            {lang === 'zh' ? '支付方式分佈' : 'Payment Methods'}
          </h3>
          <PaymentPieChart data={paymentMethods} />
        </div>
      </div>

      {/* Charts Row 2: Product Ranking + Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold text-primary mb-4">
            {lang === 'zh' ? '商品銷量排行 TOP10' : 'Top 10 Products'}
          </h3>
          <ProductRankingChart data={productRanking} />
        </div>
        <div className="bg-card rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold text-primary mb-4">
            {lang === 'zh' ? '轉化漏斗' : 'Conversion Funnel'}
          </h3>
          {funnelData && <ConversionFunnel data={funnelData} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
