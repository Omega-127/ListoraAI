import * as React from "react";
import { cn } from "../../lib/cn";
import { focus } from "../../lib/styles";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-lg";
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-[var(--primary)] text-[var(--primary-foreground)] shadow hover:brightness-110",
  destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
  outline: "border border-[var(--border)] bg-transparent hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 text-[var(--foreground)]",
  secondary: "bg-white/10 text-[var(--foreground)] hover:bg-white/15",
  ghost: "hover:bg-white/10 text-[var(--foreground)]",
  link: "text-[var(--primary)] underline-offset-4 hover:underline",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8 text-base",
  icon: "h-9 w-9 p-0",
  "icon-lg": "h-9 w-9 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          focus,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
