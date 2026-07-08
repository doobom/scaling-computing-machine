import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Switch } from '@client/src/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@client/src/components/ui/tabs';
import { Badge } from '@client/src/components/ui/badge';
import { Label } from '@client/src/components/ui/label';
import { Plus, X, Image as ImageIcon, Tag } from 'lucide-react';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  Product,
  ProductFormData,
  Category,
} from '@client/src/api/product';
import ImageManager from './ImageManager';
import SpecManager from './SpecManager';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  product?: Product | null;
  categories: Category[];
}

const EMPTY_FORM: ProductFormData = {
  categoryId: '',
  titleZh: '',
  titleEn: '',
  descZh: '',
  descEn: '',
  originalPrice: 0,
  salePrice: 0,
  stock: 0,
  stockWarningThreshold: 10,
  spec: [],
  status: 'off_sale',
  tags: [],
  images: [],
};

const ProductFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  product,
  categories,
}: ProductFormDialogProps) => {
  const { lang, t } = useLanguage();
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (open) {
      if (product) {
        setForm({
          categoryId: product.categoryId,
          titleZh: product.titleZh,
          titleEn: product.titleEn,
          descZh: product.descZh ?? '',
          descEn: product.descEn ?? '',
          originalPrice: product.originalPrice,
          salePrice: product.salePrice,
          stock: product.stock,
          stockWarningThreshold: product.stockWarningThreshold,
          spec: product.spec ?? [],
          status: product.status,
          tags: product.tags ?? [],
          images: product.images ?? [],
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setActiveTab('basic');
      setTagInput('');
    }
  }, [open, product]);

  const updateField = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (form.tags?.includes(tag)) {
      setTagInput('');
      return;
    }
    updateField('tags', [...(form.tags ?? []), tag]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    updateField(
      'tags',
      (form.tags ?? []).filter((t) => t !== tag),
    );
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.titleZh || !form.titleEn) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      logger.error('submit product failed', { err });
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = !!product;
  const title = isEdit
    ? lang === 'zh'
      ? '編輯商品'
      : 'Edit Product'
    : lang === 'zh'
      ? '新增商品'
      : 'New Product';

  const flatCategories: Array<Category & { nameZh: string }> = [];
  const flatten = (list: Category[] | undefined, level = 0) => {
    if (!list) return;
    list.forEach((cat) => {
      flatCategories.push({ ...cat, nameZh: '　'.repeat(level) + cat.nameZh });
      flatten(cat.children, level + 1);
    });
  };
  flatten(categories);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="w-fit">
            <TabsTrigger value="basic">
              {lang === 'zh' ? '基本信息' : 'Basic Info'}
            </TabsTrigger>
            <TabsTrigger value="images">
              <ImageIcon className="w-4 h-4 mr-1" />
              {lang === 'zh' ? '圖片管理' : 'Images'}
            </TabsTrigger>
            <TabsTrigger value="spec">
              <Tag className="w-4 h-4 mr-1" />
              {lang === 'zh' ? '規格設置' : 'Specs'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{lang === 'zh' ? '所屬分類' : 'Category'} *</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => updateField('categoryId', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          lang === 'zh' ? '請選擇分類' : 'Select category'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {flatCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {lang === 'zh' ? cat.nameZh : cat.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{lang === 'zh' ? '狀態' : 'Status'}</Label>
                  <div className="flex items-center gap-2 h-9">
                    <Switch
                      checked={form.status === 'on_sale'}
                      onCheckedChange={(checked) =>
                        updateField(
                          'status',
                          checked ? 'on_sale' : 'off_sale',
                        )
                      }
                    />
                    <span className="text-sm text-foreground">
                      {form.status === 'on_sale'
                        ? lang === 'zh'
                          ? '上架中'
                          : 'On Sale'
                        : lang === 'zh'
                          ? '已下架'
                          : 'Off Sale'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  {lang === 'zh' ? '商品名稱（繁中）' : 'Product Name (ZH)'} *
                </Label>
                <Input
                  value={form.titleZh}
                  onChange={(e) => updateField('titleZh', e.target.value)}
                  placeholder={
                    lang === 'zh' ? '請輸入繁體中文名稱' : 'Enter Chinese name'
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {lang === 'zh' ? '商品名稱（英文）' : 'Product Name (EN)'} *
                </Label>
                <Input
                  value={form.titleEn}
                  onChange={(e) => updateField('titleEn', e.target.value)}
                  placeholder={
                    lang === 'zh' ? '請輸入英文名稱' : 'Enter English name'
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {lang === 'zh' ? '商品描述（繁中）' : 'Description (ZH)'}
                </Label>
                <Textarea
                  value={form.descZh}
                  onChange={(e) => updateField('descZh', e.target.value)}
                  rows={3}
                  placeholder={
                    lang === 'zh'
                      ? '請輸入繁體中文描述'
                      : 'Enter Chinese description'
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {lang === 'zh' ? '商品描述（英文）' : 'Description (EN)'}
                </Label>
                <Textarea
                  value={form.descEn}
                  onChange={(e) => updateField('descEn', e.target.value)}
                  rows={3}
                  placeholder={
                    lang === 'zh' ? '請輸入英文描述' : 'Enter English description'
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{lang === 'zh' ? '原價 (HK$)' : 'Original Price (HK$)'}</Label>
                  <Input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) =>
                      updateField('originalPrice', Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{lang === 'zh' ? '售價 (HK$)' : 'Sale Price (HK$)'}</Label>
                  <Input
                    type="number"
                    value={form.salePrice}
                    onChange={(e) =>
                      updateField('salePrice', Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{lang === 'zh' ? '庫存數量' : 'Stock'}</Label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      updateField('stock', Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {lang === 'zh' ? '庫存預警閾值' : 'Warning Threshold'}
                  </Label>
                  <Input
                    type="number"
                    value={form.stockWarningThreshold}
                    onChange={(e) =>
                      updateField(
                        'stockWarningThreshold',
                        Number(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{lang === 'zh' ? '標籤' : 'Tags'}</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder={
                      lang === 'zh' ? '輸入標籤後按回車添加' : 'Type and press Enter'
                    }
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(form.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="flex-1 overflow-y-auto pr-2">
            <div className="py-2">
              <ImageManager
                images={form.images}
                onChange={(imgs) => updateField('images', imgs)}
              />
            </div>
          </TabsContent>

          <TabsContent value="spec" className="flex-1 overflow-y-auto pr-2">
            <div className="py-2">
              <SpecManager
                specs={form.spec ?? []}
                onChange={(specs) => updateField('spec', specs)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? lang === 'zh'
                ? '保存中...'
                : 'Saving...'
              : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
