import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";

export function EntitlementsMatrixSkeleton({ planCount = 4 }: { planCount?: number }) {
  const planCols = Math.max(1, planCount);
  const rowCount = 6;

  return (
    <div className="overflow-x-auto" aria-busy="true" aria-label="Loading entitlements matrix">
      <DataTable stickyHeader className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-20 min-w-[200px] bg-muted/60">
              <LoadingSkeleton className="h-4 w-24" />
            </TableHead>
            {Array.from({ length: planCols }).map((_, i) => (
              <TableHead key={i} className="min-w-[140px] text-center">
                <LoadingSkeleton className="mx-auto h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, row) => (
            <TableRow key={row}>
              <TableCell className="sticky left-0 z-10 bg-card">
                <LoadingSkeleton className="h-10 w-40" />
              </TableCell>
              {Array.from({ length: planCols }).map((_, col) => (
                <TableCell key={col} className="text-center">
                  <LoadingSkeleton className="mx-auto h-8 w-16" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}
