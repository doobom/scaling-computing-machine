import { cn } from '@/lib/utils';

/**
 * Skeleton 基础组件（灰色渐变 shimmer 动画占位）
 */
function Skeleton({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden bg-muted rounded-md',
        className,
      )}
      {...props}
    >
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
        style={{ animation: 'skeleton-shimmer 1.5s infinite' }}
      />
      <style jsx>{`
        @keyframes skeleton-shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * SkeletonCard：商品卡片骨架（图片+标题+价格占位）
 */
function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-card rounded-lg border border-border overflow-hidden ${className}`}>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonList：列表骨架行
 */
function SkeletonList({
  count = 5,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
        >
          <Skeleton className="w-14 h-14 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="w-16 h-6 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonDetail：商品详情页骨架布局
 */
function SkeletonDetail() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 图片区骨架 */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 rounded-md" />
            ))}
          </div>
        </div>
        {/* 信息区骨架 */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16 rounded-md" />
              ))}
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonList, SkeletonDetail };
