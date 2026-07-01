"use client";

import type { OrgEquityAnchorItem, OrgEquityAnchors } from "@/lib/api";
import { SectionCard } from "@/components/ui-kit/cards";
import { DataTable } from "@/components/ui-kit/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SectionDef = {
  id: string;
  title: string;
  description: string;
  items: OrgEquityAnchorItem[];
};

function AnchorTable({
  sectionId,
  items,
}: {
  sectionId: string;
  items: OrgEquityAnchorItem[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No synced evidence rows for this security yet.
      </p>
    );
  }
  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead>Signal</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Detail</TableHead>
          <TableHead className="text-right">As of</TableHead>
          <TableHead>Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, i) => (
          <TableRow key={item.id ?? `${sectionId}-${i}`}>
            <TableCell className="font-medium">{item.label}</TableCell>
            <TableCell className="font-mono tabular-nums text-sm">{item.value}</TableCell>
            <TableCell className="max-w-xs text-sm text-muted-foreground">
              {item.detail ?? "—"}
            </TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
              {item.as_of ? new Date(item.as_of).toLocaleDateString() : "—"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{item.source}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}

export function ScoreEvidenceAnchorsPanel({ anchors }: { anchors: OrgEquityAnchors }) {
  const sections: SectionDef[] = [
    {
      id: "anchor-insider",
      title: "Insider buying",
      description: "Recent open-market and Form 4 insider transactions.",
      items: anchors.insider,
    },
    {
      id: "anchor-flows",
      title: "Institutional & policy flows",
      description:
        "Congressional disclosures and aggregated theme flow signals (13F ticker holdings sync planned).",
      items: anchors.hedge_fund,
    },
    {
      id: "anchor-earnings",
      title: "Earnings revisions",
      description: "Fundamental revision drivers behind the constriction score.",
      items: anchors.earnings,
    },
    {
      id: "anchor-macro",
      title: "Macro exposures",
      description: "Structural theme exposures with direction and strength.",
      items: anchors.macro,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Evidence anchors</h2>
        <p className="text-sm text-muted-foreground">
          Verifiable market facts behind the AI scores — insider activity, flows, earnings, and
          macro themes. Scores synthesize these; they are not a black box.
        </p>
      </div>
      {sections.map((section) => (
        <SectionCard key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
          <AnchorTable sectionId={section.id} items={section.items} />
        </SectionCard>
      ))}
    </div>
  );
}
