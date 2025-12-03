import { Skeleton } from "@/components/ui/skeleton";

interface StatValueSkeletonProps {
  className?: string;
}

export function StatValueSkeleton({ className = "h-8 w-full max-w-[10rem]" }: StatValueSkeletonProps) {
  return <Skeleton className={className} />;
}

