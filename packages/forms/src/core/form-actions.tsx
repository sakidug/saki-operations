import { Button, cn } from '@saki-operations/ui';
import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

export type FormActionsProps = {
  submitLabel?: ReactNode;
  resetLabel?: ReactNode;
  undoLabel?: ReactNode;
  draftLabel?: ReactNode;
  onUndo?: () => void;
  onSaveDraft?: () => void;
  canUndo?: boolean;
  loading?: boolean;
  className?: string;
  showReset?: boolean;
  showUndo?: boolean;
  showDraft?: boolean;
};

/**
 * Standard primary/secondary form actions.
 */
export function FormActions({
  submitLabel = 'Save',
  resetLabel = 'Reset',
  undoLabel = 'Undo',
  draftLabel = 'Save draft',
  onUndo,
  onSaveDraft,
  canUndo,
  loading,
  className,
  showReset = true,
  showUndo = false,
  showDraft = false,
}: FormActionsProps) {
  const form = useFormContext();

  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3',
        className,
      )}
    >
      {showReset ? (
        <Button
          type="button"
          variant="outline"
          disabled={loading || !form.formState.isDirty}
          onClick={() => form.reset()}
        >
          {resetLabel}
        </Button>
      ) : null}
      {showUndo ? (
        <Button type="button" variant="ghost" disabled={loading || !canUndo} onClick={onUndo}>
          {undoLabel}
        </Button>
      ) : null}
      {showDraft ? (
        <Button type="button" variant="secondary" disabled={loading} onClick={onSaveDraft}>
          {draftLabel}
        </Button>
      ) : null}
      <Button type="submit" loading={loading} className="sm:min-w-28">
        {submitLabel}
      </Button>
    </div>
  );
}
