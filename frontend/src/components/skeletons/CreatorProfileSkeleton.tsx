import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CreatorProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Profile Header Skeleton */}
        <Card className="glass-card">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-8 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-8 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-8 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading & Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-40" />
            {[1, 2].map((i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

