import { useCallback, useState } from 'react';
import {
  environmentLabel,
  formatBuildInfoCopy,
  formatBuiltAtLocal,
  type BuildInfo,
} from '@saki-operations/build-info';
import { useAppTranslation } from '@saki-operations/i18n';
import { Button, Card, cn } from '@saki-operations/ui';
import { Check, Copy } from 'lucide-react';

type BuildInfoPanelProps = {
  info: BuildInfo;
  className?: string;
  showCopy?: boolean;
  compact?: boolean;
};

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'text-right text-sm font-semibold text-foreground',
          mono && 'font-mono tabular-nums',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** Reusable build identity card — Home + Settings About. */
export function BuildInfoPanel({
  info,
  className,
  showCopy = true,
  compact = false,
}: BuildInfoPanelProps) {
  const { t, i18n } = useAppTranslation();
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatBuildInfoCopy(info));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [info]);

  return (
    <Card variant="glass" className={cn('p-4 sm:p-5', className)}>
      <div className="mb-3 space-y-0.5">
        <p className="font-display text-lg font-semibold tracking-tight">{info.name}</p>
        {!compact ? (
          <p className="text-xs text-muted-foreground">{t('buildInfo.subtitle')}</p>
        ) : null}
      </div>

      <dl className="space-y-0">
        <Row label={t('buildInfo.version')} value={`v${info.version}`} mono />
        <Row label={t('buildInfo.build')} value={info.build} mono />
        <Row
          label={t('buildInfo.environment')}
          value={environmentLabel(info.environment)}
        />
        <Row
          label={t('buildInfo.built')}
          value={formatBuiltAtLocal(info.builtAt, i18n.language)}
        />
        <Row label={t('buildInfo.syncEngine')} value={`v${info.syncEngine}`} mono />
      </dl>

      {showCopy ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-4 w-full sm:w-auto"
          onClick={() => void onCopy()}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? t('buildInfo.copied') : t('buildInfo.copy')}
        </Button>
      ) : null}
    </Card>
  );
}
