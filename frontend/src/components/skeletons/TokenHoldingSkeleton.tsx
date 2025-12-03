import { Skeleton } from "@/components/ui/skeleton";

interface TokenHoldingSkeletonProps {
  count?: number;
}

export function TokenHoldingSkeleton({ count = 3 }: TokenHoldingSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border"
        >
          <div className="flex items-center space-x-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-5 w-16 ml-auto" />
            <Skeleton className="h-4 w-12 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

