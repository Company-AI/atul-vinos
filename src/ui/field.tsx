import * as React from "react";
import { cn } from "@/lib/cn";

/** Label siempre visible. Nunca placeholder como label. */
export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[13px] font-medium text-carbon-800",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-stone-500">(requerido)</span>}
    </label>
  );
}

const fieldBase =
  "w-full rounded-sm border bg-bone-pure px-3 text-sm text-carbon-900 placeholder:text-stone-400 " +
  "transition-colors duration-[160ms] focus:border-carbon-900 disabled:bg-linen-100 disabled:text-stone-500";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      fieldBase,
      "h-11",
      invalid ? "border-danger-500" : "border-linen-300",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      fieldBase,
      "min-h-24 py-2.5 leading-relaxed",
      invalid ? "border-danger-500" : "border-linen-300",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, children, ...props }, ref) => (
  <select
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      fieldBase,
      "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><path d=%22M2 4.5 6 8.5 10 4.5%22 fill=%22none%22 stroke=%22%236E675D%22 stroke-width=%221.2%22/></svg>')] bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
      invalid ? "border-danger-500" : "border-linen-300",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] text-danger-500">
      {children}
    </p>
  );
}

export function Field({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-[13px] text-stone-500">{hint}</p>}
      <FieldError id={htmlFor ? `${htmlFor}-error` : undefined}>{error}</FieldError>
    </div>
  );
}

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 shrink-0 rounded-xs border border-linen-300 bg-bone-pure",
        "accent-wine-700 transition-colors",
        className,
      )}
      {...props}
    />
  );
}
