import { Heart, MapPin, Headphones, HelpCircle, Ticket } from 'lucide-react';
import { Card, CardContent } from '@client/src/components/ui/card';

interface QuickEntry {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  labelZh: string;
  labelEn: string;
  color: string;
}

const QUICK_ENTRIES: QuickEntry[] = [
  {
    key: 'favorites',
    icon: Heart,
    labelZh: '我的收藏',
    labelEn: 'Favorites',
    color: 'text-rose-500 bg-rose-50',
  },
  {
    key: 'address',
    icon: MapPin,
    labelZh: '收貨地址',
    labelEn: 'Addresses',
    color: 'text-blue-500 bg-blue-50',
  },
  {
    key: 'service',
    icon: Headphones,
    labelZh: '客服幫助',
    labelEn: 'Support',
    color: 'text-emerald-500 bg-emerald-50',
  },
  {
    key: 'coupons',
    icon: Ticket,
    labelZh: '我的優惠券',
    labelEn: 'My Coupons',
    color: 'text-accent bg-accent/10',
  },
  {
    key: 'faq',
    icon: HelpCircle,
    labelZh: '常見問題',
    labelEn: 'FAQ',
    color: 'text-amber-500 bg-amber-50',
  },
];

interface QuickEntryGridProps {
  lang: 'zh' | 'en';
  onSelect: (key: string) => void;
}

const QuickEntryGrid = ({ lang, onSelect }: QuickEntryGridProps) => {
  return (
    <Card className="border-0 shadow-sm" data-ai-section-type="card-menu">
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-4">
          {lang === 'zh' ? '快捷入口' : 'Quick Access'}
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {QUICK_ENTRIES.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.key}
                onClick={() => onSelect(entry.key)}
                className="flex flex-col items-center gap-2 py-4 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${entry.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-foreground">
                  {lang === 'zh' ? entry.labelZh : entry.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickEntryGrid;
