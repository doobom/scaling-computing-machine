import { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Truck, Save, Zap, CheckCircle, AlertCircle } from 'lucide-react';
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
  getAdminSfExpressConfig,
  updateAdminSfExpressConfig,
  type SfExpressConfig,
} from '@client/src/api/payment';

const SfExpressSetting = () => {
  const { lang } = useLanguage();
  const [config, setConfig] = useState<SfExpressConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(
    null,
  );

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getAdminSfExpressConfig();
        setConfig(data);
      } catch (err) {
        logger.error(`Failed to fetch SF config: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await updateAdminSfExpressConfig(config);
      setConfig(updated);
    } catch (err) {
      logger.error(`Failed to save SF config: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) return;
    setTesting(true);
    setTestResult(null);
    try {
      // Simulate test connection
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Mock: success if API URL and key are not empty
      if (config.apiUrl && config.apiKey) {
        setTestResult('success');
      } else {
        setTestResult('failed');
      }
    } catch (err) {
      logger.error(`SF test connection failed: ${String(err)}`);
      setTestResult('failed');
    } finally {
      setTesting(false);
    }
  };

  const updateField = <K extends keyof SfExpressConfig>(
    key: K,
    value: SfExpressConfig[K],
  ) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
    setTestResult(null);
  };

  if (loading || !config) {
    return (
      <div className="text-muted-foreground text-sm">
        {lang === 'zh' ? '載入中...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(38_90%_50%)]/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-[hsl(38_90%_50%)]" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {lang === 'zh' ? '順豐速運配置' : 'SF Express Configuration'}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {lang === 'zh'
                    ? '順豐速運 API 對接設定'
                    : 'SF Express API configuration'}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => updateField('enabled', checked)}
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sf-monthly" className="text-xs">
              {lang === 'zh' ? '月結賬號' : 'Monthly Account'}
            </Label>
            <Input
              id="sf-monthly"
              value={config.monthlyAccount}
              onChange={(e) =>
                updateField('monthlyAccount', e.target.value)
              }
              disabled={!config.enabled}
              placeholder={lang === 'zh' ? '請輸入月結賬號' : 'Monthly account'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-customer" className="text-xs">
              {lang === 'zh' ? '客戶編碼' : 'Customer Code'}
            </Label>
            <Input
              id="sf-customer"
              value={config.customerCode}
              onChange={(e) => updateField('customerCode', e.target.value)}
              disabled={!config.enabled}
              placeholder={lang === 'zh' ? '請輸入客戶編碼' : 'Customer code'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-api-url" className="text-xs">
              {lang === 'zh' ? 'API 網址' : 'API URL'}
            </Label>
            <Input
              id="sf-api-url"
              value={config.apiUrl}
              onChange={(e) => updateField('apiUrl', e.target.value)}
              disabled={!config.enabled}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-api-key" className="text-xs">
              {lang === 'zh' ? 'API 金鑰' : 'API Key'}
            </Label>
            <Input
              id="sf-api-key"
              type="password"
              value={config.apiKey}
              onChange={(e) => updateField('apiKey', e.target.value)}
              disabled={!config.enabled}
              placeholder={lang === 'zh' ? '請輸入 API 金鑰' : 'API key'}
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between p-3 bg-background rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[hsl(38_90%_50%)]" />
              <span className="text-sm text-foreground">
                {lang === 'zh' ? '測試模式' : 'Test Mode'}
              </span>
              <span className="text-xs text-muted-foreground">
                {lang === 'zh'
                  ? '開啟後使用沙箱環境測試'
                  : 'Use sandbox environment when enabled'}
              </span>
            </div>
            <Switch
              checked={config.testMode}
              onCheckedChange={(checked) => updateField('testMode', checked)}
              disabled={!config.enabled}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing || !config.enabled}
            >
              {testing ? (
                <>
                  <span className="w-4 h-4 mr-2 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  {lang === 'zh' ? '測試中...' : 'Testing...'}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1.5" />
                  {lang === 'zh' ? '測試連接' : 'Test Connection'}
                </>
              )}
            </Button>
            {testResult === 'success' && (
              <span className="text-xs text-[hsl(160_55%_42%)] flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {lang === 'zh' ? '連接成功' : 'Connection successful'}
              </span>
            )}
            {testResult === 'failed' && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {lang === 'zh' ? '連接失敗' : 'Connection failed'}
              </span>
            )}
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {lang === 'zh' ? '儲存設定' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SfExpressSetting;
