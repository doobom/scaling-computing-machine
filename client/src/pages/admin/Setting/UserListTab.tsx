import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  User,
  UserX,
  UserCheck,
  Edit3,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Badge } from '@client/src/components/ui/badge';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Label } from '@client/src/components/ui/label';
import {
  getAdminMembers,
  updateMemberStatus,
  updateMemberLevel,
  getMemberLevels,
} from '@client/src/api/member';
import type { AdminMember, MemberLevel } from '@client/src/api/member';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  disabled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  active: { zh: '正常', en: 'Active' },
  disabled: { zh: '已禁用', en: 'Disabled' },
};

interface UserListTabProps {
  lang: 'zh' | 'en';
}

const UserListTab = ({ lang }: UserListTabProps) => {
  const [users, setUsers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [levelSelectOpen, setLevelSelectOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<AdminMember | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminMembers({
        page,
        pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('Failed to load admin members', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, statusFilter]);

  const loadLevels = useCallback(async () => {
    try {
      const res = await getMemberLevels();
      setLevels(res);
    } catch (err) {
      logger.error('Failed to load member levels', err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadLevels();
  }, [loadUsers, loadLevels]);

  useEffect(() => {
    setPage(1);
  }, [keyword, statusFilter]);

  const handleToggleStatus = async (user: AdminMember) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      await updateMemberStatus(user.id, newStatus);
      toast.success(lang === 'zh' ? '狀態已更新' : 'Status updated');
      loadUsers();
    } catch (err) {
      logger.error('Failed to update status', err);
      toast.error(lang === 'zh' ? '操作失敗' : 'Operation failed');
    }
  };

  const handleOpenLevelSelect = (user: AdminMember) => {
    setTargetUser(user);
    setSelectedLevelId(user.memberLevelId || '');
    setLevelSelectOpen(true);
  };

  const handleConfirmLevel = async () => {
    if (!targetUser) return;
    try {
      await updateMemberLevel(targetUser.id, selectedLevelId);
      toast.success(lang === 'zh' ? '等級已調整' : 'Level updated');
      setLevelSelectOpen(false);
      loadUsers();
    } catch (err) {
      logger.error('Failed to update level', err);
      toast.error(lang === 'zh' ? '操作失敗' : 'Operation failed');
    }
  };

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? Number(val) : val;
    return `HK$${num.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-HK');
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={lang === 'zh' ? '搜索暱稱/手機/電郵' : 'Search name/phone/email'}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={lang === 'zh' ? '全部狀態' : 'All Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{lang === 'zh' ? '全部狀態' : 'All Status'}</SelectItem>
              <SelectItem value="active">{lang === 'zh' ? '正常' : 'Active'}</SelectItem>
              <SelectItem value="disabled">{lang === 'zh' ? '已禁用' : 'Disabled'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === 'zh' ? '用戶' : 'User'}</TableHead>
                  <TableHead>{lang === 'zh' ? '手機' : 'Phone'}</TableHead>
                  <TableHead>{lang === 'zh' ? '會員等級' : 'Level'}</TableHead>
                  <TableHead>{lang === 'zh' ? '累計消費' : 'Total Spent'}</TableHead>
                  <TableHead>{lang === 'zh' ? '狀態' : 'Status'}</TableHead>
                  <TableHead>{lang === 'zh' ? '註冊時間' : 'Registered'}</TableHead>
                  <TableHead className="text-right">{lang === 'zh' ? '操作' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">
                          {user.nickname || (lang === 'zh' ? '會員' : 'Member')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {user.phone || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        {lang === 'zh'
                          ? user.memberLevel?.nameZh || '普通會員'
                          : user.memberLevel?.nameEn || 'Normal'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-price font-semibold">
                      {formatPrice(user.totalConsumption)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_COLORS[user.status] || ''}`}
                      >
                        {STATUS_LABELS[user.status]
                          ? lang === 'zh'
                            ? STATUS_LABELS[user.status].zh
                            : STATUS_LABELS[user.status].en
                          : user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenLevelSelect(user)}
                          title={lang === 'zh' ? '調整等級' : 'Adjust level'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === 'active'
                            ? (lang === 'zh' ? '禁用' : 'Disable')
                            : (lang === 'zh' ? '解封' : 'Enable')}
                          className={user.status === 'active' ? 'text-destructive hover:text-destructive' : 'text-accent hover:text-accent'}
                        >
                          {user.status === 'active' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* 调整等级弹窗 */}
      <Dialog open={levelSelectOpen} onOpenChange={setLevelSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lang === 'zh' ? '調整會員等級' : 'Adjust Member Level'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="text-sm text-muted-foreground">
              {lang === 'zh' ? '用戶：' : 'User: '}
              <span className="text-foreground font-medium">
                {targetUser?.nickname || (lang === 'zh' ? '會員' : 'Member')}
              </span>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'zh' ? '選擇等級' : 'Select Level'}</Label>
              <Select value={selectedLevelId} onValueChange={setSelectedLevelId}>
                <SelectTrigger>
                  <SelectValue placeholder={lang === 'zh' ? '請選擇' : 'Select'} />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((lvl) => (
                    <SelectItem key={lvl.id} value={lvl.id}>
                      {lang === 'zh' ? lvl.nameZh : lvl.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{lang === 'zh' ? '取消' : 'Cancel'}</Button>
            </DialogClose>
            <Button onClick={handleConfirmLevel}>
              {lang === 'zh' ? '確認' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserListTab;
