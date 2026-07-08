import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
} from 'lucide-react';
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
  getAdminBannerList,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  updateAdminBannerStatus,
  type Banner,
  type BannerFormData,
} from '@client/src/api/marketing';
import { showConfirm } from '@lark-apaas/client-toolkit';

const emptyForm: BannerFormData = {
  imageUrl: '',
  titleZh: '',
  titleEn: '',
  subtitleZh: '',
  subtitleEn: '',
  jumpUrl: '',
  sort: 0,
  status: 'enabled',
};

const BannerTab = () => {
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<Banner[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerFormData>(emptyForm);

  const loadData = async () => {
    try {
      const res = await getAdminBannerList({ page: 1, pageSize: 50 });
      setItems(res.items);
    } catch (err) {
      logger.error(`load banners failed: ${String(err)}`);
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

  const openEdit = (item: Banner) => {
    setEditing(item);
    setForm({
      imageUrl: item.imageUrl,
      titleZh: item.titleZh,
      titleEn: item.titleEn,
      subtitleZh: item.subtitleZh,
      subtitleEn: item.subtitleEn,
      jumpUrl: item.jumpUrl,
      sort: item.sort,
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await updateAdminBanner(editing.id, form);
        toast.success(lang === 'zh' ? '更新成功' : 'Updated successfully');
      } else {
        await createAdminBanner(form);
        toast.success(lang === 'zh' ? '創建成功' : 'Created successfully');
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      logger.error(`banner save failed: ${String(err)}`);
      toast.error(lang === 'zh' ? '操作失敗' : 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm(lang === 'zh' ? '確定刪除？' : 'Confirm delete?')) return;
    try {
      await deleteAdminBanner(id);
      toast.success(lang === 'zh' ? '刪除成功' : 'Deleted successfully');
      loadData();
    } catch (err) {
      logger.error(`banner delete failed: ${String(err)}`);
      toast.error(lang === 'zh' ? '刪除失敗' : 'Delete failed');
    }
  };

  const handleToggle = async (item: Banner) => {
    const newStatus = item.status === 'enabled' ? 'disabled' : 'enabled';
    try {
      await updateAdminBannerStatus(item.id, newStatus);
      loadData();
    } catch (err) {
      logger.error(`banner status failed: ${String(err)}`);
    }
  };

  const statusBadge = (status: string) => {
    const isActive = status === 'enabled';
    return (
      <Badge
        variant={isActive ? 'default' : 'secondary'}
        className={isActive ? 'bg-accent text-accent-foreground' : ''}
      >
        {isActive
          ? lang === 'zh'
            ? '顯示'
            : 'Enabled'
          : lang === 'zh'
            ? '隱藏'
            : 'Disabled'}
      </Badge>
    );
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          {lang === 'zh' ? '新增輪播圖' : 'Add Banner'}
        </Button>
      </div>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">
                {lang === 'zh' ? '預覽' : 'Preview'}
              </TableHead>
              <TableHead>{lang === 'zh' ? '標題' : 'Title'}</TableHead>
              <TableHead>{lang === 'zh' ? '跳轉鏈接' : 'Jump URL'}</TableHead>
              <TableHead className="w-20">
                {lang === 'zh' ? '排序' : 'Sort'}
              </TableHead>
              <TableHead>{lang === 'zh' ? '狀態' : 'Status'}</TableHead>
              <TableHead className="text-right">
                {lang === 'zh' ? '操作' : 'Actions'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="w-20 h-12 rounded bg-muted/50 overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.titleZh ?? ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {lang === 'zh' ? item.titleZh : item.titleEn}
                  <div className="text-xs text-muted-foreground">
                    {lang === 'zh' ? item.subtitleZh : item.subtitleEn}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {item.jumpUrl || '-'}
                </TableCell>
                <TableCell>{item.sort}</TableCell>
                <TableCell>{statusBadge(item.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(item)}
                    >
                      {item.status === 'enabled' ? (
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
                  colSpan={6}
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
                  ? '編輯輪播圖'
                  : 'Edit Banner'
                : lang === 'zh'
                  ? '新增輪播圖'
                  : 'Add Banner'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>{lang === 'zh' ? '圖片鏈接' : 'Image URL'}</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '標題（繁中）' : 'Title (ZH)'}</Label>
              <Input
                value={form.titleZh ?? ''}
                onChange={(e) => setForm({ ...form, titleZh: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '標題（英文）' : 'Title (EN)'}</Label>
              <Input
                value={form.titleEn ?? ''}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '副標題（繁中）' : 'Subtitle (ZH)'}</Label>
              <Input
                value={form.subtitleZh ?? ''}
                onChange={(e) =>
                  setForm({ ...form, subtitleZh: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === 'zh' ? '副標題（英文）' : 'Subtitle (EN)'}</Label>
              <Input
                value={form.subtitleEn ?? ''}
                onChange={(e) =>
                  setForm({ ...form, subtitleEn: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>{lang === 'zh' ? '跳轉鏈接' : 'Jump URL'}</Label>
              <Input
                value={form.jumpUrl ?? ''}
                onChange={(e) => setForm({ ...form, jumpUrl: e.target.value })}
                placeholder="/products or https://..."
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
                  <SelectItem value="enabled">
                    {lang === 'zh' ? '顯示' : 'Enabled'}
                  </SelectItem>
                  <SelectItem value="disabled">
                    {lang === 'zh' ? '隱藏' : 'Disabled'}
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

export default BannerTab;
