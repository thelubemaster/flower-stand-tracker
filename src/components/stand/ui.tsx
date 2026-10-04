import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function PressButton({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "quiet" | "ghost" }) {
  return (
    <button
      type={type}
      className={cn(
        "tap inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium",
        variant === "primary" && "bg-moss text-card",
        variant === "quiet" && "border border-line bg-card text-ink",
        variant === "ghost" && "text-moss",
        className,
      )}
      {...props}
    />
  );
}

export function Choice({
  selected,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type={type}
      className={cn(
        "tap min-h-11 rounded-full border px-3 text-sm font-medium",
        selected ? "border-moss bg-moss text-card" : "border-line bg-card text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
      {hint && !error ? <span className="text-muted">{hint}</span> : null}
      {error ? (
        <span className="text-clay" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

const controlClass =
  "h-12 w-full rounded-2xl border border-line bg-paper px-3 text-base text-ink outline-none";

export function TextControl({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function AreaControl(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "h-24 py-3")} {...props} />;
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay" />
        <Dialog.Content className="sheet-panel" aria-describedby={description ? undefined : undefined}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="grid gap-1">
              <Dialog.Title className="font-display text-3xl leading-none text-balance text-ink">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-pretty text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="tap grid size-11 shrink-0 place-items-center rounded-full text-muted">
              <X className="size-5" aria-hidden />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
