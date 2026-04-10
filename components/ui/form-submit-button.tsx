"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type Props = {
  idleLabel: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
};

export function FormSubmitButton({
  idleLabel,
  pendingLabel,
  variant,
  className,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button className={className} variant={variant} type="submit" disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
