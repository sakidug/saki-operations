import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppTranslation } from '@saki-operations/i18n';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@saki-operations/ui';
import { Camera, Phone, Shield, User } from 'lucide-react';

import { useSession } from '@/app/bootstrap/session-provider';
import { FadeIn } from '@/app/screens/loading/fade-in';
import { paths } from '@/app/router/paths';
import {
  canManageEmployees,
  canViewEmployeeProfile,
  getEmployee,
  setEmployeePhoto,
} from '../lib/employee-store';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export function EmployeeDetailScreen() {
  const { t } = useAppTranslation();
  const { employeeId = '' } = useParams<{ employeeId: string }>();
  const { user } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);

  const employee = useMemo(() => {
    void version;
    return getEmployee(employeeId);
  }, [employeeId, version]);

  const canEditPhoto =
    user &&
    employee &&
    (user.employeeId === employee.employeeId || canManageEmployees(user.permissions));

  const canView =
    user &&
    employee &&
    canViewEmployeeProfile(user.permissions, user.employeeId, employee.employeeId);
  if (!employee || !canView) {
    return (
      <FadeIn className="mx-auto max-w-lg space-y-4">
        <Card variant="glass" padding="lg">
          <p className="text-sm text-muted-foreground">{t('employeeOps.detail.missing')}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link to={paths.employees}>{t('employeeOps.detail.back')}</Link>
          </Button>
        </Card>
      </FadeIn>
    );
  }

  async function onPhotoChange(files: FileList | null) {
    if (!files?.[0] || !employee) return;
    const dataUrl = await fileToDataUrl(files[0]);
    setEmployeePhoto(employee.employeeId, dataUrl);
    setVersion((n) => n + 1);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <FadeIn className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border border-glass-border bg-primary/10 text-primary">
            {employee.photoDataUrl ? (
              <img
                src={employee.photoDataUrl}
                alt={employee.displayName}
                className="size-full object-cover"
              />
            ) : (
              <User className="size-10" aria-hidden />
            )}
          </div>
          {canEditPhoto ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                id="employee-photo"
                onChange={(e) => void onPhotoChange(e.target.files)}
              />
              <Button
                type="button"
                size="icon"
                variant="glass"
                className="absolute -bottom-2 -right-2"
                aria-label={t('employeeOps.detail.uploadPhoto')}
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="size-4" aria-hidden />
              </Button>
            </>
          ) : null}
        </div>
        <div className="space-y-2">
          <Badge variant="secondary" className="rounded-md">
            {t('employeeOps.badge')}
          </Badge>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {employee.displayName}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge>{t(`employeeOps.roles.${employee.role}`)}</Badge>
            <Badge variant="outline">{employee.employeeId}</Badge>
          </div>
        </div>
      </header>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="size-4 text-primary" aria-hidden />
            {t('employeeOps.detail.contactTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t('employeeOps.detail.phone')}</span>
            <a className="font-medium text-primary underline-offset-2 hover:underline" href={`tel:${employee.phone}`}>
              {employee.phone}
            </a>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t('employeeOps.detail.email')}</span>
            <span className="truncate font-medium">{employee.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>{t('employeeOps.detail.emergencyTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t('employeeOps.detail.emergencyName')}</span>
            <span className="font-medium">{employee.emergencyContactName}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t('employeeOps.detail.emergencyPhone')}</span>
            <a
              className="font-medium text-primary underline-offset-2 hover:underline"
              href={`tel:${employee.emergencyContactPhone}`}
            >
              {employee.emergencyContactPhone}
            </a>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-4 text-primary" aria-hidden />
            {t('employeeOps.detail.permissionsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {employee.permissions.map((perm) => (
              <li key={perm}>
                <Badge variant="outline" className="font-mono text-[0.7rem]">
                  {perm}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link to={paths.employees}>{t('employeeOps.detail.back')}</Link>
      </Button>
    </FadeIn>
  );
}
