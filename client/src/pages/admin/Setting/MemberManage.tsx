import { useState } from 'react';
import { User, Crown } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import { useLanguage } from '@client/src/hooks/useLanguage';
import UserListTab from './UserListTab';
import LevelManageTab from './LevelManageTab';

type TabValue = 'users' | 'levels';

const MemberManage = () => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabValue>('users');

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as TabValue)}
    >
      <TabsList className="mb-6">
        <TabsTrigger value="users">
          <User className="w-4 h-4 mr-2" />
          {lang === 'zh' ? '用戶管理' : 'User Management'}
        </TabsTrigger>
        <TabsTrigger value="levels">
          <Crown className="w-4 h-4 mr-2" />
          {lang === 'zh' ? '會員等級' : 'Member Levels'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <UserListTab lang={lang} />
      </TabsContent>

      <TabsContent value="levels">
        <LevelManageTab lang={lang} />
      </TabsContent>
    </Tabs>
  );
};

export default MemberManage;
