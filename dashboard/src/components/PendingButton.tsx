"use client";

import { useFormStatus } from "react-dom";

interface Props {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function PendingButton({ children, pendingLabel, className = "", disabled }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`${className} ${pending ? "opacity-70" : ""}`.trim()}
      aria-busy={pending ? "true" : undefined}
      suppressHydrationWarning
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
