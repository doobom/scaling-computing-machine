import { useLanguage } from '@client/src/hooks/useLanguage';
import { Shield, Lock, Eye, Share2, Server, FileCheck, Mail } from 'lucide-react';

const sections = [
  {
    icon: Eye,
    titleZh: '我們收集的資訊',
    titleEn: 'Information We Collect',
    contentZh: [
      '當您在香港生活百貨註冊帳戶、購買商品或使用我們的服務時，我們可能會收集以下個人資料：',
      '• 基本資料：姓名、電郵地址、聯絡電話、送貨地址',
      '• 交易資料：訂單記錄、付款方式、購買歷史',
      '• 帳戶資料：用戶名稱、密碼、偏好設定',
      '• 技術資料：IP 位址、瀏覽器類型、裝置資訊、造訪紀錄',
      '• 通訊資料：您與我們的客戶服務團隊的對話內容',
      '我們只會收集為提供服務所必需的資料，絕不會收集與服務無關的敏感個人資料。',
    ],
    contentEn: [
      'When you register an account, purchase products, or use our services at Hong Kong Lifestyle Store, we may collect the following personal data:',
      '• Basic Information: name, email address, phone number, delivery address',
      '• Transaction Data: order records, payment methods, purchase history',
      '• Account Information: username, password, preferences',
      '• Technical Data: IP address, browser type, device information, visit records',
      '• Communication Data: content of your conversations with our customer service team',
      'We only collect data necessary for providing services and will never collect sensitive personal data unrelated to our services.',
    ],
  },
  {
    icon: FileCheck,
    titleZh: '資訊使用方式',
    titleEn: 'How We Use Information',
    contentZh: [
      '我們收集的個人資料將用於以下目的：',
      '• 處理及履行您的訂單、送貨及售後服務',
      '• 管理您的會員帳戶及提供會員優惠',
      '• 發送訂單確認、物流通知及重要服務公告',
      '• 回應您的查詢及投訴，提供客戶支援',
      '• 改善網站功能、個人化您的購物體驗',
      '• 進行數據分析以優化營運及服務品質',
      '• 遵守適用的法律法規要求',
      '我們承諾不會將您的個人資料用於未經您同意的營銷目的。',
    ],
    contentEn: [
      'The personal data we collect will be used for the following purposes:',
      '• Processing and fulfilling your orders, delivery, and after-sales service',
      '• Managing your membership account and providing member benefits',
      '• Sending order confirmations, shipping notifications, and important service announcements',
      '• Responding to your inquiries and complaints, providing customer support',
      '• Improving website functionality and personalizing your shopping experience',
      '• Conducting data analysis to optimize operations and service quality',
      '• Complying with applicable laws and regulations',
      'We promise not to use your personal data for marketing purposes without your consent.',
    ],
  },
  {
    icon: Share2,
    titleZh: '資訊共享與披露',
    titleEn: 'Information Sharing',
    contentZh: [
      '我們重視您的隱私，絕不會出售或出租您的個人資料。我們僅在以下情況下共享您的資料：',
      '• 服務供應商：與物流、支付、倉儲等服務提供商共享必要資料，以履行訂單',
      '• 法律要求：在法律規定或政府機關合法要求下披露資料',
      '• 業務轉讓：如涉及公司合併、收購或資產轉讓，您的資料可能隨之轉移',
      '• 您的同意：經您明確同意後的其他共享',
      '所有第三方服務供應商均受保密協議約束，僅可為提供特定服務使用您的資料。',
    ],
    contentEn: [
      'We value your privacy and will never sell or rent your personal data. We only share your information in the following circumstances:',
      '• Service Providers: sharing necessary data with logistics, payment, and warehousing service providers to fulfill orders',
      '• Legal Requirements: disclosing data when required by law or lawful requests from government authorities',
      '• Business Transfers: in the event of merger, acquisition, or asset transfer, your data may be transferred accordingly',
      '• Your Consent: other sharing with your explicit consent',
      'All third-party service providers are bound by confidentiality agreements and may only use your data for providing specific services.',
    ],
  },
  {
    icon: Lock,
    titleZh: '資料安全',
    titleEn: 'Data Security',
    contentZh: [
      '我們採取多層次的安全措施保護您的個人資料：',
      '• 技術措施：SSL 加密傳輸、防火牆、入侵偵測系統、定期安全掃描',
      '• 管理措施：員工保密訓練、權限分級管理、存取紀錄審計',
      '• 實體措施：機房門禁管制、24 小時監控、異地備份',
      '• 支付安全：所有支付交易均通過認證的支付閘道處理，我們不儲存完整的信用卡資料',
      '儘管我們盡力保護您的個人資料，但請注意網際網路傳輸無法保證 100% 安全。',
    ],
    contentEn: [
      'We adopt multi-level security measures to protect your personal data:',
      '• Technical Measures: SSL encrypted transmission, firewalls, intrusion detection systems, regular security scans',
      '• Administrative Measures: employee confidentiality training, hierarchical access management, access log auditing',
      '• Physical Measures: data center access control, 24-hour monitoring, off-site backup',
      '• Payment Security: all payment transactions are processed through certified payment gateways; we do not store complete credit card data',
      'Although we strive to protect your personal data, please note that internet transmission cannot guarantee 100% security.',
    ],
  },
  {
    icon: Shield,
    titleZh: '你的權利',
    titleEn: 'Your Rights',
    contentZh: [
      '根據《個人資料（私隱）條例》，您享有以下權利：',
      '• 查閱權：有權查閱我們持有關於您的個人資料',
      '• 更正權：有權要求更正不准確或不完整的個人資料',
      '• 刪除權：在特定情況下有權要求刪除您的個人資料',
      '• 反對權：有權反對我們基於直接促銷目的使用您的資料',
      '• 撤回同意：有權隨時撤回先前給予的同意',
      '• 資料可攜權：有權獲取您的個人資料副本',
      '如需行使上述權利，請透過下方聯絡方式與我們聯繫。我們會在合理時間內回應您的請求。',
    ],
    contentEn: [
      'Under the Personal Data (Privacy) Ordinance, you have the following rights:',
      '• Right of Access: you have the right to access personal data we hold about you',
      '• Right of Correction: you have the right to request correction of inaccurate or incomplete personal data',
      '• Right of Erasure: you have the right to request deletion of your personal data under certain circumstances',
      '• Right to Object: you have the right to object to our use of your data for direct marketing purposes',
      '• Right to Withdraw Consent: you have the right to withdraw previously given consent at any time',
      '• Right to Data Portability: you have the right to obtain a copy of your personal data',
      'To exercise the above rights, please contact us using the information below. We will respond to your request within a reasonable time.',
    ],
  },
  {
    icon: Mail,
    titleZh: '聯絡我們',
    titleEn: 'Contact Us',
    contentZh: [
      '如您對本隱私政策有任何疑問、意見或投訴，或希望行使您的個人資料權利，請透過以下方式聯絡我們的資料保障主任：',
      '• 電郵：privacy@hklifestore.hk',
      '• 電話：+852 2345 6789',
      '• 地址：香港九龍旺角彌敦道 123 號生活廣場 5 樓',
      '• 辦公時間：星期一至日 9:00 - 21:00',
      '我們會在收到您的請求後 30 個工作日內回覆。',
      '本隱私政策最後更新日期：2024 年 1 月 1 日。我們可能會不時更新本政策，更新版本將於網站公佈。',
    ],
    contentEn: [
      'If you have any questions, comments, or complaints about this Privacy Policy, or wish to exercise your personal data rights, please contact our Data Protection Officer at:',
      '• Email: privacy@hklifestore.hk',
      '• Phone: +852 2345 6789',
      '• Address: 5/F, Lifestyle Plaza, 123 Nathan Road, Mong Kok, KLN, Hong Kong',
      '• Office Hours: Monday to Sunday 9:00 - 21:00',
      'We will respond within 30 working days of receiving your request.',
      'This Privacy Policy was last updated on 1 January 2024. We may update this policy from time to time, and the updated version will be published on the website.',
    ],
  },
];

const PrivacyPolicy = () => {
  const { lang } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {lang === 'zh' ? '隱私政策' : 'Privacy Policy'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {lang === 'zh'
            ? '我們重視您的隱私，並遵守《個人資料（私隱）條例》'
            : 'We value your privacy and comply with the Personal Data (Privacy) Ordinance'}
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div
              key={index}
              className="bg-card rounded-lg border border-border p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground mb-3">
                    {lang === 'zh' ? section.titleZh : section.titleEn}
                  </h2>
                  <div className="space-y-2 text-muted-foreground text-sm leading-relaxed">
                    {(lang === 'zh' ? section.contentZh : section.contentEn).map(
                      (paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        <p>
          {lang === 'zh'
            ? '© 2024 香港生活百貨有限公司 版權所有'
            : '© 2024 Hong Kong Lifestyle Store Limited. All rights reserved.'}
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
