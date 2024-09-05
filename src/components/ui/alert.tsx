import React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";

interface AlertProps {
  children: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = "default",
  className,
}) => {
  return (
    <AlertDialog.Root>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
        <AlertDialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-4 shadow-lg",
            variant === "destructive" && "border-red-500 border-2",
            className
          )}
        >
          {children}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <AlertDialog.Title
    className={cn("mb-2 text-lg font-semibold", className)}
    {...props}
  >
    {children}
  </AlertDialog.Title>
);

export const AlertDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ children, className, ...props }) => (
  <AlertDialog.Description
    className={cn("text-sm text-gray-500", className)}
    {...props}
  >
    {children}
  </AlertDialog.Description>
);
