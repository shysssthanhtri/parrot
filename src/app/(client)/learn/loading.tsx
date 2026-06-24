import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearnLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden w-full items-center">
      <div className="relative flex h-full min-h-0 w-full items-center justify-center px-4 md:max-w-[600px]">
        <div className="h-full max-h-[500px] md:max-h-[560px] w-full md:max-w-[400px]">
          <Card className="flex h-full w-full flex-col overflow-hidden pt-0">
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <Skeleton className="size-full rounded-none" />
            </div>
            <CardHeader className="shrink-0 space-y-3 text-center">
              <Skeleton className="mx-auto h-6 w-3/5" />
              <Skeleton className="mx-auto h-4 w-2/5" />
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
