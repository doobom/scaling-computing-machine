import { useState, useEffect, type ReactElement } from 'react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Switch } from '@client/src/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Label } from '@client/src/components/ui/label';
import { Badge } from '@client/src/components/ui/badge';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  getCategoryList,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  type Category,
  type CategoryFormData,
} from '@client/src/api/product';
import { showConfirm } from '@lark-apaas/client-toolkit';

interface CategoryManageProps {
  onCategoriesChange?: (categories: Category[]) => void;
}

const EMPTY_FORM: CategoryFormData = {
  parentId: undefined,
  nameZh: '',
  nameEn: '',
  iconUrl: '',
  sort: 0,
  status: 'enabled',
};

const CategoryManage = ({ onCategoriesChange }: CategoryManageProps) => {
  const { lang, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategoryList();
      setCategories(res.items ?? []);
      onCategoriesChange?.(res.items ?? []);
    } catch (err) {
      logger.error('load categories failed', { err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  const openCreateDialog = (parentId?: string) => {
    setEditingCategory(null);
    setForm({ ...EMPTY_FORM, parentId, sort: 0 });
    setDialogOpen(true);
  };

  const openEditDialog = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      parentId: cat.parentId,
      nameZh: cat.nameZh,
      nameEn: cat.nameEn,
      iconUrl: cat.iconUrl ?? '',
      sort: cat.sort,
      status: cat.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nameZh || !form.nameEn) return;
    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, form);
      } else {
        await createCategory(form);
      }
      setDialogOpen(false);
      loadCategories();
    } catch (err) {
      logger.error('save category failed', { err });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm(lang === 'zh' ? '確定刪除此分類？' : 'Delete this category?')) {
      return;
    }
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      logger.error('delete category failed', { err });
    }
  };

  const handleStatusToggle = async (cat: Category) => {
    const newStatus: 'enabled' | 'disabled' =
      cat.status === 'enabled' ? 'disabled' : 'enabled';
    try {
      await updateCategoryStatus(cat.id, newStatus);
      loadCategories();
    } catch (err) {
      logger.error('update category status failed', { err });
    }
  };

  const flatCategories: Category[] = [];
  const flatten = (list: Category[] | undefined, level = 0) => {
    if (!list) return;
    list.forEach((cat) => {
      flatCategories.push({ ...cat, nameZh: '　'.repeat(level) + cat.nameZh });
      flatten(cat.children, level + 1);
    });
  };
  flatten(categories);

  const renderTree = (list: Category[] | undefined, level = 0): ReactElement[] => {
    if (!list) return [];
    return list.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expandedIds.has(cat.id);
      return (
        <div key={cat.id}>
          <div
            className={`flex items-center gap-2 px-3 py-2 border-b border-border hover:bg-muted/50 ${
              cat.status === 'disabled' ? 'opacity-50' : ''
            }`}
            style={{ paddingLeft: `${level * 24 + 12}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(cat.id)}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-primary" />
              ) : (
                <Folder className="w-4 h-4 text-primary" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {lang === 'zh' ? cat.nameZh : cat.nameEn}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {lang === 'zh' ? cat.nameEn : cat.nameZh}
              </p>
            </div>
            <Badge
              variant={cat.status === 'enabled' ? 'default' : 'secondary'}
              className={
                cat.status === 'enabled'
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }
            >
              {cat.status === 'enabled'
                ? lang === 'zh'
                  ? '啟用'
                  : 'Enabled'
                : lang === 'zh'
                  ? '停用'
                  : 'Disabled'}
            </Badge>
            <span className="text-xs text-muted-foreground w-12 text-right">
              {lang === 'zh' ? '排序' : 'Sort'}: {cat.sort}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => openCreateDialog(cat.id)}
                title={lang === 'zh' ? '添加子分類' : 'Add subcategory'}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(cat)}
                title={t('common.edit')}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(cat.id)}
                className="text-destructive hover:text-destructive"
                title={t('common.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <Switch
              checked={cat.status === 'enabled'}
              onCheckedChange={() => handleStatusToggle(cat)}
            />
          </div>
          {hasChildren && isExpanded && renderTree(cat.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">
          {lang === 'zh' ? '分類管理' : 'Category Management'}
        </h3>
        <Button size="sm" onClick={() => openCreateDialog()}>
          <Plus className="w-4 h-4 mr-1" />
          {lang === 'zh' ? '新增分類' : 'New Category'}
        </Button>
      </div>

      <div className="divide-y divide-border">
        {loading && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {t('common.loading')}
          </div>
        )}
        {!loading && categories.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {lang === 'zh' ? '暫無分類' : 'No categories yet'}
          </div>
        )}
        {!loading && renderTree(categories)}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? lang === 'zh'
                  ? '編輯分類'
                  : 'Edit Category'
                : lang === 'zh'
                  ? '新增分類'
                  : 'New Category'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{lang === 'zh' ? '上級分類' : 'Parent Category'}</Label>
              <Select
                value={form.parentId ?? ''}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    parentId: v || undefined,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={lang === 'zh' ? '頂級分類' : 'Top level'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {lang === 'zh' ? '頂級分類' : 'Top level'}
                  </SelectItem>
                  {flatCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {lang === 'zh' ? cat.nameZh : cat.nameEn}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {lang === 'zh' ? '分類名稱（繁中）' : 'Category Name (ZH)'} *
              </Label>
              <Input
                value={form.nameZh}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nameZh: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                {lang === 'zh' ? '分類名稱（英文）' : 'Category Name (EN)'} *
              </Label>
              <Input
                value={form.nameEn}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nameEn: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{lang === 'zh' ? '圖標URL' : 'Icon URL'}</Label>
              <Input
                value={form.iconUrl ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, iconUrl: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{lang === 'zh' ? '排序' : 'Sort Order'}</Label>
                <Input
                  type="number"
                  value={form.sort}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sort: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'zh' ? '狀態' : 'Status'}</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={form.status === 'enabled'}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        status: checked ? 'enabled' : 'disabled',
                      }))
                    }
                  />
                  <span className="text-sm text-foreground">
                    {form.status === 'enabled'
                      ? lang === 'zh'
                        ? '啟用'
                        : 'Enabled'
                      : lang === 'zh'
                        ? '停用'
                        : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
    </div>
  );
};

export default CategoryManage;
