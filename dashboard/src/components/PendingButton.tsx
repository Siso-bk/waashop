"use client";

import { useFormStatus } from "react-dom";

interface Props {
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  showProgress?: boolean;
  progressClassName?: string;
}

export function PendingButton({
  children,
  pendingLabel,
  className = "",
  disabled,
  showProgress = false,
  progressClassName = "",
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`${className} ${pending ? "opacity-70" : ""} ${
        showProgress ? "relative overflow-hidden" : ""
      }`.trim()}
      aria-busy={pending ? "true" : undefined}
      suppressHydrationWarning
    >
      {pending && pendingLabel ? pendingLabel : children}
      {pending && showProgress && (
        <span
          className={`absolute inset-x-2 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/25 ${progressClassName}`.trim()}
        >
          <span className="block h-full w-1/3 animate-nav-progress rounded-full bg-white" />
        </span>
      )}
    </button>
  );
}
