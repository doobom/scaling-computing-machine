import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Label } from '@client/src/components/ui/label';
import { useLanguage } from '@client/src/hooks/useLanguage';

const TYPE_OPTIONS = [
  { value: 'fixed', labelZh: '滿減券', labelEn: 'Fixed Discount' },
  { value: 'percent', labelZh: '折扣券', labelEn: 'Percent Discount' },
  { value: 'shipping', labelZh: '免運券', labelEn: 'Free Shipping' },
];

const SCOPE_OPTIONS = [
  { value: 'all', labelZh: '全場適用', labelEn: 'All Products' },
  { value: 'category', labelZh: '指定分類', labelEn: 'Specific Categories' },
  { value: 'product', labelZh: '指定商品', labelEn: 'Specific Products' },
];

const VALID_TYPE_OPTIONS = [
  { value: 'fixed', labelZh: '固定時間段', labelEn: 'Fixed Period' },
  { value: 'days', labelZh: '領取後N天', labelEn: 'N Days After Claim' },
];

interface CouponForm {
  nameZh: string;
  nameEn: string;
  type: 'fixed' | 'percent' | 'shipping';
  discountValue: number;
  minAmount: number;
  applicableScope: 'all' | 'category' | 'product';
  validType: 'fixed' | 'days';
  validDays: number;
  startTime: string;
  endTime: string;
  totalQuantity: number;
  perUserLimit: number;
}

interface CouponFormFieldsProps {
  form: CouponForm;
  onChange: (form: CouponForm) => void;
}

const CouponFormFields = ({ form, onChange }: CouponFormFieldsProps) => {
  const { lang } = useLanguage();

  const update = <K extends keyof CouponForm>(key: K, value: CouponForm[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{lang === 'zh' ? '名稱（繁體）' : 'Name (ZH)'}</Label>
          <Input
            value={form.nameZh}
            onChange={(e) => update('nameZh', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>{lang === 'zh' ? '名稱（英文）' : 'Name (EN)'}</Label>
          <Input
            value={form.nameEn}
            onChange={(e) => update('nameEn', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{lang === 'zh' ? '優惠券類型' : 'Coupon Type'}</Label>
          <Select
            value={form.type}
            onValueChange={(v) => update('type', v as 'fixed' | 'percent' | 'shipping')}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {lang === 'zh' ? opt.labelZh : opt.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>
            {form.type === 'percent'
              ? lang === 'zh'
                ? '折扣（如 8.5 表示 85 折）'
                : 'Discount (e.g. 8.5 = 15% off)'
              : form.type === 'fixed'
                ? lang === 'zh'
                  ? '面額（HK$）'
                  : 'Amount (HK$)'
                : lang === 'zh'
                  ? '免運金額'
                  : 'Shipping Value'}
          </Label>
          <Input
            type="number"
            value={form.discountValue}
            onChange={(e) => update('discountValue', Number(e.target.value))}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label>
          {lang === 'zh' ? '最低消費金額（HK$）' : 'Min. Purchase (HK$)'}
        </Label>
        <Input
          type="number"
          value={form.minAmount}
          onChange={(e) => update('minAmount', Number(e.target.value))}
          className="mt-1"
        />
      </div>

      <div>
        <Label>{lang === 'zh' ? '適用範圍' : 'Applicable Scope'}</Label>
        <Select
          value={form.applicableScope}
          onValueChange={(v) =>
            update('applicableScope', v as 'all' | 'category' | 'product')
          }
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {lang === 'zh' ? opt.labelZh : opt.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{lang === 'zh' ? '有效期類型' : 'Validity Type'}</Label>
        <Select
          value={form.validType}
          onValueChange={(v) => update('validType', v as 'fixed' | 'days')}
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VALID_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {lang === 'zh' ? opt.labelZh : opt.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.validType === 'fixed' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{lang === 'zh' ? '開始時間' : 'Start Time'}</Label>
            <Input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => update('startTime', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{lang === 'zh' ? '結束時間' : 'End Time'}</Label>
            <Input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => update('endTime', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      ) : (
        <div>
          <Label>{lang === 'zh' ? '領取後有效天數' : 'Valid Days After Claim'}</Label>
          <Input
            type="number"
            value={form.validDays}
            onChange={(e) => update('validDays', parseInt(e.target.value, 10))}
            className="mt-1"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{lang === 'zh' ? '發放數量' : 'Total Quantity'}</Label>
          <Input
            type="number"
            value={form.totalQuantity}
            onChange={(e) => update('totalQuantity', parseInt(e.target.value, 10))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>{lang === 'zh' ? '每人限領數量' : 'Per User Limit'}</Label>
          <Input
            type="number"
            value={form.perUserLimit}
            onChange={(e) => update('perUserLimit', parseInt(e.target.value, 10))}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};

export default CouponFormFields;
