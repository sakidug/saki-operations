import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Button, Card, Input, Label } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';
import { AUTH_PASSWORD_MIN_LENGTH } from '@saki-operations/constants';

import { useSession } from '@/app/bootstrap/session-provider';
import { fadeUpTransition } from '@/lib/motion';
import { paths } from '@/app/router/paths';
import { authApi, AuthApiError } from '@/modules/auth/api/auth-api';
import { getAccessToken } from '@/modules/auth/session/token-storage';

export function ChangePasswordScreen() {
  const { t } = useAppTranslation();
  const { logout } = useSession();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('auth.errors.required'));
      return;
    }
    if (newPassword.length < AUTH_PASSWORD_MIN_LENGTH) {
      setError(t('auth.errors.passwordLength', { min: AUTH_PASSWORD_MIN_LENGTH }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setError(t('auth.errors.sessionExpired'));
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(accessToken, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setSuccess(true);
      await logout();
    } catch (cause) {
      setError(cause instanceof AuthApiError ? cause.message : t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeUpTransition(reduceMotion)}
      className="mx-auto w-full max-w-lg"
    >
      <Card variant="glass" padding="lg" className="space-y-6" aria-busy={loading}>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.change.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.change.subtitle')}</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              {t('auth.change.success')}
            </p>
            <Button type="button" size="lg" className="w-full" onClick={() => navigate(paths.login)}>
              {t('auth.forgot.backToLogin')}
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('auth.change.currentPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('auth.change.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.change.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={loading}
              />
            </div>
            {error ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {t('auth.change.submit')}
            </Button>
          </form>
        )}
      </Card>
    </motion.div>
  );
}
