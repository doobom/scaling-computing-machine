import { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  Save,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Switch } from '@client/src/components/ui/switch';
import { useLanguage } from '@client/src/hooks/useLanguage';
import {
  getAdminPaymentSettings,
  updateAdminPaymentSettings,
  type PaymentMethodsConfig,
} from '@client/src/api/payment';

interface PaymentMethodMeta {
  key: string;
  icon: typeof CreditCard;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  fields: {
    key: string;
    labelZh: string;
    labelEn: string;
    placeholder?: string;
  }[];
}

const PAYMENT_METHODS: PaymentMethodMeta[] = [
  {
    key: 'fps',
    icon: CreditCard,
    titleZh: '轉數快 FPS',
    titleEn: 'FPS',
    descZh: '香港快速支付系統，即時轉賬',
    descEn: 'Faster Payment System, instant transfer',
    fields: [
      { key: 'merchantId', labelZh: '商戶編號', labelEn: 'Merchant ID' },
      { key: 'fpsId', labelZh: 'FPS 識別碼', labelEn: 'FPS ID' },
      { key: 'accountName', labelZh: '戶口名稱', labelEn: 'Account Name' },
    ],
  },
  {
    key: 'payme',
    icon: Wallet,
    titleZh: 'PayMe',
    titleEn: 'PayMe',
    descZh: '滙豐 PayMe 電子錢包支付',
    descEn: 'HSBC PayMe e-wallet payment',
    fields: [
      { key: 'merchantId', labelZh: '商戶編號', labelEn: 'Merchant ID' },
      { key: 'paymeLink', labelZh: 'PayMe 連結', labelEn: 'PayMe Link' },
    ],
  },
  {
    key: 'bank_transfer',
    icon: Building2,
    titleZh: '銀行轉賬',
    titleEn: 'Bank Transfer',
    descZh: '顧客轉賬後上傳憑證，人工核實',
    descEn: 'Customer uploads voucher, manual verification',
    fields: [
      { key: 'bankName', labelZh: '收款銀行', labelEn: 'Bank Name' },
      { key: 'bankCode', labelZh: '銀行編碼', labelEn: 'Bank Code' },
      { key: 'accountNumber', labelZh: '賬號', labelEn: 'Account Number' },
      { key: 'accountName', labelZh: '戶口名稱', labelEn: 'Account Name' },
    ],
  },
  {
    key: 'alipay_hk',
    icon: Smartphone,
    titleZh: '支付寶香港',
    titleEn: 'AlipayHK',
    descZh: '支付寶香港電子錢包支付',
    descEn: 'AlipayHK e-wallet payment',
    fields: [
      { key: 'merchantId', labelZh: '商戶編號', labelEn: 'Merchant ID' },
      { key: 'appId', labelZh: 'App ID', labelEn: 'App ID' },
    ],
  },
];

const PaymentSetting = () => {
  const { lang } = useLanguage();
  const [settings, setSettings] = useState<PaymentMethodsConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getAdminPaymentSettings();
        setSettings(data);
        // Expand all enabled methods by default
        const initialExpanded: Record<string, boolean> = {};
        for (const method of PAYMENT_METHODS) {
          if (data[method.key]?.enabled) {
            initialExpanded[method.key] = true;
          }
        }
        setExpanded(initialExpanded);
      } catch (err) {
        logger.error(`Failed to fetch payment settings: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (methodKey: string, enabled: boolean) => {
    setSettings((prev) => {
      const current = prev[methodKey];
      return {
        ...prev,
        [methodKey]: {
          enabled,
          config: current?.config ?? {},
        },
      };
    });
    if (enabled) {
      setExpanded((prev) => ({ ...prev, [methodKey]: true }));
    }
  };

  const handleConfigChange = (
    methodKey: string,
    fieldKey: string,
    value: string,
  ) => {
    setSettings((prev) => {
      const current = prev[methodKey];
      if (!current) return prev;
      return {
        ...prev,
        [methodKey]: {
          ...current,
          config: { ...current.config, [fieldKey]: value },
        },
      };
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updated = await updateAdminPaymentSettings(settings);
      setSettings(updated);
    } catch (err) {
      logger.error(`Failed to save payment settings: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (methodKey: string) => {
    setExpanded((prev) => ({ ...prev, [methodKey]: !prev[methodKey] }));
  };

  if (loading) {
    return (
      <div className="text-muted-foreground text-sm">
        {lang === 'zh' ? '載入中...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {PAYMENT_METHODS.map((method) => {
          const setting = settings[method.key];
          const enabled = setting?.enabled ?? false;
          const Icon = method.icon;
          const isExpanded = expanded[method.key] ?? false;

          return (
            <Card key={method.key} className="border-border">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpand(method.key)}
                    className="flex items-center gap-3 text-left flex-1"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">
                        {lang === 'zh' ? method.titleZh : method.titleEn}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5 truncate">
                        {lang === 'zh' ? method.descZh : method.descEn}
                      </CardDescription>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      handleToggle(method.key, checked)
                    }
                    className="ml-3 shrink-0"
                  />
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4 pt-0">
                  {method.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label
                        htmlFor={`${method.key}-${field.key}`}
                        className="text-xs"
                      >
                        {lang === 'zh' ? field.labelZh : field.labelEn}
                      </Label>
                      <Input
                        id={`${method.key}-${field.key}`}
                        value={String(setting?.config?.[field.key] ?? '')}
                        onChange={(e) =>
                          handleConfigChange(
                            method.key,
                            field.key,
                            e.target.value,
                          )
                        }
                        disabled={!enabled}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="default" onClick={handleSaveAll} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving
            ? lang === 'zh'
              ? '儲存中...'
              : 'Saving...'
            : lang === 'zh'
              ? '儲存所有設定'
              : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};

export default PaymentSetting;
