# @saki-operations/ocr

Reusable **odometer OCR foundation** for Saki Operations.

Used later by:

- Saki Tours Operations (Trip Logs)
- HHCO Helmet Delivery Operations

This package is **not** tied to either module.

## Capabilities

- Open device camera → capture odometer photo
- Preprocess + OCR (default: Tesseract digital provider)
- Confidence % with low-confidence warning
- Accept / edit manually (photo still attached on failure)
- Best-effort save to gallery / Downloads
- Offline IndexedDB queue for sync

## Replace the OCR engine

```ts
import {
  createOcrProviderRegistry,
  OdometerOcrService,
  type OcrProvider,
} from '@saki-operations/ocr';

const cloudProvider: OcrProvider = {
  id: 'acme-cloud-v1',
  supportedKinds: ['digital'],
  recognize: async (input) => {
    /* call your API */
  },
};

const registry = createOcrProviderRegistry({ digital: cloudProvider });
const service = new OdometerOcrService({ registry });
```

## UI

```tsx
import { OdometerCapture } from '@saki-operations/ocr';

<OdometerCapture onAccepted={(reading) => console.log(reading)} />
```
