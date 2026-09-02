import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';


const buttonVariants = cva(
  'border rounded-xl uppercase cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'text-accent bg-secondary hover:bg-accent hover:text-secondary',
        secondary: 'text-secondary bg-background hover:bg-background/80',
        outline: 'text-accent-foreground'
      },
      size: {
          sm: "py-2 px-4 text-sm",
          md: "py-2 px-4",
          lg: "py-4 px-6 text-lg",
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps 
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, 
    VariantProps<typeof buttonVariants> {}


export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';