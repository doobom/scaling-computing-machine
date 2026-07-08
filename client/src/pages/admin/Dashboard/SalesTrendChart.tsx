import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { TopLevelFormatterParams } from 'echarts/types/dist/shared';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { SalesTrendData } from '@client/src/api/statistics';

interface SalesTrendChartProps {
  data: SalesTrendData;
}

const COLORS = {
  primary: '#0f2b4d',
  accent: '#2fa57a',
  warning: '#f5a623',
};

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
  const { lang, t } = useLanguage();

  const option: EChartsOption = useMemo(() => {
    const salesLabel = lang === 'zh' ? '銷售額' : 'Sales';
    const ordersLabel = lang === 'zh' ? '訂單數' : 'Orders';
    const hkdLabel = lang === 'zh' ? '港幣' : 'HKD';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: TopLevelFormatterParams) => {
          const list = Array.isArray(params) ? params : [params];
          let html = `<div class="font-medium mb-1">${list[0]?.name ?? ''}</div>`;
          for (const p of list) {
            const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`;
            if (p.seriesName === salesLabel) {
              html += `<div>${marker}${p.seriesName}: HK$${Number(p.value).toLocaleString()}</div>`;
            } else {
              html += `<div>${marker}${p.seriesName}: ${Number(p.value).toLocaleString()}</div>`;
            }
          }
          return html;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '18%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.dates,
        boundaryGap: true,
        axisLabel: {
          fontSize: 11,
          interval: data.dates.length > 10 ? Math.floor(data.dates.length / 8) : 0,
          rotate: data.dates.length > 10 ? 30 : 0,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: hkdLabel,
          nameTextStyle: { fontSize: 11 },
          axisLabel: {
            fontSize: 11,
            formatter: (value: number) => {
              if (value >= 10000) return (value / 10000).toFixed(1) + 'w';
              return value.toString();
            },
          },
        },
        {
          type: 'value',
          name: ordersLabel,
          nameTextStyle: { fontSize: 11 },
          axisLabel: { fontSize: 11 },
        },
      ],
      series: [
        {
          name: salesLabel,
          type: 'bar',
          yAxisIndex: 0,
          data: data.sales,
          itemStyle: {
            color: COLORS.primary,
            borderRadius: [4, 4, 0, 0],
          },
          barMaxWidth: 32,
        },
        {
          name: ordersLabel,
          type: 'line',
          yAxisIndex: 1,
          data: data.orders,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: COLORS.accent,
          },
          itemStyle: { color: COLORS.accent },
        },
      ],
    };
  }, [data, lang, t]);

  return <ReactECharts option={option} theme="ud" className="w-full h-[340px]" />;
};

export default SalesTrendChart;
