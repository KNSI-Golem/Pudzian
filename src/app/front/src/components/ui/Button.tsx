import React from 'react';
import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/types';

const buttonVariants = {
  primary: "golem-button py-3 px-8 rounded-lg font-golem",
  secondary: "bg-gray-600 hover:bg-gray-500 text-white py-3 px-8 rounded-lg font-golem",
  outline: "border-2 border-gray-400 hover:border-white text-gray-400 hover:text-white py-3 px-8 rounded-lg font-golem",
};

const buttonSizes = {
  sm: "py-2 px-4 text-sm",
  md: "py-3 px-6",
  lg: "py-4 px-8 text-lg",
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  ...props
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        buttonVariants[variant],
        buttonSizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        "transition-all duration-300 uppercase",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}