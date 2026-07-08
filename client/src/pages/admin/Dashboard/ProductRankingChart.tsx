import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { ProductRankingItem } from '@client/src/api/statistics';

interface ProductRankingChartProps {
  data: ProductRankingItem[];
}

const COLORS = ['#0f2b4d', '#1a3f6e', '#25538f', '#2fa57a', '#3db88a',
  '#4acb9a', '#f5a623', '#f7b74a', '#7c3aed', '#8b5cf6'];

const ProductRankingChart: React.FC<ProductRankingChartProps> = ({ data }) => {
  const { lang } = useLanguage();

  const option: EChartsOption = useMemo(() => {
    const names = data.map((item: ProductRankingItem) =>
      lang === 'zh' ? item.productNameZh : item.productNameEn,
    );
    const quantities = data.map((item: ProductRankingItem) => item.quantity);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: TopLevelFormatterParams) => {
          const list = Array.isArray(params) ? params : [params];
          const p = list[0];
          if (!p) return '';
          const item = data[p.dataIndex as number];
          if (!item) return '';
          const name = lang === 'zh' ? item.productNameZh : item.productNameEn;
          return `<div class="font-medium mb-1">${name}</div>
            <div>${lang === 'zh' ? '銷量' : 'Sales'}: ${item.quantity.toLocaleString()}</div>
            <div>${lang === 'zh' ? '銷售額' : 'Revenue'}: HK$${item.salesAmount.toLocaleString()}</div>`;
        },
      },
      grid: {
        left: '3%',
        right: '8%',
        bottom: '3%',
        top: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: names.reverse(),
        axisLabel: {
          fontSize: 11,
          formatter: (value: string) => {
            if (value.length > 12) return value.slice(0, 12) + '...';
            return value;
          },
        },
      },
      series: [
        {
          name: lang === 'zh' ? '銷量' : 'Sales Qty',
          type: 'bar',
          data: quantities.reverse().map((val: number, idx: number) => ({
            value: val,
            itemStyle: {
              color: COLORS[Math.min(idx, COLORS.length - 1)],
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barMaxWidth: 20,
          label: {
            show: true,
            position: 'right',
            fontSize: 11,
            formatter: (params: CallbackDataParams) =>
              Number(params.value).toLocaleString(),
          },
        },
      ],
    };
  }, [data, lang]);

  return <ReactECharts option={option} theme="ud" className="w-full h-[380px]" />;
};

export default ProductRankingChart;
