import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Textarea,
} from '@saki-operations/ui';
import { FileImage, Trash2 } from 'lucide-react';

import { useSession } from '@/app/bootstrap/session-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { paths } from '@/app/router/paths';
import {
  addVehicleDocument,
  canManageVehicles,
  getVehicle,
  removeVehicleDocument,
  updateVehicleNotes,
} from '../lib/vehicle-store';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export function VehicleDetailScreen() {
  const { t, i18n } = useAppTranslation();
  const { vehicleId = '' } = useParams<{ vehicleId: string }>();
  const { user } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const vehicle = useMemo(() => {
    void version;
    return getVehicle(vehicleId);
  }, [vehicleId, version]);

  const canEdit = user ? canManageVehicles(user.role) : false;
  const locale = i18n.language === 'si' ? 'si-LK' : 'en-LK';

  if (!vehicle) {
    return (
      <FadeIn className="mx-auto max-w-lg space-y-4">
        <Card variant="glass" padding="lg">
          <p className="text-sm text-muted-foreground">{t('vehicleOps.detail.missing')}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link to={paths.vehicles}>{t('vehicleOps.detail.back')}</Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  const notes = notesDraft ?? vehicle.maintenanceNotes;
  const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  async function onUpload(files: FileList | null) {
    if (!files?.length || !vehicle) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await fileToDataUrl(file);
        addVehicleDocument({
          vehicleId: vehicle.id,
          name: file.name,
          dataUrl,
        });
      }
      setVersion((n) => n + 1);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function saveNotes() {
    if (!vehicle) return;
    updateVehicleNotes(vehicle.id, notes);
    setNotesDraft(null);
    setVersion((n) => n + 1);
  }

  return (
    <FadeIn className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="rounded-md">
          {t('vehicleOps.badge')}
        </Badge>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{vehicle.name}</h1>
          <Badge variant={vehicle.availability === 'available' ? 'default' : 'secondary'}>
            {t(`vehicleOps.availability.${vehicle.availability}`)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {vehicle.registrationNumber} · {vehicle.make} {vehicle.model} · {vehicle.capacity}{' '}
          {t('vehicleOps.detail.seats')}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card variant="glass" padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('vehicleOps.detail.odometer')}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
            {vehicle.currentOdometerKm.toLocaleString(locale)} {t('vehicleOps.detail.km')}
          </p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('vehicleOps.detail.nextService')}
          </p>
          <p className="mt-1 font-display text-lg font-semibold">
            {formatDate(vehicle.nextServiceDate)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('vehicleOps.detail.nextServiceKm', {
              km: vehicle.nextServiceKm.toLocaleString(locale),
            })}
          </p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('vehicleOps.detail.insurance')}
          </p>
          <p className="mt-1 font-medium">{formatDate(vehicle.insuranceExpiry)}</p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('vehicleOps.detail.license')}
          </p>
          <p className="mt-1 font-medium">{formatDate(vehicle.licenseExpiry)}</p>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>{t('vehicleOps.detail.notesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canEdit ? (
            <>
              <Label htmlFor="vehicle-notes" className="sr-only">
                {t('vehicleOps.detail.notesTitle')}
              </Label>
              <Textarea
                id="vehicle-notes"
                value={notes}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
              />
              <Button type="button" onClick={saveNotes} disabled={notesDraft === null}>
                {t('vehicleOps.detail.saveNotes')}
              </Button>
            </>
          ) : (
            <p className="whitespace-pre-wrap text-sm">
              {vehicle.maintenanceNotes || t('vehicleOps.detail.notesEmpty')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>{t('vehicleOps.detail.documentsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('vehicleOps.detail.documentsHint')}</p>
          {canEdit ? (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="sr-only"
                id="vehicle-doc-upload"
                onChange={(e) => void onUpload(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                loading={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <FileImage className="size-4" aria-hidden />
                {t('vehicleOps.detail.upload')}
              </Button>
            </div>
          ) : null}

          {vehicle.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('vehicleOps.detail.documentsEmpty')}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {vehicle.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="overflow-hidden rounded-xl border border-glass-border bg-muted/20"
                >
                  {doc.dataUrl.startsWith('data:image') ? (
                    <img
                      src={doc.dataUrl}
                      alt={doc.name}
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center text-muted-foreground">
                      <FileImage className="size-8" aria-hidden />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 p-2.5">
                    <span className="truncate text-xs font-medium">{doc.name}</span>
                    {canEdit ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={t('vehicleOps.detail.removeDoc')}
                        onClick={() => {
                          removeVehicleDocument(vehicle.id, doc.id);
                          setVersion((n) => n + 1);
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link to={paths.vehicles}>{t('vehicleOps.detail.back')}</Link>
      </Button>
    </FadeIn>
  );
}
