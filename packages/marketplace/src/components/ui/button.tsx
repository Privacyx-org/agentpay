import * as React from "react";
import { cn } from "./utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-railent text-black hover:brightness-110 shadow-[0_0_0_1px_rgba(34,158,255,0.25),0_10px_30px_rgba(34,158,255,0.12)]",
  secondary:
    "bg-white/8 text-white hover:bg-white/12 border border-white/10",
  ghost: "text-white/80 hover:bg-white/8",
  danger: "bg-red-500/15 text-red-200 hover:bg-red-500/20 border border-red-500/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
