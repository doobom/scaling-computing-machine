import { Clock, User, Monitor, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import { useLanguage } from '@client/src/hooks/useLanguage';

interface OperationLogItem {
  id: string;
  adminId: string;
  adminName?: string;
  operationType: string;
  targetType: string;
  targetId: string;
  content: string;
  ipAddress: string;
  beforeValue: Record<string, unknown>;
  afterValue: Record<string, unknown>;
  createdAt: string;
}

const OPERATION_TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  create: { zh: '創建', en: 'Create' },
  update: { zh: '更新', en: 'Update' },
  delete: { zh: '刪除', en: 'Delete' },
  ship: { zh: '發貨', en: 'Ship' },
  cancel: { zh: '取消', en: 'Cancel' },
  refund: { zh: '退款', en: 'Refund' },
  approve: { zh: '審核通過', en: 'Approve' },
  reject: { zh: '拒絕', en: 'Reject' },
  price_change: { zh: '改價', en: 'Price Change' },
  status_change: { zh: '狀態變更', en: 'Status Change' },
};

const TARGET_TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  order: { zh: '訂單', en: 'Order' },
  product: { zh: '商品', en: 'Product' },
  coupon: { zh: '優惠券', en: 'Coupon' },
  after_sales: { zh: '售後單', en: 'After-Sales' },
  user: { zh: '用戶', en: 'User' },
};

interface OperationLogTableProps {
  items: OperationLogItem[];
  loading: boolean;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}

const OperationLogTable = ({
  items,
  loading,
  expandedId,
  onToggleExpand,
}: OperationLogTableProps) => {
  const { lang } = useLanguage();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-HK');
  };

  const opTypeLabel = (type: string) => {
    const label = OPERATION_TYPE_LABELS[type];
    return label ? (lang === 'zh' ? label.zh : label.en) : type;
  };

  const targetTypeLabel = (type: string) => {
    const label = TARGET_TYPE_LABELS[type];
    return label ? (lang === 'zh' ? label.zh : label.en) : type;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-40">{lang === 'zh' ? '時間' : 'Time'}</TableHead>
          <TableHead>{lang === 'zh' ? '操作人' : 'Operator'}</TableHead>
          <TableHead>{lang === 'zh' ? '操作類型' : 'Operation'}</TableHead>
          <TableHead>{lang === 'zh' ? '操作對象' : 'Target'}</TableHead>
          <TableHead>{lang === 'zh' ? 'IP 位址' : 'IP Address'}</TableHead>
          <TableHead>{lang === 'zh' ? '詳情' : 'Detail'}</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center py-8 text-muted-foreground"
            >
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </TableCell>
          </TableRow>
        ) : items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center py-8 text-muted-foreground"
            >
              {lang === 'zh' ? '暫無數據' : 'No data'}
            </TableCell>
          </TableRow>
        ) : (
          items.map((log) => (
            <>
              <TableRow key={log.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(log.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm">
                      {log.adminName || log.adminId.slice(0, 8)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {opTypeLabel(log.operationType)}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{targetTypeLabel(log.targetType)}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                    {log.targetId?.slice(0, 12)}...
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
                    <Monitor className="w-3.5 h-3.5" />
                    {log.ipAddress || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {log.content || '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpand(log.id)}
                  >
                    {expandedId === log.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
              {expandedId === log.id && (
                <TableRow key={`${log.id}-detail`}>
                  <TableCell colSpan={7} className="bg-muted/30">
                    <div className="grid grid-cols-2 gap-4 p-4">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          {lang === 'zh' ? '操作前' : 'Before'}
                        </div>
                        <pre className="text-xs bg-card p-3 rounded-md border border-border overflow-auto max-h-48">
                          {JSON.stringify(log.beforeValue || {}, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          {lang === 'zh' ? '操作後' : 'After'}
                        </div>
                        <pre className="text-xs bg-card p-3 rounded-md border border-border overflow-auto max-h-48">
                          {JSON.stringify(log.afterValue || {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default OperationLogTable;
