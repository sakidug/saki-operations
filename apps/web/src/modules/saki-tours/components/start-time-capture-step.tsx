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
        title: t('toursOps.startTime.title'),
        description: t('toursOps.startTime.description'),
        capture: t('toursOps.startTime.capture'),
        capturing: t('toursOps.startTime.capturing'),
        retake: t('toursOps.startTime.retake'),
        photoAlt: t('toursOps.startTime.photoAlt'),
        readOnlyHint: t('toursOps.startTime.readOnlyHint'),
        captureFailed: t('toursOps.startTime.captureFailed'),
        filePrefix: 'start-time',
      }}
    />
  );
}
