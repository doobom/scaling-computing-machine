import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import ProductCard from '@client/src/components/ProductCard';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { SkeletonCard } from '@client/src/components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '@client/src/components/ui/empty';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { useIsMobile } from '@client/src/hooks/use-mobile';
import { FilterSidebar } from './FilterSidebar';
import {
  searchProducts,
  getCategoryTree,
} from '@client/src/api/product';
import type { Product, Category } from '@client/src/api/product';
import type { StoreProductSearchParams } from '@client/src/api/product';

type SortType = StoreProductSearchParams['sort'];

const PAGE_SIZE = 20;

function productToCardProps(product: Product) {
  const hasDiscount = product.originalPrice > product.salePrice;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.salePrice / product.originalPrice) * 100)
    : undefined;

  const tags = product.tags ?? [];
  let tag: 'new' | 'hot' | 'discount' | 'none' = 'none';
  if (tags.includes('new')) tag = 'new';
  else if (tags.includes('hot')) tag = 'hot';
  else if (tags.includes('discount') || hasDiscount) tag = 'discount';

  return {
    id: product.id,
    nameZh: product.titleZh,
    nameEn: product.titleEn,
    image: (product as any).mainImageUrl ?? product.mainImage ?? '',
    originalPrice: product.originalPrice,
    price: product.salePrice,
    tag,
    discountPercent,
  };
}

const ProductListPage = () => {
  const { lang, t } = useLanguage();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlKeyword = searchParams.get('q') ?? searchParams.get('keyword') ?? '';
  const urlCategory = searchParams.get('category') ?? '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    categoryId: urlCategory,
    keyword: urlKeyword,
    minPrice: '',
    maxPrice: '',
    tag: '',
    sort: 'newest' as SortType,
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  // Sync URL keyword to local state on mount/URL change
  useEffect(() => {
    setFilters((prev) => ({ ...prev, keyword: urlKeyword, categoryId: urlCategory }));
    setAppliedFilters((prev) => ({ ...prev, keyword: urlKeyword, categoryId: urlCategory }));
    setPage(1);
  }, [urlKeyword, urlCategory]);

  // Fetch categories
  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      try {
        const data = await getCategoryTree();
        if (!cancelled) setCategories(Array.isArray(data) ? data : (data as any)?.items ?? []);
      } catch (err) {
        logger.error(`fetch categories failed: ${JSON.stringify(err)}`);
      }
    };
    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch products
  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: StoreProductSearchParams = {
          page,
          pageSize: PAGE_SIZE,
          keyword: appliedFilters.keyword || undefined,
          categoryId: appliedFilters.categoryId || undefined,
          minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
          maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
          sort: appliedFilters.sort,
          tag: appliedFilters.tag || undefined,
        };
        const data = await searchProducts(params);
        if (!cancelled) {
          setProducts(data.items);
          setTotal(data.total);
        }
      } catch (err) {
        logger.error(`search products failed: ${JSON.stringify(err)}`);
        if (!cancelled) {
          setError(t('common.error'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters, page, t]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleReset = () => {
    const reset = {
      categoryId: '',
      keyword: urlKeyword,
      minPrice: '',
      maxPrice: '',
      tag: '',
      sort: 'newest' as SortType,
    };
    setFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
    if (urlCategory) {
      setSearchParams((prev) => {
        prev.delete('category');
        return prev;
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters(filters);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('ellipsis');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return (
      <nav
        className="flex items-center justify-center gap-1 mt-8"
        aria-label="pagination"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1 || loading}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="icon"
              onClick={() => handlePageChange(p)}
              disabled={loading}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages || loading}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </nav>
    );
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {lang === 'zh' ? '商品分類' : 'Products'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'zh'
              ? '精選香港生活百貨，正品保證'
              : 'Curated Hong Kong lifestyle products'}
          </p>
        </div>

        {/* Mobile: search + filter bar */}
        <div className="flex items-center gap-2 mb-4 lg:hidden">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                placeholder={t('search.placeholder')}
                className="pl-9 h-9"
              />
            </div>
          </form>
          <FilterSidebar
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            onApply={handleApply}
            onReset={handleReset}
            isMobile
          />
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <FilterSidebar
              categories={categories}
              filters={filters}
              onFilterChange={handleFilterChange}
              onApply={handleApply}
              onReset={handleReset}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Desktop: search + result count bar */}
            <div className="hidden md:flex items-center justify-between mb-4 gap-4">
              <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    value={filters.keyword}
                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    placeholder={t('search.placeholder')}
                    className="pl-9 h-9"
                  />
                </div>
              </form>
              <span className="text-sm text-muted-foreground shrink-0">
                {lang === 'zh' ? `共 ${total} 件商品` : `${total} items`}
              </span>
            </div>

            {/* Mobile result count */}
            <div className="md:hidden mb-3 text-sm text-muted-foreground">
              {lang === 'zh' ? `共 ${total} 件商品` : `${total} items`}
            </div>

            {/* Product grid */}
            {loading ? (
              renderSkeletons()
            ) : error ? (
              <div className="py-12">
                <Empty className="py-12">
                  <EmptyHeader>
                    <EmptyTitle>{t('common.error')}</EmptyTitle>
                    <EmptyDescription>{error}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
                <div className="flex justify-center mt-4">
                  <Button onClick={handleApply}>{t('common.confirm')}</Button>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="py-12">
                <Empty className="py-12">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Search className="w-6 h-6" />
                    </EmptyMedia>
                    <EmptyTitle>
                      {lang === 'zh' ? '未找到相關商品' : 'No products found'}
                    </EmptyTitle>
                    <EmptyDescription>
                      {lang === 'zh'
                        ? '試試更換關鍵詞或調整篩選條件'
                        : 'Try adjusting your search or filters'}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
                <div className="flex justify-center mt-4">
                  <Button onClick={handleReset}>
                    {lang === 'zh' ? '清除篩選' : 'Clear filters'}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                data-ai-section-type="card-list"
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...productToCardProps(product)}
                  />
                ))}
              </div>
            )}

            {renderPagination()}
          </div>
        </div>
      </div>
  );
};

export default ProductListPage;
