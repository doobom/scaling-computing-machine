import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import { useLanguage } from '@client/src/hooks/useLanguage';
import DiscountTab from './DiscountTab';
import PromotionTab from './PromotionTab';
import BannerTab from './BannerTab';

type TabValue = 'discount' | 'promotion' | 'banner';

const MarketingManage = () => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabValue>('discount');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t('admin.marketingManagement')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === 'zh'
            ? '管理折扣、滿減活動與輪播圖'
            : 'Manage discounts, promotions and banners'}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="discount">
            {lang === 'zh' ? '折扣活動' : 'Discounts'}
          </TabsTrigger>
          <TabsTrigger value="promotion">
            {lang === 'zh' ? '滿減活動' : 'Promotions'}
          </TabsTrigger>
          <TabsTrigger value="banner">
            {lang === 'zh' ? '輪播圖' : 'Banners'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discount">
          <DiscountTab />
        </TabsContent>
        <TabsContent value="promotion">
          <PromotionTab />
        </TabsContent>
        <TabsContent value="banner">
          <BannerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingManage;
