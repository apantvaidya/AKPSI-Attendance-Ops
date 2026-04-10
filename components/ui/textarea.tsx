import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-brand-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-200",
        className,
      )}
      {...props}
    />
  );
}
