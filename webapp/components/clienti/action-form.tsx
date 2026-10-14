"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { EsitoAzione } from "./format";

interface ActionFormProps {
  action: (fd: FormData) => Promise<EsitoAzione>;
  submitLabel: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
  variant?: "default" | "outline" | "secondary" | "destructive";
  size?: "default" | "sm";
  className?: string;
}

/** Form che chiama una Server Action e mostra l'errore in pagina. */
export function ActionForm({
  action,
  submitLabel,
  children,
  onSuccess,
  resetOnSuccess = true,
  variant = "default",
  size = "default",
  className,
}: ActionFormProps) {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <form
      className={className ?? "flex flex-col gap-3"}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        setError(null);
        start(async () => {
          const res = await action(fd);
          if (res?.error) {
            setError(res.error);
            return;
          }
          if (resetOnSuccess) form.reset();
          onSuccess?.();
        });
      }}
    >
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" variant={variant} size={size} disabled={pending}>
        {pending ? "Un attimo..." : submitLabel}
      </Button>
    </form>
  );
}

export function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
