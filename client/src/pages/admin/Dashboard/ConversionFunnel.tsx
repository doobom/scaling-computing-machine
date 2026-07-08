import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { TopLevelFormatterParams } from 'echarts/types/dist/shared';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { ConversionFunnelData } from '@client/src/api/statistics';

interface ConversionFunnelProps {
  data: ConversionFunnelData;
}

const COLORS = ['#0f2b4d', '#1a3f6e', '#2fa57a', '#f5a623', '#d6342a'];

const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ data }) => {
  const { lang } = useLanguage();

  const option: EChartsOption = useMemo(() => {
    const stages = [
      { key: 'visits', zh: '訪問量', en: 'Visits', value: data.visits },
      { key: 'productViews', zh: '商品瀏覽', en: 'Product Views', value: data.productViews },
      { key: 'cartAdds', zh: '加入購物車', en: 'Add to Cart', value: data.cartAdds },
      { key: 'orders', zh: '下單', en: 'Orders', value: data.orders },
      { key: 'paidOrders', zh: '支付成功', en: 'Paid Orders', value: data.paidOrders },
    ];

    const funnelData = stages.map((stage, index) => ({
      value: stage.value,
      name: lang === 'zh' ? stage.zh : stage.en,
      itemStyle: { color: COLORS[index % COLORS.length] },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: TopLevelFormatterParams) => {
          const p = Array.isArray(params) ? params[0] : params;
          if (!p) return '';
          const stage = stages[p.dataIndex as number];
          if (!stage) return '';
          const stageRate = data.visits > 0
            ? ((stage.value / data.visits) * 100).toFixed(2)
            : '0.00';
          const prevValue = p.dataIndex > 0 ? stages[p.dataIndex - 1].value : stage.value;
          const stepRate = prevValue > 0
            ? ((stage.value / prevValue) * 100).toFixed(2)
            : '100.00';
          return `<div class="font-medium">${p.name}</div>
            <div>${lang === 'zh' ? '人數' : 'Users'}: ${stage.value.toLocaleString()}</div>
            <div>${lang === 'zh' ? '整體轉化率' : 'Overall Rate'}: ${stageRate}%</div>
            <div>${lang === 'zh' ? '環節轉化率' : 'Step Rate'}: ${stepRate}%</div>`;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { fontSize: 12 },
      },
      series: [
        {
          name: lang === 'zh' ? '轉化漏斗' : 'Conversion Funnel',
          type: 'funnel',
          left: '10%',
          top: '5%',
          bottom: '15%',
          width: '80%',
          min: 0,
          max: data.visits,
          minSize: '20%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            fontSize: 12,
            formatter: (params: any) => {
              const val = Number(params.value) || 0;
              const rate = data.visits > 0
                ? ((val / data.visits) * 100).toFixed(1)
                : '0.0';
              return `${params.name}\n${val.toLocaleString()} (${rate}%)`;
            },
          },
          labelLine: { show: false },
          data: funnelData,
        },
      ],
    };
  }, [data, lang]);

  return <ReactECharts option={option} theme="ud" className="w-full h-[380px]" />;
};

export default ConversionFunnel;
