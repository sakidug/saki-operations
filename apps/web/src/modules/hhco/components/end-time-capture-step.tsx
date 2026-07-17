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
        title: t('hhcoOps.endTime.title'),
        description: t('hhcoOps.endTime.description'),
        capture: t('hhcoOps.endTime.capture'),
        capturing: t('hhcoOps.endTime.capturing'),
        retake: t('hhcoOps.endTime.retake'),
        photoAlt: t('hhcoOps.endTime.photoAlt'),
        readOnlyHint: t('hhcoOps.endTime.readOnlyHint'),
        captureFailed: t('hhcoOps.endTime.captureFailed'),
        filePrefix: 'end-time',
      }}
    />
  );
}
