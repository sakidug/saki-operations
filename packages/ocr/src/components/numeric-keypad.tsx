import { Delete } from 'lucide-react';
import { Button, cn } from '@saki-operations/ui';

type NumericKeypadProps = {
  value: string;
  onChange: (next: string) => void;
  /** Max digit length (default 8) */
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  labels?: {
    backspace: string;
  };
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

/**
 * Large-digit numeric entry for field ops — keeps eyes near the photo.
 */
export function NumericKeypad({
  value,
  onChange,
  maxLength = 8,
  className,
  disabled = false,
  labels = { backspace: 'Backspace' },
}: NumericKeypadProps) {
  const press = (key: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (key === '') return;
    if (key === 'back') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= maxLength) return;
    onChange(`${value}${key}`);
  };

  return (
    <div
      className={cn('grid grid-cols-3 gap-2', className)}
      role="group"
      aria-label="Numeric keypad"
    >
      {KEYS.map((key, index) => {
        if (key === '') {
          return <div key={`spacer-${index}`} aria-hidden />;
        }
        if (key === 'back') {
          return (
            <Button
              key="back"
              type="button"
              variant="secondary"
              size="lg"
              className="min-h-12"
              disabled={disabled || value.length === 0}
              aria-label={labels.backspace}
              onClick={() => press('back')}
            >
              <Delete className="size-5" aria-hidden />
            </Button>
          );
        }
        return (
          <Button
            key={key}
            type="button"
            variant="outline"
            size="lg"
            className="min-h-12 font-mono text-xl tabular-nums"
            disabled={disabled}
            onClick={() => press(key)}
          >
            {key}
          </Button>
        );
      })}
    </div>
  );
}
