"use client";

import { useCallback } from "react";
import { PendingButton } from "@/components/PendingButton";

type ClearImageFormClientProps = {
  action: (formData: FormData) => void;
  winnerId: string;
  status: "PENDING" | "PUBLISHED";
};

export function ClearImageFormClient({ action, winnerId, status }: ClearImageFormClientProps) {
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm("Clear this winner image?")) {
      event.preventDefault();
    }
  }, []);

  return (
    <form action={action} onSubmit={handleSubmit} className="mt-2">
      <input type="hidden" name="winnerId" value={winnerId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="imageUrl" value="" />
      <PendingButton pendingLabel="Clearing..." className="text-xs font-semibold text-slate-500">
        Clear image
      </PendingButton>
    </form>
  );
}
