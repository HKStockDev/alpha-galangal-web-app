"use client";

import * as React from "react";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps = {
  children: React.ReactNode;
  className?: string;
  tableClassName?: string;
  stickyHeader?: boolean;
};

export function DataTable({
  children,
  className,
  tableClassName,
  stickyHeader = false,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-sm text-card-foreground shadow-sm",
        className
      )}
    >
      <Table
        className={cn(
          "[&_thead_th]:h-10 [&_thead_th]:bg-muted/60 [&_thead_th]:px-3 [&_thead_th]:py-2 [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-wide [&_thead_th]:text-muted-foreground [&_tbody_tr]:border-b [&_tbody_tr]:border-border/70 [&_tbody_tr:last-child]:border-0 [&_tbody_tr:hover]:bg-muted/40 [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle [&_td.text-right]:tabular-nums",
          stickyHeader && "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10",
          tableClassName
        )}
      >
        {children}
      </Table>
    </div>
  );
}
