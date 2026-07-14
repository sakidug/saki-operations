import { AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useFormContext, type FieldValues } from 'react-hook-form';
import { cn } from '@saki-operations/ui';

import { flattenFieldErrors } from './focus-first-invalid';

export type ValidationSummaryProps = {
  title?: string;
  className?: string;
  /** Only show after submit was attempted. Default true. */
  onlyAfterSubmit?: boolean;
};

/**
 * Top-of-form validation summary for screen readers and quick scanning.
 */
export function ValidationSummary({
  title = 'Please fix the following',
  className,
  onlyAfterSubmit = true,
}: ValidationSummaryProps) {
  const {
    formState: { errors, isSubmitted, submitCount },
  } = useFormContext<FieldValues>();
  const reduceMotion = useReducedMotion();
  const items = flattenFieldErrors(errors);
  const visible = items.length > 0 && (!onlyAfterSubmit || isSubmitted || submitCount > 0);

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
          className={cn(
            'glass rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-left',
            className,
          )}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            <span>{title}</span>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
            {items.map((item) => (
              <li key={item.name}>
                <a
                  href={`#`}
                  className="underline-offset-2 hover:underline"
                  onClick={(event) => {
                    event.preventDefault();
                    const target = document.querySelector<HTMLElement>(
                      `[data-field-name="${CSS.escape(item.name)}"], [name="${CSS.escape(item.name)}"]`,
                    );
                    target?.focus();
                    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                  }}
                >
                  {item.message}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
