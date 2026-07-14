import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Button, Card, Input, Label } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { fadeUpTransition } from '@/lib/motion';
import { paths } from '@/app/router/paths';
import { authApi, AuthApiError } from '@/modules/auth/api/auth-api';

export function ForgotPasswordScreen() {
  const { t } = useAppTranslation();
  const reduceMotion = useReducedMotion();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setDevToken(null);

    if (!identifier.trim()) {
      setError(t('auth.errors.required'));
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.forgotPassword({ identifier: identifier.trim() });
      setSuccess(result.message || t('auth.forgot.success'));
      if (result.devResetToken) {
        setDevToken(result.devResetToken);
      }
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
    >
      <Card variant="glass" padding="lg" className="space-y-6" aria-busy={loading}>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.forgot.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.forgot.subtitle')}</p>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              {success}
            </p>
            {devToken ? (
              <p className="break-all rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                {t('auth.forgot.devToken')}: {devToken}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link to={`${paths.resetPassword}${devToken ? `?token=${devToken}` : ''}`}>
                  {t('auth.forgot.continueReset')}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={paths.login}>{t('auth.forgot.backToLogin')}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="identifier">{t('auth.login.identifier')}</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={t('auth.login.identifierPlaceholder')}
                disabled={loading}
                aria-invalid={Boolean(error) || undefined}
              />
            </div>
            {error ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {t('auth.forgot.submit')}
            </Button>
            <Button asChild variant="ghost" size="lg" className="w-full">
              <Link to={paths.login}>{t('auth.forgot.backToLogin')}</Link>
            </Button>
          </form>
        )}
      </Card>
    </motion.div>
  );
}
