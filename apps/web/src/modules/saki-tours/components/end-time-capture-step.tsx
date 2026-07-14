import { useAppTranslation } from '@saki-operations/i18n';

import { WorkTimeCaptureStep } from './work-time-capture-step';
import type { TimeEvidenceCapture } from '../types';

type EndTimeCaptureStepProps = {
  value: TimeEvidenceCapture | null;
  onChange: (next: TimeEvidenceCapture | null) => void;
  className?: string;
  disabled?: boolean;
};

export function EndTimeCaptureStep(props: EndTimeCaptureStepProps) {
  const { t } = useAppTranslation();

  return (
    <WorkTimeCaptureStep
      {...props}
      labels={{
        title: t('toursOps.endTime.title'),
        description: t('toursOps.endTime.description'),
        capture: t('toursOps.endTime.capture'),
        capturing: t('toursOps.endTime.capturing'),
        retake: t('toursOps.endTime.retake'),
        photoAlt: t('toursOps.endTime.photoAlt'),
        readOnlyHint: t('toursOps.endTime.readOnlyHint'),
        captureFailed: t('toursOps.endTime.captureFailed'),
        filePrefix: 'end-time',
      }}
    />
  );
}
