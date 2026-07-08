import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Switch } from '@client/src/components/ui/switch';
import { Badge } from '@client/src/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Label } from '@client/src/components/ui/label';
import { useLanguage } from '@client/src/hooks/useLanguage';
import {
  getAdminPromotionList,
  createAdminPromotion,
  updateAdminPromotion,
  deleteAdminPromotion,
  updateAdminPromotionStatus,
  type Promotion,
  type PromotionFormData,
} from '@client/src/api/marketing';
import { showConfirm } from '@lark-apaas/client-toolkit';

const emptyForm: PromotionFormData = {
  nameZh: '',
  nameEn: '',
  thresholdAmount: '100',
  discountAmount: '10',
  startTime: new Date().toISOString().slice(0, 16),
  endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16),
  applicableScope: 'all',
  applicableIds: [],
  allowStack: false,
  status: 'pending',
  sort: 0,
};

const PromotionTab = () => {
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<Promotion[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromotionFormData>(emptyForm);

  const loadData = async () => {
    try {
      const res = await getAdminPromotionList({ page: 1, pageSize: 50 });
      setItems(res.items);
    } catch (err) {
      logger.error(`load promotions failed: ${String(err)}`);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: Promotion) => {
    setEditing(item);
    setForm({
      nameZh: item.nameZh,
      nameEn: item.nameEn,
      thresholdAmount: item.thresholdAmount,
      discountAmount: item.discountAmount,
      startTime: item.startTime.slice(0, 16),
      endTime: item.endTime.slice(0, 16),
      applicableScope: item.applicableScope,
      applicableIds: item.applicableIds,
      allowStack: item.allowStack,
      status: item.status,
      sort: item.sort,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await updateAdminPromotion(editing.id, form);
        toast.success(lang === 'zh' ? '更新成功' : 'Updated successfully');
      } else {
        await createAdminPromotion(form);
        toast.success(lang === 'zh' ? '創建成功' : 'Created successfully');
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      logger.error(`promotion save failed: ${String(err)}`);
      toast.error(lang === 'zh' ? '操作失敗' : 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm(lang === 'zh' ? '確定刪除？' : 'Confirm delete?')) return;
    try {
      await deleteAdminPromotion(id);
      toast.success(lang === 'zh' ? '刪除成功' : 'Deleted successfully');
      loadData();
    } catch (err) {
      logger.error(`promotion delete failed: ${String(err)}`);
      toast.error(lang === 'zh' ? '刪除失敗' : 'Delete failed');
    }
  };

  const handleToggle = async (item: Promotion) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAdminPromotionStatus(item.id, newStatus);
      loadData();
    } catch (err) {
      logger.error(`promotion status failed: ${String(err)}`);
    }
  };

  const statusBadge = (status: string) => {
    const isActive = status === 'active';
    return (
      <Badge
        variant={isActive ? 'default' : 'secondary'}
        className={isActive ? 'bg-accent text-accent-foreground' : ''}
      >
        {isActive
          ? lang === 'zh'
            ? '啟用'
            : 'Active'
          : lang === 'zh'
            ? '停用'
            : 'Inactive'}
      </Badge>
    );
  };

  const scopeLabel = (scope: string) => {
    if (scope === 'all') return lang === 'zh' ? '全部商品' : 'All Products';
    if (scope === 'category') return lang === 'zh' ? '指定分類' : 'By Category';
    if (scope === 'product') return lang === 'zh' ? '指定商品' : 'By Product';
    return scope;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          {lang === 'zh' ? '新增滿減' : 'Add Promotion'}
        </Button>
      </div>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang === 'zh' ? '活動名稱' : 'Name'}</TableHead>
              <TableHead>{lang === 'zh' ? '滿減規則' : 'Rule'}</TableHead>
              <TableHead>{lang === 'zh' ? '生效時間' : 'Valid Period'}</TableHead>
              <TableHead>{lang === 'zh' ? '適用範圍' : 'Scope'}</TableHead>
              <TableHead>{lang === 'zh' ? '疊加' : 'Stackable'}</TableHead>
              <TableHead>{lang === 'zh' ? '狀態' : 'Status'}</TableHead>
              <TableHead className="text-right">
                {lang === 'zh' ? '操作' : 'Actions'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {lang === 'zh' ? item.nameZh : item.nameEn}
                </TableCell>
                <TableCell className="font-mono">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '滿' : 'Spend '}
                  </span>
                  <span className="font-semibold">HK${item.thresholdAmount}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    {lang === 'zh' ? '減' : ' save '}
                  </span>
                  <span className="text-price font-semibold">
                    HK${item.discountAmount}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(item.startTime)}
                  <br />~ {formatDate(item.endTime)}
                </TableCell>
                <TableCell>{scopeLabel(item.applicableScope)}</TableCell>
                <TableCell>
                  <Badge
                    variant={item.allowStack ? 'default' : 'secondary'}
                    className={
                      item.allowStack ? 'bg-accent text-accent-foreground' : ''
                    }
                  >
                    {item.allowStack
                      ? lang === 'zh'
                        ? '可疊加'
                        : 'Yes'
                      : lang === 'zh'
                        ? '不可疊加'
                        : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>{statusBadge(item.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(item)}
                    >
                      {item.status === 'active' ? (
                        <ToggleRight className="w-4 h-4 text-accent" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {lang === 'zh' ? '暫無數據' : 'No data'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? lang === 'zh'
                  ? '編輯滿減活動'
                  : 'Edit Promotion'
                : lang === 'zh'
                  ? '新增滿減活動'
                  : 'Add Promotion'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '名稱（繁中）' : 'Name (ZH)'}</Label>
              <Input
                value={form.nameZh}
                onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '名稱（英文）' : 'Name (EN)'}</Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '滿減門檻（HK$）' : 'Threshold (HK$)'}</Label>
              <Input
                type="number"
                step="0.01"
                value={form.thresholdAmount}
                onChange={(e) =>
                  setForm({ ...form, thresholdAmount: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '減免金額（HK$）' : 'Discount (HK$)'}</Label>
              <Input
                type="number"
                step="0.01"
                value={form.discountAmount}
                onChange={(e) =>
                  setForm({ ...form, discountAmount: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '適用範圍' : 'Applicable Scope'}</Label>
              <Select
                value={form.applicableScope}
                onValueChange={(v) => setForm({ ...form, applicableScope: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {lang === 'zh' ? '全部商品' : 'All Products'}
                  </SelectItem>
                  <SelectItem value="category">
                    {lang === 'zh' ? '指定分類' : 'By Category'}
                  </SelectItem>
                  <SelectItem value="product">
                    {lang === 'zh' ? '指定商品' : 'By Product'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex items-center gap-3 pt-6">
              <Switch
                checked={form.allowStack}
                onCheckedChange={(v) => setForm({ ...form, allowStack: v })}
                id="allow-stack"
              />
              <Label htmlFor="allow-stack">
                {lang === 'zh' ? '允許疊加' : 'Allow Stacking'}
              </Label>
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '開始時間' : 'Start Time'}</Label>
              <Input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '結束時間' : 'End Time'}</Label>
              <Input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '狀態' : 'Status'}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    {lang === 'zh' ? '待啟用' : 'Pending'}
                  </SelectItem>
                  <SelectItem value="active">
                    {lang === 'zh' ? '啟用' : 'Active'}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {lang === 'zh' ? '停用' : 'Inactive'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '排序' : 'Sort Order'}</Label>
              <Input
                type="number"
                value={form.sort}
                onChange={(e) =>
                  setForm({ ...form, sort: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionTab;
