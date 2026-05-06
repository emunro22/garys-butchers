import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const inputBase =
  'w-full bg-transparent border border-ink-900/20 rounded-none px-4 h-11 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-ink-900 transition-colors';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputBase, className)} {...props} />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(inputBase, 'h-auto py-3 min-h-[120px] leading-relaxed', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Label = ({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) => (
  <label htmlFor={htmlFor} className={cn('eyebrow text-ink-500 block mb-2', className)}>
    {children}
  </label>
);
