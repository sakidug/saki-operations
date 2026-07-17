import { useAppTranslation } from '@saki-operations/i18n';

import { WorkTimeCaptureStep } from './work-time-capture-step';
import type { TimeEvidenceCapture } from '../types';

type StartTimeCaptureStepProps = {
  value: TimeEvidenceCapture | null;
  onChange: (next: TimeEvidenceCapture | null) => void;
  className?: string;
  disabled?: boolean;
};

export function StartTimeCaptureStep(props: StartTimeCaptureStepProps) {
  const { t } = useAppTranslation();

  return (
    <WorkTimeCaptureStep
      {...props}
      labels={{
        title: t('hhcoOps.startTime.title'),
        description: t('hhcoOps.startTime.description'),
        capture: t('hhcoOps.startTime.capture'),
        capturing: t('hhcoOps.startTime.capturing'),
        retake: t('hhcoOps.startTime.retake'),
        photoAlt: t('hhcoOps.startTime.photoAlt'),
        readOnlyHint: t('hhcoOps.startTime.readOnlyHint'),
        captureFailed: t('hhcoOps.startTime.captureFailed'),
        filePrefix: 'start-time',
      }}
    />
  );
}
