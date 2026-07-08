import { useState, useEffect, useCallback } from 'react';
import { Crown, Plus, Edit3, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Badge } from '@client/src/components/ui/badge';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Label } from '@client/src/components/ui/label';
import {
  getMemberLevels,
  createMemberLevel,
  updateMemberLevelInfo,
  deleteMemberLevel,
} from '@client/src/api/member';
import type { MemberLevel } from '@client/src/api/member';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { showConfirm } from '@lark-apaas/client-toolkit';

interface LevelManageTabProps {
  lang: 'zh' | 'en';
}

const LevelManageTab = ({ lang }: LevelManageTabProps) => {
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<MemberLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nameZh: '',
    nameEn: '',
    minConsumption: '0',
    discountRate: '1.00',
    iconUrl: '',
    sort: 0,
  });

  const loadLevels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMemberLevels();
      setLevels(res);
    } catch (err) {
      logger.error('Failed to load member levels', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const openCreate = () => {
    setEditingLevel(null);
    setForm({
      nameZh: '',
      nameEn: '',
      minConsumption: '0',
      discountRate: '1.00',
      iconUrl: '',
      sort: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (level: MemberLevel) => {
    setEditingLevel(level);
    setForm({
      nameZh: level.nameZh,
      nameEn: level.nameEn,
      minConsumption: level.minConsumption,
      discountRate: level.discountRate,
      iconUrl: level.iconUrl || '',
      sort: level.sort ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingLevel) {
        await updateMemberLevelInfo(editingLevel.id, form);
        toast.success(lang === 'zh' ? '等級已更新' : 'Level updated');
      } else {
        await createMemberLevel(form);
        toast.success(lang === 'zh' ? '等級已創建' : 'Level created');
      }
      setDialogOpen(false);
      loadLevels();
    } catch (err) {
      logger.error('Failed to save level', err);
      toast.error(lang === 'zh' ? '保存失敗' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm(lang === 'zh' ? '確定刪除此等級？' : 'Delete this level?')) return;
    try {
      await deleteMemberLevel(id);
      toast.success(lang === 'zh' ? '已刪除' : 'Deleted');
      loadLevels();
    } catch (err) {
      logger.error('Failed to delete level', err);
      toast.error(lang === 'zh' ? '刪除失敗' : 'Delete failed');
    }
  };

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? Number(val) : val;
    return `HK$${num.toFixed(2)}`;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-foreground">
            {lang === 'zh' ? '會員等級配置' : 'Member Level Configuration'}
          </h3>
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {lang === 'zh' ? '新增等級' : 'Add Level'}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {levels.map((level) => (
              <Card
                key={level.id}
                className="border border-border hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          {lang === 'zh' ? level.nameZh : level.nameEn}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {lang === 'zh' ? '門檻：' : 'Threshold: '}
                          {formatPrice(level.minConsumption)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={level.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'}
                    >
                      {level.status === 'active'
                        ? (lang === 'zh' ? '啟用' : 'Active')
                        : (lang === 'zh' ? '停用' : 'Inactive')}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {lang === 'zh' ? '折扣率：' : 'Discount: '}
                    <span className="text-price font-semibold font-mono">
                      {Number(level.discountRate) * 100}%
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(level)}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      {lang === 'zh' ? '編輯' : 'Edit'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(level.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLevel
                ? (lang === 'zh' ? '編輯會員等級' : 'Edit Member Level')
                : (lang === 'zh' ? '新增會員等級' : 'Add Member Level')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{lang === 'zh' ? '名稱（中文）' : 'Name (ZH)'}</Label>
                <Input
                  value={form.nameZh}
                  onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'zh' ? '名稱（英文）' : 'Name (EN)'}</Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{lang === 'zh' ? '消費門檻 (HK$)' : 'Min Consumption (HK$)'}</Label>
                <Input
                  type="number"
                  value={form.minConsumption}
                  onChange={(e) => setForm({ ...form, minConsumption: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'zh' ? '折扣率 (0.00-1.00)' : 'Discount Rate'}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.discountRate}
                  onChange={(e) => setForm({ ...form, discountRate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'zh' ? '排序' : 'Sort Order'}</Label>
              <Input
                type="number"
                value={form.sort}
                onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'zh' ? '圖標 URL' : 'Icon URL'}</Label>
              <Input
                value={form.iconUrl}
                onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{lang === 'zh' ? '取消' : 'Cancel'}</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {lang === 'zh' ? '保存' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LevelManageTab;
