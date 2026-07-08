import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  growth: number;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, growth, icon, iconBg }) => {
  const isPositive = growth >= 0;

  return (
    <div className="bg-card rounded-lg shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">{title}</p>
        <p className="text-2xl font-bold text-primary mt-1 font-mono">{value}</p>
        <div className={`flex items-center gap-1 text-xs mt-1 ${isPositive ? 'text-accent' : 'text-price'}`}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{isPositive ? '+' : ''}{growth.toFixed(2)}%</span>
          <span className="text-muted-foreground ml-1">較昨日</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
