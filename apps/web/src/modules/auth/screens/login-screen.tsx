import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, UserRound } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  LoadingSpinner,
} from '@saki-operations/ui';
import { useAppTranslation } from '@saki-operations/i18n';

import { useSession } from '@/app/bootstrap/session-provider';
import { fadeUpTransition } from '@/lib/motion';
import { paths } from '@/app/router/paths';
import { AuthApiError } from '@/modules/auth/api/auth-api';

export function LoginScreen() {
  const { t } = useAppTranslation();
  const { login } = useSession();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: boolean; password?: boolean }>({});

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const missingIdentifier = !identifier.trim();
    const missingPassword = !password;
    if (missingIdentifier || missingPassword) {
      setFieldErrors({ identifier: missingIdentifier, password: missingPassword });
      setError(t('auth.errors.required'));
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      await login({ identifier: identifier.trim(), password, rememberMe });
      navigate(paths.home, { replace: true });
    } catch (cause) {
      if (cause instanceof AuthApiError) {
        setError(cause.message);
      } else {
        setError(t('auth.errors.generic'));
      }
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
      <Card
        variant="glass"
        padding="lg"
        className="relative space-y-6 overflow-hidden"
        aria-busy={loading}
      >
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.login.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.login.subtitle')}</p>
        </div>

        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="identifier">{t('auth.login.identifier')}</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="identifier"
                name="identifier"
                autoComplete="username"
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  if (fieldErrors.identifier) setFieldErrors((prev) => ({ ...prev, identifier: false }));
                }}
                placeholder={t('auth.login.identifierPlaceholder')}
                className="pl-9"
                aria-invalid={fieldErrors.identifier || undefined}
                aria-describedby={error ? 'login-error' : undefined}
                disabled={loading}
                error={fieldErrors.identifier}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.login.password')}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: false }));
                }}
                placeholder={t('auth.login.passwordPlaceholder')}
                className="pl-9 pr-11"
                aria-invalid={fieldErrors.password || undefined}
                disabled={loading}
                error={fieldErrors.password}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                disabled={loading}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                aria-label={t('auth.login.rememberMe')}
                disabled={loading}
              />
              <span>{t('auth.login.rememberMe')}</span>
            </label>
            <Link
              to={paths.forgotPassword}
              className={`text-sm font-medium text-primary hover:underline ${loading ? 'pointer-events-none opacity-60' : ''}`}
              tabIndex={loading ? -1 : undefined}
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

          {error ? (
            <p
              id="login-error"
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {t('auth.login.submit')}
          </Button>
        </form>

        {loading ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-background/55 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
            aria-label={t('shell.loading.authentication')}
          >
            <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-5">
              <LoadingSpinner label={t('shell.loading.authentication')} size="md" />
              <p className="text-sm text-muted-foreground">{t('shell.loading.authentication')}</p>
            </div>
          </div>
        ) : null}
      </Card>
    </motion.div>
  );
}
