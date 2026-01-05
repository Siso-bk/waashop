"use client";

import { useMemo, useState } from "react";
import { ServicesSectionClient, SERVICES } from "./ServicesSectionClient";

type VendorWorkspaceClientProps = {
  sections: Record<string, React.ReactNode>;
};

export function VendorWorkspaceClient({ sections }: VendorWorkspaceClientProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeSection = useMemo(() => {
    if (!activeId) return null;
    return sections[activeId] ?? null;
  }, [activeId, sections]);

  return (
    <div className="space-y-6">
      <ServicesSectionClient activeId={activeId} onChange={setActiveId} />
      {activeSection}
    </div>
  );
}
