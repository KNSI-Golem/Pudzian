import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';


const buttonVariants = cva(
  'border py-3 px-2 rounded-sm uppercase',
  {
    variants: {
      variant: {
        primary: 'text-accent bg-primary hover:bg-primary/90',
        secondary: 'text-black bg-secondary hover:bg-secondary/90',
        outline: 'text-accent bg-background hover:bg-accent hover:text-accent-foregound'
      },
      size: {
          sm: "py-2 px-4 text-sm",
          md: "py-3 px-6",
          lg: "py-4 px-8 text-lg",
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