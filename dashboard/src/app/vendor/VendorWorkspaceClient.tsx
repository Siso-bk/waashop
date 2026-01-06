"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ServicesSectionClient, SERVICES } from "./ServicesSectionClient";

type VendorWorkspaceClientProps = {
  sections: Record<string, React.ReactNode>;
};

export function VendorWorkspaceClient({ sections }: VendorWorkspaceClientProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const activeSection = useMemo(() => {
    if (!activeId) return null;
    return sections[activeId] ?? null;
  }, [activeId, sections]);

  useEffect(() => {
    if (!activeId || !detailRef.current) return;
    detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeId]);

  return (
    <div className="space-y-6">
      <ServicesSectionClient activeId={activeId} onChange={setActiveId} />
      {activeSection ? <div ref={detailRef}>{activeSection}</div> : null}
    </div>
  );
}
