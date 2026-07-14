import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Button, Card, Input, Label } from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';
import { AUTH_PASSWORD_MIN_LENGTH } from '@saki-operations/constants';

import { fadeUpTransition } from '@/lib/motion';
import { paths } from '@/app/router/paths';
import { authApi, AuthApiError } from '@/modules/auth/api/auth-api';

export function ResetPasswordScreen() {
  const { t } = useAppTranslation();
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialToken = useMemo(() => params.get('token') ?? '', [params]);

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token || !password || !confirmPassword) {
      setError(t('auth.errors.required'));
      return;
    }
    if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
      setError(t('auth.errors.passwordLength', { min: AUTH_PASSWORD_MIN_LENGTH }));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password, confirmPassword });
      setSuccess(true);
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
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.reset.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.reset.subtitle')}</p>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              {t('auth.reset.success')}
            </p>
            <Button type="button" size="lg" className="w-full" onClick={() => navigate(paths.login)}>
              {t('auth.forgot.backToLogin')}
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="token">{t('auth.reset.token')}</Label>
              <Input
                id="token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.reset.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.reset.confirmPassword')}</Label>
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
              {t('auth.reset.submit')}
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
