import { useState, useEffect, useCallback } from 'react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@client/src/components/ui/dropdown-menu';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@client/src/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@client/src/components/ui/tabs';
import {
  Plus,
  Search,
  MoreHorizontal,
  AlertTriangle,
  Package,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  getProductList,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  batchUpdateProductStatus,
  getLowStockProducts,
  type Product,
  type ProductFormData,
  type ProductListParams,
  type Category,
} from '@client/src/api/product';
import ProductFormDialog from './ProductFormDialog';
import CategoryManage from './CategoryManage';
import ProductTable from './ProductTable';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const ProductManage = () => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: ProductListParams = {
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
        status: status || undefined,
        page,
        pageSize,
      };
      const res = await getProductList(params);
      setProducts(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      logger.error('fetch products failed', { err });
    } finally {
      setLoading(false);
    }
  }, [keyword, categoryId, status, page, pageSize]);

  const fetchLowStock = useCallback(async () => {
    try {
      const items = await getLowStockProducts();
      setLowStockProducts(items ?? []);
    } catch (err) {
      logger.error('fetch low stock failed', { err });
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchLowStock();
    }
  }, [activeTab, fetchProducts, fetchLowStock]);

  const handleSearch = () => {
    setPage(1);
    fetchProducts();
  };

  const handleReset = () => {
    setKeyword('');
    setCategoryId('');
    setStatus('');
    setLowStockFilter(false);
    setPage(1);
    setTimeout(fetchProducts, 0);
  };

  const handleLowStockFilter = () => {
    setLowStockFilter(true);
    setStatus('');
    setPage(1);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
      fetchProducts();
      fetchLowStock();
    } catch (err) {
      logger.error('delete product failed', { err });
    }
  };

  const handleStatusToggle = async (product: Product) => {
    const newStatus: 'on_sale' | 'off_sale' =
      product.status === 'on_sale' ? 'off_sale' : 'on_sale';
    try {
      await updateProductStatus(product.id, newStatus);
      fetchProducts();
    } catch (err) {
      logger.error('update product status failed', { err });
    }
  };

  const handleBatchStatus = async (targetStatus: string) => {
    if (selectedRowKeys.length === 0) return;
    try {
      await batchUpdateProductStatus(selectedRowKeys, targetStatus);
      setSelectedRowKeys([]);
      fetchProducts();
    } catch (err) {
      logger.error('batch update status failed', { err });
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }
    setFormDialogOpen(false);
    setEditingProduct(null);
    fetchProducts();
    fetchLowStock();
  };

  const flatCategories: Category[] = [];
  const flatten = (list: Category[] | undefined) => {
    if (!list) return;
    list.forEach((cat) => {
      flatCategories.push(cat);
      flatten(cat.children);
    });
  };
  flatten(categories);

  const displayProducts = lowStockFilter
    ? products.filter((p) => p.stock <= (p.stockWarningThreshold ?? 10))
    : products;
  const displayTotal = lowStockFilter ? displayProducts.length : total;

  const totalPages = Math.max(1, Math.ceil(displayTotal / pageSize));

  const productTitle = (p: Product | null): string => {
    if (!p) return '';
    return lang === 'zh' ? p.titleZh : p.titleEn;
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            {lang === 'zh' ? '商品列表' : 'Products'}
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Layers className="w-4 h-4 mr-2" />
            {lang === 'zh' ? '分類管理' : 'Categories'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Low stock alert banner */}
          {lowStockProducts.length > 0 && !lowStockFilter && (
            <Alert
              variant="warning"
              className="cursor-pointer"
              onClick={handleLowStockFilter}
            >
              <AlertTriangle />
              <AlertTitle>
                {lang === 'zh' ? '庫存預警' : 'Low Stock Alert'}
              </AlertTitle>
              <AlertDescription>
                {lang === 'zh'
                  ? `有 ${lowStockProducts.length} 件商品庫存低於預警閾值，點擊查看詳情`
                  : `${lowStockProducts.length} product(s) below stock threshold, click to view`}
              </AlertDescription>
            </Alert>
          )}

          {lowStockFilter && (
            <div className="flex items-center justify-between px-4 py-2 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-warning-foreground">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {lang === 'zh'
                    ? '正在篩選低庫存商品'
                    : 'Filtering low stock products'}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                {lang === 'zh' ? '清除篩選' : 'Clear filter'}
              </Button>
            </div>
          )}

          {/* Toolbar */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-1" />
                {lang === 'zh' ? '新建商品' : 'New Product'}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={selectedRowKeys.length === 0}
                  >
                    <MoreHorizontal className="w-4 h-4 mr-1" />
                    {lang === 'zh' ? '批量操作' : 'Batch Actions'}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    {lang === 'zh'
                      ? `已選 ${selectedRowKeys.length} 項`
                      : `${selectedRowKeys.length} selected`}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBatchStatus('on_sale')}>
                    {lang === 'zh' ? '批量上架' : 'Batch On Sale'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBatchStatus('off_sale')}>
                    {lang === 'zh' ? '批量下架' : 'Batch Off Sale'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1" />

              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-40">
                  <SelectValue
                    placeholder={lang === 'zh' ? '全部分類' : 'All Categories'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {lang === 'zh' ? '全部分類' : 'All Categories'}
                  </SelectItem>
                  {flatCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {lang === 'zh' ? cat.nameZh : cat.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue
                    placeholder={lang === 'zh' ? '全部狀態' : 'All Status'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {lang === 'zh' ? '全部狀態' : 'All Status'}
                  </SelectItem>
                  <SelectItem value="on_sale">
                    {lang === 'zh' ? '上架中' : 'On Sale'}
                  </SelectItem>
                  <SelectItem value="off_sale">
                    {lang === 'zh' ? '已下架' : 'Off Sale'}
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder={
                    lang === 'zh' ? '搜索商品...' : 'Search products...'
                  }
                  className="pl-9"
                />
              </div>

              <Button variant="outline" onClick={handleSearch}>
                {lang === 'zh' ? '搜索' : 'Search'}
              </Button>

              <Button variant="ghost" onClick={handleReset}>
                {lang === 'zh' ? '重置' : 'Reset'}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <ProductTable
              products={displayProducts}
              loading={loading}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={setSelectedRowKeys}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onStatusToggle={handleStatusToggle}
            />

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {lang === 'zh'
                  ? `共 ${displayTotal} 條記錄`
                  : `Total ${displayTotal} items`}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} / {lang === 'zh' ? '頁' : 'page'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {lang === 'zh' ? '上一頁' : 'Prev'}
                </Button>
                <span className="text-sm text-foreground min-w-[60px] text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {lang === 'zh' ? '下一頁' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManage onCategoriesChange={setCategories} />
        </TabsContent>
      </Tabs>

      {/* Product form dialog */}
      <ProductFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSubmit={handleFormSubmit}
        product={editingProduct}
        categories={categories}
      />

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lang === 'zh' ? '確認刪除' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === 'zh'
                ? `確定要刪除商品「${productTitle(deletingProduct)}」嗎？此操作無法撤銷。`
                : `Are you sure you want to delete "${productTitle(
                    deletingProduct,
                  )}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductManage;
