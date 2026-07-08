import { Button } from '@client/src/components/ui/button';
import { Switch } from '@client/src/components/ui/switch';
import { Badge } from '@client/src/components/ui/badge';
import { Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { Product } from '@client/src/api/product';

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  selectedRowKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onStatusToggle: (product: Product) => void;
}

const ProductTable = ({
  products,
  loading,
  selectedRowKeys,
  onSelectionChange,
  onEdit,
  onDelete,
  onStatusToggle,
}: ProductTableProps) => {
  const { lang, t } = useLanguage();

  const allSelected = products.length > 0 && selectedRowKeys.length === products.length;
  const someSelected = selectedRowKeys.length > 0 && selectedRowKeys.length < products.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map((p) => p.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedRowKeys.includes(id)) {
      onSelectionChange(selectedRowKeys.filter((k) => k !== id));
    } else {
      onSelectionChange([...selectedRowKeys, id]);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{lang === 'zh' ? '暫無商品' : 'No products'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="w-10 px-3 py-3 text-left">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={toggleAll}
              />
            </th>
            <th className="w-20 px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {lang === 'zh' ? '主圖' : 'Image'}
            </th>
            <th className="w-44 px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {lang === 'zh' ? '商品ID' : 'ID'}
            </th>
            <th className="min-w-[200px] px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {lang === 'zh' ? '商品名稱' : 'Name'}
            </th>
            <th className="w-28 px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {lang === 'zh' ? '分類' : 'Category'}
            </th>
            <th className="w-24 px-3 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {lang === 'zh' ? '原價' : 'Original'}
            </th>
            <th className="w-24 px-3 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {lang === 'zh' ? '售價' : 'Price'}
            </th>
            <th className="w-24 px-3 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {lang === 'zh' ? '庫存' : 'Stock'}
            </th>
            <th className="w-28 px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {lang === 'zh' ? '狀態' : 'Status'}
            </th>
            <th className="w-40 px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {lang === 'zh' ? '上架時間' : 'Created'}
            </th>
            <th className="w-28 px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide sticky right-0 bg-muted/30">
              {lang === 'zh' ? '操作' : 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLow = product.stock <= (product.stockWarningThreshold ?? 10);
            return (
              <tr
                key={product.id}
                className={`border-b border-border transition-colors hover:bg-muted/30 ${
                  isLow ? 'bg-warning/5' : ''
                }`}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input"
                    checked={selectedRowKeys.includes(product.id)}
                    onChange={() => toggleOne(product.id)}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted border border-border">
                    {product.mainImage || product.images?.[0]?.imageUrl ? (
                      <img
                        src={product.mainImage || product.images?.[0]?.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    {product.id}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground truncate">
                      {lang === 'zh' ? product.titleZh : product.titleEn}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lang === 'zh' ? product.titleEn : product.titleZh}
                    </p>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm text-foreground">
                    {lang === 'zh'
                      ? product.categoryNameZh ?? '-'
                      : product.categoryNameEn ?? '-'}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-sm text-muted-foreground line-through font-mono">
                    HK${product.originalPrice?.toFixed(2)}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-sm font-semibold text-price font-mono">
                    HK${product.salePrice?.toFixed(2)}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isLow && <AlertTriangle className="w-4 h-4 text-warning" />}
                    <span
                      className={`text-sm font-mono font-medium ${
                        isLow ? 'text-warning' : 'text-foreground'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={product.status === 'on_sale'}
                      onCheckedChange={() => onStatusToggle(product)}
                    />
                    <Badge
                      variant={product.status === 'on_sale' ? 'default' : 'secondary'}
                      className={
                        product.status === 'on_sale'
                          ? 'bg-accent text-accent-foreground'
                          : ''
                      }
                    >
                      {product.status === 'on_sale'
                        ? lang === 'zh'
                          ? '上架'
                          : 'On Sale'
                        : lang === 'zh'
                          ? '下架'
                          : 'Off Sale'}
                    </Badge>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs text-muted-foreground">
                    {product.createdAt
                      ? new Date(product.createdAt).toLocaleString()
                      : '-'}
                  </span>
                </td>
                <td className="px-3 py-3 sticky right-0 bg-inherit">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(product)}
                      title={t('common.edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(product)}
                      className="text-destructive hover:text-destructive"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
