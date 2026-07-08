import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import { useLanguage } from '@client/src/hooks/useLanguage';
import PaymentSetting from './PaymentSetting';
import ShippingSetting from './ShippingSetting';
import MemberManage from './MemberManage';
import SfExpressSetting from './SfExpressSetting';

type TabValue = 'payment' | 'shipping' | 'member' | 'sf-express';

const SettingPage = () => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabValue>('payment');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {lang === 'zh' ? '系統設定' : 'Settings'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === 'zh'
            ? '管理支付方式與物流運費設定'
            : 'Manage payment methods and shipping settings'}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="payment">
            {lang === 'zh' ? '支付設定' : 'Payment'}
          </TabsTrigger>
          <TabsTrigger value="shipping">
            {lang === 'zh' ? '物流設定' : 'Shipping'}
          </TabsTrigger>
          <TabsTrigger value="member">
            {lang === 'zh' ? '會員管理' : 'Members'}
          </TabsTrigger>
          <TabsTrigger value="sf-express">
            {lang === 'zh' ? '順豐配置' : 'SF Express'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment">
          <PaymentSetting />
        </TabsContent>
        <TabsContent value="shipping">
          <ShippingSetting />
        </TabsContent>
        <TabsContent value="member">
          <MemberManage />
        </TabsContent>
        <TabsContent value="sf-express">
          <SfExpressSetting />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingPage;
