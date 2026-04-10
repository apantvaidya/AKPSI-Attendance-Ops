import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-brand-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-200",
        className,
      )}
      {...props}
    />
  );
}
