import { Container } from "@/ui/layout";
import { Skeleton, SkeletonWineCard } from "@/ui/skeleton";

export default function VinosLoading() {
  return (
    <Container className="pb-section pt-4">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-4 h-12 w-2/3 max-w-md" />
      <Skeleton className="mt-5 h-4 w-full max-w-xl" />

      <div className="mt-14 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
        <div className="hidden space-y-6 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}><SkeletonWineCard /></li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
