import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { TopLevelFormatterParams } from 'echarts/types/dist/shared';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { PaymentMethodStat } from '@client/src/api/statistics';

interface PaymentPieChartProps {
  data: PaymentMethodStat[];
}

const COLORS = ['#0f2b4d', '#2fa57a', '#d6342a', '#f5a623', '#7c3aed'];

const methodNameMap: Record<string, { zh: string; en: string }> = {
  fps: { zh: '轉數快 FPS', en: 'FPS' },
  payme: { zh: 'PayMe', en: 'PayMe' },
  alipay: { zh: '支付寶', en: 'Alipay' },
  wechat: { zh: '微信支付', en: 'WeChat Pay' },
  credit_card: { zh: '信用卡', en: 'Credit Card' },
  bank_transfer: { zh: '銀行轉賬', en: 'Bank Transfer' },
  cod: { zh: '貨到付款', en: 'Cash on Delivery' },
};

const PaymentPieChart: React.FC<PaymentPieChartProps> = ({ data }) => {
  const { lang } = useLanguage();

  const option: EChartsOption = useMemo(() => {
    const pieData = data.map((item: PaymentMethodStat, index: number) => ({
      value: item.amount,
      name: methodNameMap[item.method]?.[lang] ?? item.method,
      itemStyle: { color: COLORS[index % COLORS.length] },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: TopLevelFormatterParams) => {
          const p = Array.isArray(params) ? params[0] : params;
          if (!p) return '';
          const item = data[p.dataIndex as number];
          if (!item) return '';
          const name = methodNameMap[item.method]?.[lang] ?? item.method;
          return `<div class="font-medium">${name}</div>
            <div>${lang === 'zh' ? '金額' : 'Amount'}: HK$${item.amount.toLocaleString()}</div>
            <div>${lang === 'zh' ? '筆數' : 'Count'}: ${item.count.toLocaleString()}</div>
            <div>${lang === 'zh' ? '佔比' : 'Share'}: ${item.percentage.toFixed(2)}%</div>`;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { fontSize: 12 },
      },
      series: [
        {
          name: lang === 'zh' ? '支付方式' : 'Payment Methods',
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: { label: { show: false } },
          data: pieData,
        },
      ],
    };
  }, [data, lang]);

  return <ReactECharts option={option} theme="ud" className="w-full h-[340px]" />;
};

export default PaymentPieChart;
