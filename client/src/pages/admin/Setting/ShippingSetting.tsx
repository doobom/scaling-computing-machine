import { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Truck, Plus, Trash2, Save, Package } from 'lucide-react';
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
import { Textarea } from '@client/src/components/ui/textarea';
import { useLanguage } from '@client/src/hooks/useLanguage';
import {
  getAdminShippingSettings,
  updateAdminShippingSettings,
  type ShippingTemplate,
  type ShippingRule,
} from '@client/src/api/payment';

const ShippingSetting = () => {
  const { lang } = useLanguage();
  const [template, setTemplate] = useState<ShippingTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getAdminShippingSettings();
        setTemplate(data);
      } catch (err) {
        logger.error(`Failed to fetch shipping settings: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    try {
      const updated = await updateAdminShippingSettings(template);
      setTemplate(updated);
    } catch (err) {
      logger.error(`Failed to save shipping settings: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof ShippingTemplate>(
    key: K,
    value: ShippingTemplate[K],
  ) => {
    setTemplate((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateRule = (
    index: number,
    field: keyof ShippingRule,
    value: string | number,
  ) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const newRules = [...prev.rules];
      newRules[index] = {
        ...newRules[index],
        [field]: field === 'region' ? String(value) : Number(value),
      };
      return { ...prev, rules: newRules };
    });
  };

  const addRule = () => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const newRule: ShippingRule = {
        id: `rule-${Date.now()}`,
        region: '',
        minWeight: 0,
        maxWeight: 5,
        fee: 30,
      };
      return { ...prev, rules: [...prev.rules, newRule] };
    });
  };

  const removeRule = (index: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const newRules = prev.rules.filter((_, i) => i !== index);
      return { ...prev, rules: newRules };
    });
  };

  if (loading || !template) {
    return (
      <div className="text-muted-foreground text-sm">
        {lang === 'zh' ? '載入中...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Template */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {lang === 'zh' ? '運費模板設定' : 'Shipping Template'}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {lang === 'zh'
                  ? '設定基本運費與免運費門檻'
                  : 'Configure base shipping fee and free shipping threshold'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="base-fee" className="text-xs">
              {lang === 'zh' ? '基礎運費 (HK$)' : 'Base Fee (HK$)'}
            </Label>
            <Input
              id="base-fee"
              type="number"
              value={template.baseFee}
              onChange={(e) => updateField('baseFee', Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="free-threshold" className="text-xs">
              {lang === 'zh'
                ? '免運費門檻 (HK$)'
                : 'Free Shipping Threshold (HK$)'}
            </Label>
            <Input
              id="free-threshold"
              type="number"
              value={template.freeShippingThreshold}
              onChange={(e) =>
                updateField('freeShippingThreshold', Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description" className="text-xs">
              {lang === 'zh' ? '運費說明' : 'Shipping Description'}
            </Label>
            <Textarea
              id="description"
              value={template.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder={
                lang === 'zh'
                  ? '例如：滿 299 免運費，否則收取 HK$30 運費'
                  : 'e.g. Free shipping over HK$299, otherwise HK$30'
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Rules */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-[hsl(160_55%_42%)]" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {lang === 'zh' ? '運費規則' : 'Shipping Rules'}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {lang === 'zh'
                    ? '按地區與重量設定運費'
                    : 'Set shipping fees by region and weight'}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={addRule}>
              <Plus className="w-4 h-4 mr-1" />
              {lang === 'zh' ? '新增規則' : 'Add Rule'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {template.rules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {lang === 'zh' ? '尚無運費規則' : 'No shipping rules yet'}
            </div>
          )}
          {template.rules.map((rule, index) => (
            <div
              key={rule.id}
              className="grid grid-cols-12 gap-3 items-end p-3 bg-background rounded-lg border border-border"
            >
              <div className="col-span-4 space-y-1.5">
                <Label className="text-xs">
                  {lang === 'zh' ? '地區' : 'Region'}
                </Label>
                <Input
                  value={rule.region}
                  onChange={(e) => updateRule(index, 'region', e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">
                  {lang === 'zh' ? '最小重量' : 'Min (kg)'}
                </Label>
                <Input
                  type="number"
                  value={rule.minWeight}
                  onChange={(e) =>
                    updateRule(index, 'minWeight', e.target.value)
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">
                  {lang === 'zh' ? '最大重量' : 'Max (kg)'}
                </Label>
                <Input
                  type="number"
                  value={rule.maxWeight}
                  onChange={(e) =>
                    updateRule(index, 'maxWeight', e.target.value)
                  }
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">
                  {lang === 'zh' ? '運費 (HK$)' : 'Fee (HK$)'}
                </Label>
                <Input
                  type="number"
                  value={rule.fee}
                  onChange={(e) => updateRule(index, 'fee', e.target.value)}
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRule(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="default" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {lang === 'zh' ? '儲存設定' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default ShippingSetting;
