"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button, ButtonProps } from "@/components/ui/atoms/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps extends Omit<ButtonProps, "onClick"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showIcon?: boolean;
  label?: string;
}

export default function LogoutButton({
  variant = "ghost",
  showIcon = true,
  label = "Sign out",
  className,
  ...props
}: LogoutButtonProps) {
  const { logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
      {...props}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  );
} 