import { useState, type ReactElement } from 'react';
import { ChevronDown, ChevronRight, Filter } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@client/src/components/ui/sheet';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Checkbox } from '@client/src/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { Category, StoreProductSearchParams } from '@client/src/api/product';

type SortType = StoreProductSearchParams['sort'];

interface FilterSidebarProps {
  categories: Category[];
  filters: {
    categoryId: string;
    minPrice: string;
    maxPrice: string;
    tag: string;
    sort: SortType;
  };
  onFilterChange: (key: string, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  isMobile?: boolean;
}

const TAG_OPTIONS = [
  { value: 'new', labelKey: 'product.newArrival' as const },
  { value: 'hot', labelKey: 'product.hotSale' as const },
  { value: 'discount', labelKey: 'product.discount' as const },
];

const SORT_OPTIONS = [
  { value: 'newest', labelZh: '最新上架', labelEn: 'Newest' },
  { value: 'sales', labelZh: '销量优先', labelEn: 'Best Selling' },
  { value: 'price_asc', labelZh: '价格升序', labelEn: 'Price: Low to High' },
  { value: 'price_desc', labelZh: '价格降序', labelEn: 'Price: High to Low' },
];

function CategoryTree({
  categories,
  selectedId,
  onSelect,
  lang,
}: {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  lang: 'zh' | 'en';
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (cat: Category, level: number): ReactElement => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expanded[cat.id];
    const isSelected = selectedId === cat.id;
    const name = lang === 'zh' ? cat.nameZh : cat.nameEn;

    return (
      <div key={cat.id}>
        <div
          className={`flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer text-sm transition-colors ${
            isSelected
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-muted'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggle(cat.id)}
              className="p-0.5 hover:bg-muted-foreground/10 rounded"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 h-3.5" />
          )}
          <span
            className="flex-1 truncate"
            onClick={() => onSelect(cat.id)}
          >
            {name}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {cat.children!.map((child: Category) =>
              renderNode(child, level + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      {categories.map((cat) => renderNode(cat, 0))}
    </div>
  );
}

function FilterContent({
  categories,
  filters,
  onFilterChange,
  onApply,
  onReset,
}: FilterSidebarProps) {
  const { lang, t } = useLanguage();

  return (
    <div className="flex flex-col gap-5">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {lang === 'zh' ? '商品分類' : 'Categories'}
        </h3>
        <div className="max-h-64 overflow-y-auto pr-1 space-y-0.5">
          <button
            type="button"
            onClick={() => onFilterChange('categoryId', '')}
            className={`w-full text-left py-1.5 px-2 rounded-md text-sm transition-colors ${
              filters.categoryId === ''
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-muted'
            }`}
          >
            {t('common.all')}
          </button>
          <CategoryTree
            categories={categories}
            selectedId={filters.categoryId}
            onSelect={(id) => onFilterChange('categoryId', id)}
            lang={lang}
          />
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {lang === 'zh' ? '價格區間' : 'Price Range'}
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder={lang === 'zh' ? '最低' : 'Min'}
            value={filters.minPrice}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
            className="h-8 text-sm"
          />
          <span className="text-muted-foreground text-xs">-</span>
          <Input
            type="number"
            min={0}
            placeholder={lang === 'zh' ? '最高' : 'Max'}
            value={filters.maxPrice}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {lang === 'zh' ? '商品標籤' : 'Tags'}
        </h3>
        <div className="space-y-2">
          {TAG_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={filters.tag === opt.value}
                onCheckedChange={(checked) =>
                  onFilterChange('tag', checked ? opt.value : '')
                }
              />
              <span>{t(opt.labelKey)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {lang === 'zh' ? '排序方式' : 'Sort By'}
        </h3>
        <Select
          value={filters.sort ?? 'newest'}
          onValueChange={(val) => onFilterChange('sort', val)}
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {lang === 'zh' ? opt.labelZh : opt.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onReset}
        >
          {lang === 'zh' ? '重置' : 'Reset'}
        </Button>
        <Button size="sm" className="flex-1" onClick={onApply}>
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  );
}

export function FilterSidebar(props: FilterSidebarProps) {
  const { isMobile } = props;

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="w-4 h-4" />
            <span>篩選</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>篩選條件</SheetTitle>
          </SheetHeader>
          <div className="pt-4">
            <FilterContent {...props} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="w-60 shrink-0 bg-card rounded-lg border border-border p-4 h-fit sticky top-20">
      <FilterContent {...props} />
    </aside>
  );
}
