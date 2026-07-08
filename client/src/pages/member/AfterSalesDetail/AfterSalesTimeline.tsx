import {
  Clock,
  FileText,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TimelineStep {
  key: string;
  icon: LucideIcon;
  labelZh: string;
  labelEn: string;
}

interface AfterSalesTimelineProps {
  type: string;
  status: string;
  lang: 'zh' | 'en';
}

const getTimelineSteps = (type: string): TimelineStep[] => {
  const base: TimelineStep[] = [
    { key: 'pending', icon: Clock, labelZh: '提交申請', labelEn: 'Submitted' },
    { key: 'review', icon: FileText, labelZh: '商家審核', labelEn: 'Merchant Review' },
  ];
  if (type === 'return_refund') {
    base.push({ key: 'returning', icon: Truck, labelZh: '退貨中', labelEn: 'Returning' });
  }
  base.push({ key: 'completed', icon: CheckCircle, labelZh: '退款完成', labelEn: 'Refund Completed' });
  return base;
};

const getStepStatus = (
  stepKey: string,
  status: string,
): 'done' | 'current' | 'pending' => {
  const order = ['pending', 'review', 'returning', 'completed'];
  const currentIdx = order.indexOf(
    status === 'approved' || status === 'refunding' ? 'review' : status,
  );
  const stepIdx = order.indexOf(stepKey);
  if (status === 'rejected') {
    return stepKey === 'review' ? 'current' : stepIdx < 1 ? 'done' : 'pending';
  }
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'current';
  return 'pending';
};

const AfterSalesTimeline = ({ type, status, lang }: AfterSalesTimelineProps) => {
  const steps = getTimelineSteps(type);

  return (
    <div className="flex items-start justify-between relative">
      <div className="absolute top-4 left-8 right-8 h-0.5 bg-border -z-0" />
      {steps.map((step) => {
        const stepStatus = getStepStatus(step.key, status);
        const Icon = step.icon;
        const isRejected = status === 'rejected' && step.key === 'review';
        return (
          <div
            key={step.key}
            className="flex flex-col items-center gap-2 z-10 flex-1"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                stepStatus === 'done'
                  ? 'bg-accent border-accent text-white'
                  : isRejected
                  ? 'bg-red-500 border-red-500 text-white'
                  : stepStatus === 'current'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-border text-muted-foreground'
              }`}
            >
              {isRejected ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            <span
              className={`text-xs text-center ${
                stepStatus === 'done' || stepStatus === 'current'
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {lang === 'zh' ? step.labelZh : step.labelEn}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default AfterSalesTimeline;
